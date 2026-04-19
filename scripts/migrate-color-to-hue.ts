/**
 * 기존 cover_color / profile_color (hex) → cover_hue / profile_hue (int) 변환
 *
 * 사용법: npx tsx scripts/migrate-color-to-hue.ts [--dry-run]
 *
 * 실행 전 조건: supabase/019_color_hue_add.sql 적용 완료
 * 실행 후: 020_color_hue_drop_hex.sql 적용 가능
 *
 * 멱등성: cover_hue / profile_hue가 이미 설정된 row는 skip.
 *
 * 변환 규칙:
 *   - lists.cover_color   → OKLCH hue (OKLCH 기반 톤이므로 drift 방지)
 *   - users.profile_color → HSL hue   (프로필은 HSL 톤 유지)
 */

// SSL 인증서 이슈 우회 (로컬 스크립트 전용)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { createClient } from '@supabase/supabase-js'
import { oklch } from 'culori'
import * as fs from 'fs'
import * as path from 'path'

// ─── 환경변수 로드 ───
const envPath = path.resolve(__dirname, '../.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, serviceRoleKey)

const DRY_RUN = process.argv.includes('--dry-run')

// ─── hue 변환 함수 (utils.ts와 동일 로직, self-contained) ───

/** hex → HSL hue (0~360, 라운딩 정수) */
function hexToHslHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const d = max - min
  if (d === 0) return 0
  let h = 0
  if (max === r) h = ((g - b) / d + 6) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return Math.round(h * 60)
}

/** hex → OKLCH hue (culori) */
function hexToOklchHue(hex: string): number {
  const c = oklch(hex)
  return Math.round(c?.h ?? 0)
}

// ─── 메인 ───
async function migrate() {
  console.log(`\n=== color → hue 마이그레이션 ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`)

  // 1. lists.cover_color → cover_hue (OKLCH)
  const { data: lists, error: listErr } = await supabase
    .from('lists')
    .select('id, cover_color, cover_hue')
    .not('cover_color', 'is', null)

  if (listErr) { console.error('lists 조회 실패:', listErr); process.exit(1) }

  let listConverted = 0, listSkipped = 0
  for (const row of lists || []) {
    if (row.cover_hue != null) { listSkipped++; continue }
    const hue = hexToOklchHue(row.cover_color)
    console.log(`  list ${row.id}: ${row.cover_color} → ${hue}°`)
    if (!DRY_RUN) {
      const { error } = await supabase.from('lists').update({ cover_hue: hue }).eq('id', row.id)
      if (error) { console.error(`  ! 실패: ${error.message}`); continue }
    }
    listConverted++
  }

  // 2. users.profile_color → profile_hue (HSL)
  const { data: users, error: userErr } = await supabase
    .from('users')
    .select('id, profile_color, profile_hue')
    .not('profile_color', 'is', null)

  if (userErr) { console.error('users 조회 실패:', userErr); process.exit(1) }

  let userConverted = 0, userSkipped = 0
  for (const row of users || []) {
    if (row.profile_hue != null) { userSkipped++; continue }
    const hue = hexToHslHue(row.profile_color)
    console.log(`  user ${row.id}: ${row.profile_color} → ${hue}°`)
    if (!DRY_RUN) {
      const { error } = await supabase.from('users').update({ profile_hue: hue }).eq('id', row.id)
      if (error) { console.error(`  ! 실패: ${error.message}`); continue }
    }
    userConverted++
  }

  console.log(`\n=== 완료 ===`)
  console.log(`  lists: 변환 ${listConverted}, skip ${listSkipped}`)
  console.log(`  users: 변환 ${userConverted}, skip ${userSkipped}`)
  if (DRY_RUN) console.log(`  (dry-run — DB 미반영)`)
}

migrate().catch((e) => { console.error(e); process.exit(1) })
