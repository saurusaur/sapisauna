/**
 * 카톡 추출 데이터 → DB 반영 스크립트
 * 온도, 태그, 메모, 가격 업데이트
 *
 * 사용법: npx tsx scripts/sync-katalk-data.ts [--dry-run]
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
// CSV 간단 파서 (외부 모듈 불필요)
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter(l => l.trim())
  if (lines.length === 0) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^\ufeff/, ''))
  return lines.slice(1).map(line => {
    const vals = line.split(',')
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim() })
    return obj
  })
}

const envPath = path.resolve(__dirname, '../.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const ADMIN_ID = '23c431c3-9b23-4779-bb27-13472e58090a'
const DRY_RUN = process.argv.includes('--dry-run')

// ─── CSV 이름 → DB place_id 매핑 ───
async function buildNameMap(): Promise<Record<string, { place_id: string; db_name: string }>> {
  const seeds = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'seed-data-unified.json'), 'utf-8'))

  // name + name_alias 모두 매핑
  const map: Record<string, { place_id: string; db_name: string }> = {}
  for (const s of seeds) {
    if (!s.place_id) continue
    map[s.name.toLowerCase()] = { place_id: s.place_id, db_name: s.name }
    if (s.name_alias) {
      map[s.name_alias.toLowerCase()] = { place_id: s.place_id, db_name: s.name }
    }
  }

  // 수동 매핑 (미매칭 3건 + 줄임말)
  const MANUAL: Record<string, string> = {
    '더파크스파랜드': '더파크 스파랜드',
    '상암불꽃': '상암불꽃사우나',
    '웨스틴조선': '웨스틴 조선 서울',
    '상암불꽃': '상암불꽃사우나',
  }
  for (const [csv, db] of Object.entries(MANUAL)) {
    const seed = seeds.find((s: any) => s.name === db || s.name_alias === db)
    if (seed?.place_id) {
      map[csv.toLowerCase()] = { place_id: seed.place_id, db_name: seed.name }
    }
  }

  return map
}

// ─── 부분 매칭 ───
function findMatch(csvName: string, nameMap: Record<string, { place_id: string; db_name: string }>): { place_id: string; db_name: string } | null {
  const key = csvName.toLowerCase()

  // 정확히 매칭
  if (nameMap[key]) return nameMap[key]

  // 부분 매칭
  for (const [mapKey, val] of Object.entries(nameMap)) {
    if (key.includes(mapKey) || mapKey.includes(key)) return val
  }

  return null
}

// ─── 온도 파싱 (범위값 → 첫 번째 값) ───
function parseTemp(val: string | undefined): number | null {
  if (!val || !val.trim()) return null
  // "42|43" → 42, "16|22|23" → 16 (첫 번째)
  const first = val.split('|')[0].trim()
  const num = parseInt(first)
  return isNaN(num) ? null : num
}

// ─── 태그 정규화 ───
const TAG_NORMALIZE: Record<string, string> = {
  'seshin': 'scrub',
  'outdoor-air': 'outdoor-rest',
  'outdoor-bath': 'open-air-bath',
  'warm-bath': 'hot-bath',
  'store': 'food',
  'charcoal': 'bulgama',
}

function normalizeTags(raw: string): string[] {
  if (!raw) return []
  return raw.split(',')
    .map(t => t.trim())
    .filter(t => t && t !== 'pool')
    .map(t => TAG_NORMALIZE[t] || t)
}

// ─── 메인 ───
async function main() {
  const csvPath = path.resolve(__dirname, '../docs/research/katalk-facility-detail-v2.csv')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const records = parseCSV(csvContent)

  const nameMap = await buildNameMap()

  console.log(`\n♨️ 카톡 데이터 DB 반영 ${DRY_RUN ? '(DRY RUN)' : ''}`)
  console.log(`   CSV: ${records.length}건\n`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const r of records) {
    const csvName = r['시설명']
    const match = findMatch(csvName, nameMap)

    if (!match) {
      console.log(`  ⏭️  ${csvName} — 매칭 없음`)
      skipped++
      continue
    }

    const { place_id, db_name } = match

    // 온도 파싱
    const hotBath = parseTemp(r['온탕온도'])
    const veryHotBath = parseTemp(r['열탕온도'])
    const coldBath = parseTemp(r['냉탕온도'])
    const dryTemp = parseTemp(r['건식온도'])
    const wetTemp = parseTemp(r['습식온도'])
    const openAirTemp = parseTemp(r['노천탕온도'])

    // 노천탕 로직: 온탕 없으면 노천탕 → 온탕으로
    const finalHotBath = hotBath ?? openAirTemp

    // 태그
    const newTags = normalizeTags(r['시설태그'])

    // 메모
    const cleanMemo = r['수질청결메모']?.trim() || ''
    const review = r['후기발췌']?.trim() || ''
    const combinedMemo = [cleanMemo, review].filter(Boolean).join(' | ').substring(0, 500)

    // 가격
    const priceStr = r['입장료']?.trim() || ''
    const price = priceStr ? parseInt(priceStr.replace(/[^0-9]/g, '')) : null

    const hasTemp = finalHotBath || veryHotBath || coldBath || dryTemp || wetTemp
    const hasTags = newTags.length > 0
    const hasMemo = combinedMemo.length > 0
    const hasPrice = price && price > 0

    if (!hasTemp && !hasTags && !hasMemo && !hasPrice) {
      skipped++
      continue
    }

    try {
      if (!DRY_RUN) {
        // 1. 태그 합집합 → places.facilities
        if (hasTags) {
          const { data: place } = await supabase
            .from('places')
            .select('facilities')
            .eq('id', place_id)
            .single()

          const existing = (place?.facilities as string[]) || []
          const merged = Array.from(new Set([...existing, ...newTags]))

          if (merged.length > existing.length) {
            await supabase.from('places')
              .update({ facilities: merged })
              .eq('id', place_id)
          }
        }

        // 2. 어드민 로그 온도 업데이트
        if (hasTemp || hasPrice || hasMemo) {
          const { data: log } = await supabase
            .from('logs')
            .select('id, hot_bath_temp, cold_bath_temp, sauna_temp')
            .eq('user_id', ADMIN_ID)
            .eq('place_id', place_id)
            .single()

          if (log) {
            // logs: 기존 값 없을 때만 업데이트
            const logUpdate: Record<string, any> = {}
            if (finalHotBath && !log.hot_bath_temp) logUpdate.hot_bath_temp = finalHotBath
            if (coldBath && !log.cold_bath_temp) logUpdate.cold_bath_temp = coldBath
            if (dryTemp && !log.sauna_temp) logUpdate.sauna_temp = dryTemp

            if (Object.keys(logUpdate).length > 0) {
              await supabase.from('logs').update(logUpdate).eq('id', log.id)
            }

            // deep_logs
            const { data: deep } = await supabase
              .from('deep_logs')
              .select('very_hot_bath_temp, wet_sauna_temp, cost, memo')
              .eq('log_id', log.id)
              .single()

            if (deep) {
              const deepUpdate: Record<string, any> = {}
              if (veryHotBath && !deep.very_hot_bath_temp) {
                deepUpdate.very_hot_bath_temp = veryHotBath
                deepUpdate.has_very_hot_bath = true
              }
              if (wetTemp && !deep.wet_sauna_temp) {
                deepUpdate.wet_sauna_temp = wetTemp
                deepUpdate.has_wet_sauna = true
              }
              if (hasPrice && !deep.cost) {
                deepUpdate.cost = price
              }
              if (hasMemo && (!deep.memo || deep.memo.length < combinedMemo.length)) {
                deepUpdate.memo = combinedMemo
              }

              if (Object.keys(deepUpdate).length > 0) {
                await supabase.from('deep_logs').update(deepUpdate).eq('log_id', log.id)
              }
            }
          }
        }
      }

      const changes = []
      if (finalHotBath) changes.push(`온${finalHotBath}`)
      if (veryHotBath) changes.push(`열${veryHotBath}`)
      if (coldBath) changes.push(`냉${coldBath}`)
      if (dryTemp) changes.push(`건${dryTemp}`)
      if (wetTemp) changes.push(`습${wetTemp}`)
      if (hasTags) changes.push(`태그${newTags.length}`)
      if (hasMemo) changes.push('메모')
      if (hasPrice) changes.push(`₩${price}`)

      console.log(`  ✅ ${db_name.substring(0, 25).padEnd(25)} | ${changes.join(' ')}`)
      updated++
    } catch (err) {
      console.error(`  ❌ ${db_name}: ${err}`)
      failed++
    }

    await new Promise(r => setTimeout(r, 100))
  }

  console.log(`
════════════════════════════════
♨️ 카톡 데이터 반영 완료 ${DRY_RUN ? '(DRY RUN)' : ''}
────────────────────────────────
  반영: ${updated}건
  스킵: ${skipped}건
  실패: ${failed}건
════════════════════════════════
  `)
}

main().catch(console.error)
