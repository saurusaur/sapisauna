/**
 * 지도명 sync 스크립트
 * - 한국: Naver API 검색 → 지도명 확보 → DB + JSON 업데이트
 * - 해외: Google API 검색 → 영문 지도명 확보 → DB + JSON 업데이트
 * - 수동 확인 완료 건: SEARCH_OVERRIDES로 정확한 쿼리 지정
 *
 * 사용법: npx tsx scripts/sync-names.ts [--dry-run]
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(__dirname, '../.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const naverClientId = process.env.NAVER_CLIENT_ID!
const naverClientSecret = process.env.NAVER_CLIENT_SECRET!
const googleApiKey = process.env.GOOGLE_PLACES_API_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey)
const DRY_RUN = process.argv.includes('--dry-run')

// ─── 수동 매칭 오버라이드 (검색 쿼리 지정) ───
const NAVER_OVERRIDES: Record<string, string> = {
  '관악사우나': '관악24시불가마사우나',
  '골드로즈사우나': '골드로즈사우나 선릉',
  '석정 휴스파': '석정온천 휴스파',
  '허심청': '허심청 동래',
  '풍림사우나': '풍림24시불가마사우나 마포',
  '백제인삼사우나': '백제불한증막 인삼사우나 송파',
  '석천24시사우나': '석천24시사우나 의정부',
  '라성스파': '라성보석사우나 성수',
  '보리사우나': '보리여성불한증막',
  '면역공방 명동점': '면역공방 명동',
  '광주 온유재스파 상무점': '온유재스파 상무',
  '신세계 센텀 트리니티 스파': '트리니티스파 센텀시티',
  '초정약수온천': '초정약수원탕',
  '클럽디 오아시스 부산': '클럽디오아시스 부산',
  '파크하비오 워터킹덤&스파': '파크하비오 워터킹덤 송파',
  '필예온천': '필례 게르마늄 온천',
  '여수 디오션리조트 사우나': '디오션 스파 여수',
  '여수 히든베이호텔 사우나': '히든베이호텔 여수',
  '도미인강남': '도미인 서울 강남',
  '온양관광호텔 대온천탕': '온양관광호텔',
  '하남사우나': '하남사우나 용산',
  '더앤온천': '더앤리조트 양양',
}

// 이미 수정된 것 + 오매칭 방지 + 현재 이름 유지
const SKIP_NAMES = new Set([
  // 이미 DB에 정확한 이름이 들어간 것
  '더 리버사이드 호텔 더 메디스파', '안토', '그랜드워커힐서울',
  '더앤리조트스파', '히든베이호텔',
  '단오풍정', '동양사우나', '천호목욕탕',
  'Midorinokaze Resort Kitayuzawa', 'TOTOPA Toritsu Meiji Koen',
  'Shiriuchi Onsen Kokyu no Ma',
  // 오매칭 방지 (검색 결과가 다른 시설)
  '강남목욕탕', 'The Sauna', '네이처스파', '스파마린', '천성산온천',
  '유천스파', '성성호수사우나',
  // 일본어 혼합 방지 (현재 영문명 유지)
  'KIWAMI SAUNA Osu', 'SAUNA SAKURADO', 'sauna kolme kylä',
  // 부가정보 붙는 것 방지
  'AIRE Ancient Baths', '스파앳홈',
  // 다른 지점 매칭 방지
  '솔로사우나레포',
  // 부속시설명 매칭
  '소노캄 여수',
  // 2층여탕매점 같은 부가정보
  '석천24시사우나',
  // 율암온천 → 이남장 (다른 시설)
  '율암온천',
])

// ─── API 검색 ───
async function searchNaver(query: string): Promise<{ name: string; address: string } | null> {
  const url = new URL('https://openapi.naver.com/v1/search/local.json')
  url.searchParams.set('query', query)
  url.searchParams.set('display', '1')

  const res = await fetch(url.toString(), {
    headers: {
      'X-Naver-Client-Id': naverClientId,
      'X-Naver-Client-Secret': naverClientSecret,
    },
  })
  const data = await res.json()
  const item = data.items?.[0]
  if (!item) return null

  return {
    name: item.title.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"'),
    address: item.roadAddress || item.address,
  }
}

async function searchGoogle(query: string): Promise<{ name: string; address: string } | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
  url.searchParams.set('query', query)
  url.searchParams.set('language', 'en')
  url.searchParams.set('key', googleApiKey)

  const res = await fetch(url.toString())
  const data = await res.json()
  const item = data.results?.[0]
  if (!item) return null

  return {
    name: item.name,
    address: item.formatted_address,
  }
}

// ─── 메인 ───
async function main() {
  const seedPath = path.resolve(__dirname, 'seed-data-unified.json')
  const seeds = JSON.parse(fs.readFileSync(seedPath, 'utf-8'))

  console.log(`\n📛 지도명 sync ${DRY_RUN ? '(DRY RUN)' : ''}`)
  console.log(`   총 ${seeds.length}건\n`)

  let updated = 0
  let skipped = 0
  let failed = 0
  const changes: Array<{ old: string; mapName: string; placeId: string }> = []

  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i]
    const progress = `[${i + 1}/${seeds.length}]`

    // 이미 수정된 것 스킵
    if (SKIP_NAMES.has(seed.name)) {
      skipped++
      continue
    }

    try {
      const isKorean = seed.source !== 'google'
      let mapResult: { name: string; address: string } | null = null

      if (isKorean) {
        const query = NAVER_OVERRIDES[seed.name] ?? seed.name
        mapResult = await searchNaver(query)
      } else {
        const query = seed.name_local ?? seed.name
        mapResult = await searchGoogle(query)
      }

      if (!mapResult) {
        console.log(`${progress} ⏭️  ${seed.name} — 검색 결과 없음`)
        skipped++
        await new Promise(r => setTimeout(r, 150))
        continue
      }

      const mapName = mapResult.name

      if (seed.name === mapName) {
        skipped++
        await new Promise(r => setTimeout(r, 150))
        continue
      }

      // 변경 기록
      changes.push({ old: seed.name, mapName, placeId: seed.place_id })

      if (!DRY_RUN && seed.place_id) {
        // DB 업데이트
        await supabase
          .from('place_sources')
          .update({ name_original: mapName })
          .eq('place_id', seed.place_id)

        // JSON 업데이트
        if (!seed.name_alias) seed.name_alias = seed.name
        seed.name = mapName
      }

      console.log(`${progress} ✏️  ${seed.name_alias || seed.name} → ${mapName}`)
      updated++

    } catch (err) {
      console.error(`${progress} ❌ ${seed.name}: ${err}`)
      failed++
    }

    await new Promise(r => setTimeout(r, 150))
  }

  if (!DRY_RUN) {
    fs.writeFileSync(seedPath, JSON.stringify(seeds, null, 2), 'utf-8')
  }

  console.log(`
════════════════════════════════
📛 지도명 sync 완료 ${DRY_RUN ? '(DRY RUN)' : ''}
────────────────────────────────
  변경: ${updated}건
  스킵: ${skipped}건 (동일 or 이미 수정됨)
  실패: ${failed}건
════════════════════════════════
  `)
}

main().catch(console.error)
