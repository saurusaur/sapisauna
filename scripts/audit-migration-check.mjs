/**
 * 마이그레이션 무손실 기계 대조 — 구(구컬럼+deep_logs) → 신(평탄캐시+log_blocks)
 * 규칙: R1 rename / R2 deep 흡수 / R3 세신 분리 / R4 store→snack / R5 food_eaten(폐기 INFO)
 *       R6 유저 블록 보존(온도·시간·평가) / R7 어드민=전부 is_extra / R8 is_extra 규칙
 * 실행: node scripts/audit-migration-check.mjs  → tmp/migration-audit/findings.json
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs'

const TRIBE_ROUTINE = {
  saunner: ['dry-sauna', 'steam-sauna', 'cold-bath'],
  bather: ['hot-bath', 'very-hot-bath', 'cold-bath'],
  jimi: ['bulgama'],
}
const TEMP_CACHE = [
  ['dry_sauna_temp', 'dry-sauna'], ['steam_sauna_temp', 'steam-sauna'], ['hot_bath_temp', 'hot-bath'],
  ['very_hot_bath_temp', 'very-hot-bath'], ['bulgama_temp', 'bulgama'], ['salt_sauna_temp', 'salt-sauna'],
  ['open_air_bath_temp', 'open-air-bath'], ['cold_bath_temp', 'cold-bath'], ['ice_bath_temp', 'ice-bath'],
  ['ice_room_temp', 'ice-room'],
]
const SUBMERSION = new Set(['cold-bath', 'ice-bath'])

const out = []
const add = (e, kind, field, oldV, newV, note = '') =>
  out.push({ bucket: e._bucket, log_id: e.log.id, place: e.place_name, is_admin: e.is_admin, kind, field, old: oldV ?? null, new: newV ?? null, note })

for (const f of readdirSync('tmp/migration-audit').filter(f => f.startsWith('bucket-'))) {
  const entries = JSON.parse(readFileSync(`tmp/migration-audit/${f}`, 'utf8'))
  for (const e of entries) {
    e._bucket = f
    const { log: l, deep: d, blocks: bs } = e

    // R1 rename: 구컬럼 값이 있으면 신컬럼에 보존(신값 우선이라 다르면 MISMATCH-편집?)
    for (const [o, n] of [['sauna_temp', 'dry_sauna_temp'], ['jjim_temp', 'bulgama_temp'], ['pause_time', 'rest_time']]) {
      if (l[o] != null && l[n] == null) add(e, 'LOSS', `${o}→${n}`, l[o], null)
      else if (l[o] != null && l[n] !== l[o]) add(e, 'MISMATCH', `${o}→${n}`, l[o], l[n], '신값 우선(편집?) 확인')
    }
    // R2 deep 흡수
    if (d) {
      for (const fld of ['cleanliness', 'crowd', 'companion', 'cost', 'memo']) {
        if (d[fld] != null && l[fld] == null) add(e, 'LOSS', `deep.${fld}`, d[fld], null)
        else if (d[fld] != null && l[fld] !== d[fld]) add(e, 'MISMATCH', `deep.${fld}`, d[fld], l[fld], '신값 우선(편집?) 확인')
      }
      if (d.has_very_hot_bath && d.very_hot_bath_temp != null && l.very_hot_bath_temp == null) add(e, 'LOSS', 'deep.very_hot_bath_temp', d.very_hot_bath_temp, null)
      if (d.has_ice_bath && d.ice_bath_temp != null && l.ice_bath_temp == null) add(e, 'LOSS', 'deep.ice_bath_temp', d.ice_bath_temp, null)
      // R3 세신 분리
      if (d.has_scrub) {
        const t = d.scrub_types ?? []
        const hasS = t.includes('scrub') || t.length === 0
        const hasM = t.includes('massage')
        if (hasS) {
          if (d.scrub_satisfaction != null && l.scrub_score == null) add(e, 'LOSS', 'deep.scrub_satisfaction→scrub_score', d.scrub_satisfaction, null)
          if (d.scrub_cost != null && l.scrub_cost == null) add(e, 'LOSS', 'deep.scrub_cost→scrub_cost', d.scrub_cost, null)
          const expType = hasM ? 'withmassage' : 'basic'
          if (l.scrub_type !== expType) add(e, 'MISMATCH', 'scrub_type', expType, l.scrub_type)
        } else if (hasM) {
          if (d.scrub_satisfaction != null && l.massage_score == null) add(e, 'LOSS', 'deep.scrub_satisfaction→massage_score', d.scrub_satisfaction, null)
          if (d.scrub_cost != null && l.massage_cost == null) add(e, 'LOSS', 'deep.scrub_cost→massage_cost', d.scrub_cost, null)
        }
      }
      // R4 store→snack
      if (d.has_store) {
        if (d.store_score != null && l.snack_score == null) add(e, 'LOSS', 'deep.store_score→snack_score', d.store_score, null)
        if (d.store_memo != null && l.snack_memo == null) add(e, 'LOSS', 'deep.store_memo→snack_memo', d.store_memo, null)
      }
      // R5 food_eaten 폐기(설계)
      if (Array.isArray(d.food_eaten) && d.food_eaten.length) add(e, 'INFO', 'deep.food_eaten(폐기 확정)', d.food_eaten.join(','), null)
    }

    const blockOf = type => bs.filter(b => b.block_type === type)
    if (e.is_admin) {
      // R7 어드민: 온도 캐시 → is_extra 블록, 루틴 블록 금지
      for (const [cache, type] of TEMP_CACHE) {
        if (l[cache] != null && !blockOf(type).some(b => b.temp === l[cache] && b.is_extra)) add(e, 'RULE', `admin ${cache}→extra block`, l[cache], blockOf(type)[0]?.temp ?? null)
      }
      for (const b of bs) if (!b.is_extra) add(e, 'RULE', `admin routine block ${b.block_type}`, null, b.id)
    } else {
      // R6 유저 블록 보존
      for (const [cache, type] of TEMP_CACHE) {
        if (l[cache] != null && !blockOf(type).some(b => b.temp === l[cache])) add(e, 'LOSS', `${cache}→block(${type})`, l[cache], blockOf(type)[0]?.temp ?? null)
      }
      const heatDur = bs.filter(b => b.category === 'heat' && !b.is_extra).reduce((s, b) => s + (b.duration_sec ?? 0), 0)
      if (l.heat_time != null && heatDur === 0) add(e, 'LOSS', 'heat_time→heat blocks', l.heat_time, 0)
      else if (l.heat_time != null && Math.round(heatDur / 60) !== l.heat_time) add(e, 'MISMATCH', 'heat_time vs Σheat', l.heat_time, Math.round(heatDur / 60))
      const iceDur = bs.filter(b => SUBMERSION.has(b.block_type)).reduce((s, b) => s + (b.duration_sec ?? 0), 0)
      if (l.ice_time != null && iceDur === 0) add(e, 'LOSS', 'ice_time→ice blocks', l.ice_time, 0)
      else if (l.ice_time != null && iceDur !== l.ice_time) add(e, 'MISMATCH', 'ice_time vs Σ침수', l.ice_time, iceDur)
      const restDur = bs.filter(b => b.category === 'rest').reduce((s, b) => s + (b.duration_sec ?? 0), 0)
      if (l.rest_time != null && restDur === 0) add(e, 'LOSS', 'rest_time→rest blocks', l.rest_time, 0)
      else if (l.rest_time != null && Math.round(restDur / 60) !== l.rest_time) add(e, 'MISMATCH', 'rest_time vs Σrest', l.rest_time, Math.round(restDur / 60))
      if (l.rest_quality != null && !bs.some(b => ['rest', 'outdoor-rest', 'indoor-rest', 'sleep-room'].includes(b.block_type) && b.score === l.rest_quality)) add(e, 'LOSS', 'rest_quality→rest block score', l.rest_quality, null)
      if (l.scrub_score != null && !blockOf('scrub').some(b => b.score === l.scrub_score)) add(e, 'LOSS', 'scrub_score→block', l.scrub_score, null)
      if (l.scrub_cost != null && !blockOf('scrub').some(b => b.cost === l.scrub_cost)) add(e, 'LOSS', 'scrub_cost→block', l.scrub_cost, null)
      if (l.massage_score != null && !blockOf('massage').some(b => b.score === l.massage_score)) add(e, 'LOSS', 'massage_score→block', l.massage_score, null)
      if (l.snack_score != null && !blockOf('snack').some(b => b.score === l.snack_score)) add(e, 'LOSS', 'snack_score→block', l.snack_score, null)
      if (l.snack_memo != null && !blockOf('snack').some(b => b.memo === l.snack_memo)) add(e, 'LOSS', 'snack_memo→block', l.snack_memo, null)
      // R8 is_extra 규칙
      const routineSet = new Set(TRIBE_ROUTINE[l.tribe_id] ?? [])
      for (const b of bs) {
        const tempOnly = b.temp != null && b.duration_sec == null && b.score == null && b.cost == null && b.memo == null
        if (tempOnly && !routineSet.has(b.block_type) && !b.is_extra) add(e, 'RULE', `temp-only 비기본시설인데 routine: ${b.block_type}`, b.temp, null)
        if (b.block_type === 'scrub' && b.score == null && (b.variant ?? 'basic') === 'basic' && !b.is_extra) add(e, 'RULE', 'score-null 기본세신인데 routine', b.cost, null)
      }
    }
  }
}

const summary = {}
for (const o of out) summary[o.kind] = (summary[o.kind] ?? 0) + 1
writeFileSync('tmp/migration-audit/findings.json', JSON.stringify({ summary, findings: out }, null, 1))
console.log(JSON.stringify(summary), '| total findings:', out.length)
const byKindField = {}
for (const o of out) { const k = `${o.kind} ${o.field}`; byKindField[k] = (byKindField[k] ?? 0) + 1 }
console.log(Object.entries(byKindField).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => `${v}× ${k}`).join('\n'))
