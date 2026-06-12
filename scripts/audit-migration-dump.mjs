/**
 * 마이그레이션 무손실 대조용 덤프 — 구 스키마(구컬럼+deep_logs) vs 신 스키마(평탄캐시+log_blocks)
 * 사우나명 기준 버킷 분할 → tmp/migration-audit/bucket-NN.json (커밋 금지, 로컬 검증용)
 * 실행: node scripts/audit-migration-dump.mjs [버킷수=8]
 */
import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { execFileSync } from 'child_process'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)
const URL = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY

// Node fetch가 샌드박스 프록시를 안 타서 curl 사용
function fetchAll(table, select = '*') {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const out = execFileSync('curl', [
      '-sS', `${URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&offset=${from}&limit=1000`,
      '-H', `apikey: ${KEY}`, '-H', `Authorization: Bearer ${KEY}`,
    ], { maxBuffer: 64 * 1024 * 1024 }).toString()
    const data = JSON.parse(out)
    if (!Array.isArray(data)) throw new Error(`${table}: ${out.slice(0, 200)}`)
    rows.push(...data)
    if (data.length < 1000) break
  }
  return rows
}

const logs = fetchAll('logs')
const deepLogs = fetchAll('deep_logs')
const blocks = fetchAll('log_blocks')
const places = fetchAll('places', 'id')
const sources = fetchAll('place_sources', 'place_id,source,name_original')

const nameByPlace = {}
for (const s of sources) {
  // naver 우선, 없으면 첫 소스 (toLogWithPlace와 동일 규칙)
  if (!nameByPlace[s.place_id] || s.source === 'naver') nameByPlace[s.place_id] = s.name_original
}

const deepByLog = Object.fromEntries(deepLogs.map(d => [d.log_id, d]))
const blocksByLog = {}
for (const b of blocks) (blocksByLog[b.log_id] ??= []).push(b)

const ADMIN = '23c431c3-9b23-4779-bb27-13472e58090a'
const entries = logs.map(l => ({
  place_name: nameByPlace[l.place_id] || '(이름없음)',
  is_admin: l.user_id === ADMIN,
  log: l,
  deep: deepByLog[l.id] ?? null,
  blocks: (blocksByLog[l.id] ?? []).sort((a, b) => a.seq - b.seq),
})).sort((a, b) => a.place_name.localeCompare(b.place_name, 'ko'))

const N = Number(process.argv[2] || 8)
const size = Math.ceil(entries.length / N)
mkdirSync('tmp/migration-audit', { recursive: true })
const meta = []
for (let i = 0; i < N; i++) {
  const chunk = entries.slice(i * size, (i + 1) * size)
  if (!chunk.length) break
  const file = `tmp/migration-audit/bucket-${String(i + 1).padStart(2, '0')}.json`
  writeFileSync(file, JSON.stringify(chunk, null, 1))
  meta.push({
    file,
    logs: chunk.length,
    nameRange: `${chunk[0].place_name} ~ ${chunk[chunk.length - 1].place_name}`,
    admin: chunk.filter(e => e.is_admin).length,
    withDeep: chunk.filter(e => e.deep).length,
    blocks: chunk.reduce((s, e) => s + e.blocks.length, 0),
  })
}
writeFileSync('tmp/migration-audit/meta.json', JSON.stringify({
  totals: { logs: logs.length, deep_logs: deepLogs.length, log_blocks: blocks.length },
  buckets: meta,
}, null, 2))
console.log(JSON.stringify({ totals: { logs: logs.length, deep_logs: deepLogs.length, log_blocks: blocks.length }, buckets: meta }, null, 2))
