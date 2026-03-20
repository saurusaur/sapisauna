/**
 * 시드 데이터 벌크 등록 스크립트
 *
 * 사용법: npx tsx scripts/seed-places.ts [--dry-run] [--skip-logs]
 *
 * --dry-run: DB에 쓰지 않고 API 검색+매칭만 수행
 * --skip-logs: 어드민 로그 생성 건너뛰기
 *
 * 환경변수 필요:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
 *   GOOGLE_PLACES_API_KEY
 */

// SSL 인증서 이슈 우회 (로컬 스크립트 전용)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { createClient } from '@supabase/supabase-js'
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
const naverClientId = process.env.NAVER_CLIENT_ID!
const naverClientSecret = process.env.NAVER_CLIENT_SECRET!
const googleApiKey = process.env.GOOGLE_PLACES_API_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey)

const ADMIN_USER_ID = '23c431c3-9b23-4779-bb27-13472e58090a'
const DRY_RUN = process.argv.includes('--dry-run')
const SKIP_LOGS = process.argv.includes('--skip-logs')

// ─── 타입 ───
interface SeedItem {
  name: string
  name_local?: string
  address?: string
  region?: string
  facility_type: string
  bath_policy: string
  facilities?: string[]
  source: string
  memo?: string
  cost?: number
  hot_bath_temp?: number
  very_hot_bath_temp?: number
  cold_bath_temp?: number
  sauna_temp?: number
  wet_sauna_temp?: number
  review_bath_gender?: string
  community_mentions?: number
  _price_child?: number
  // 등록 후 기록
  place_id?: string
  match_status?: string
}

interface SearchResult {
  name: string
  address: string
  latitude: number
  longitude: number
  external_id: string
  source: 'naver' | 'google'
}

// ─── API 검색 ───
async function searchNaver(query: string): Promise<SearchResult[]> {
  const url = new URL('https://openapi.naver.com/v1/search/local.json')
  url.searchParams.set('query', query)
  url.searchParams.set('display', '5')

  const res = await fetch(url.toString(), {
    headers: {
      'X-Naver-Client-Id': naverClientId,
      'X-Naver-Client-Secret': naverClientSecret,
    },
  })

  if (!res.ok) throw new Error(`Naver API ${res.status}`)
  const data = await res.json()

  return (data.items || []).map((item: any) => {
    const x = parseInt(item.mapx) / 10000000
    const y = parseInt(item.mapy) / 10000000
    return {
      name: item.title.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&'),
      address: item.roadAddress || item.address,
      latitude: y,
      longitude: x,
      external_id: `${item.mapx}_${item.mapy}`,
      source: 'naver' as const,
    }
  })
}

async function searchGoogle(query: string): Promise<SearchResult[]> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
  url.searchParams.set('query', query)
  url.searchParams.set('language', 'en')
  url.searchParams.set('key', googleApiKey)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Google API ${res.status}`)
  const data = await res.json()

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google API: ${data.status}`)
  }

  return (data.results || []).map((item: any) => ({
    name: item.name,
    address: item.formatted_address,
    latitude: item.geometry?.location?.lat,
    longitude: item.geometry?.location?.lng,
    external_id: item.place_id,
    source: 'google' as const,
  }))
}

// ─── 매칭 로직 ───
function similarity(a: string, b: string): number {
  const normalize = (s: string) => s.replace(/[\s\-_·&()（）]/g, '').toLowerCase()
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 1.0
  if (na.includes(nb) || nb.includes(na)) return 0.8
  // 글자 겹침 비율
  const set1 = new Set(na)
  const set2 = new Set(nb)
  const intersection = Array.from(set1).filter(c => set2.has(c)).length
  return intersection / Math.max(set1.size, set2.size)
}

function pickBestMatch(seed: SeedItem, results: SearchResult[]): { match: SearchResult; confidence: 'high' | 'medium' | 'low' } | null {
  if (results.length === 0) return null

  // 이름 유사도 계산
  const scored = results.map(r => ({
    result: r,
    nameSim: similarity(seed.name, r.name),
    addrSim: seed.address ? similarity(seed.address, r.address) : 0,
  }))

  // 이름 유사도 순 정렬
  scored.sort((a, b) => (b.nameSim + b.addrSim) - (a.nameSim + a.addrSim))
  const best = scored[0]

  if (best.nameSim >= 0.8) return { match: best.result, confidence: 'high' }
  if (best.nameSim >= 0.5 || best.addrSim >= 0.5) return { match: best.result, confidence: 'medium' }
  if (scored.length === 1) return { match: best.result, confidence: 'low' }

  return null
}

// ─── 국가코드 추출 ───
const COUNTRY_MAP: Record<string, string> = {
  'japan': 'JP', 'finland': 'FI', 'germany': 'DE', 'estonia': 'EE',
  'united states': 'US', 'usa': 'US', 'south korea': 'KR', 'spain': 'ES',
}

function extractCountryCode(address: string): string {
  const last = address.split(',').pop()?.trim().toLowerCase() ?? ''
  return COUNTRY_MAP[last] ?? 'KR'
}

// ─── DB 등록 ───
async function registerPlace(seed: SeedItem, match: SearchResult | null): Promise<string> {
  const source = match?.source ?? 'manual'
  const countryCode = seed.source === 'google'
    ? (match ? extractCountryCode(match.address) : 'JP')
    : 'KR'

  // places INSERT
  const { data: place, error: placeErr } = await supabase
    .from('places')
    .insert({
      country_code: countryCode,
      latitude: match?.latitude ?? null,
      longitude: match?.longitude ?? null,
      facilities: seed.facilities ?? [],
      is_24h: false,
      facility_type: seed.facility_type,
      bath_policy: seed.bath_policy,
      coordinate_source: source,
    })
    .select('id')
    .single()

  if (placeErr) throw new Error(`places INSERT 실패 [${seed.name}]: ${placeErr.message}`)

  // place_sources INSERT
  const { error: srcErr } = await supabase
    .from('place_sources')
    .insert({
      place_id: place.id,
      source,
      external_id: match?.external_id ?? null,
      name_original: seed.name,
      address_original: match?.address ?? seed.address ?? null,
      latitude: match?.latitude ?? null,
      longitude: match?.longitude ?? null,
    })

  if (srcErr) console.warn(`  ⚠️ place_sources INSERT 경고 [${seed.name}]: ${srcErr.message}`)

  return place.id
}

// ─── 어드민 로그 생성 ───
async function createAdminLog(seed: SeedItem, placeId: string): Promise<void> {
  const hasTemp = seed.cold_bath_temp || seed.hot_bath_temp || seed.sauna_temp
  const hasCost = seed.cost
  const hasMemo = seed.memo

  if (!hasTemp && !hasCost && !hasMemo) return

  // tribe_id 추론
  let tribeId = 'bather'
  if (seed.sauna_temp) tribeId = 'saunner'

  // logs INSERT
  const { data: log, error: logErr } = await supabase
    .from('logs')
    .insert({
      user_id: ADMIN_USER_ID,
      place_id: placeId,
      tribe_id: tribeId,
      revisit_score: 3,
      cold_bath_temp: seed.cold_bath_temp ?? null,
      hot_bath_temp: seed.hot_bath_temp ?? null,
      sauna_temp: seed.sauna_temp ?? null,
      bath_gender: seed.review_bath_gender ?? null,
      record_date: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (logErr) {
    console.warn(`  ⚠️ logs INSERT 경고 [${seed.name}]: ${logErr.message}`)
    return
  }

  // deep_logs INSERT
  const { error: deepErr } = await supabase
    .from('deep_logs')
    .insert({
      log_id: log.id,
      cost: seed.cost ?? null,
      currency: seed.source === 'google' ? 'JPY' : 'KRW',
      very_hot_bath_temp: seed.very_hot_bath_temp ?? null,
      has_very_hot_bath: !!seed.very_hot_bath_temp,
      wet_sauna_temp: seed.wet_sauna_temp ?? null,
      has_wet_sauna: !!seed.wet_sauna_temp,
      has_scrub: (seed.facilities ?? []).includes('scrub'),
      has_store: (seed.facilities ?? []).includes('food'),
      memo: seed.memo ?? null,
    })

  if (deepErr) console.warn(`  ⚠️ deep_logs INSERT 경고 [${seed.name}]: ${deepErr.message}`)
}

// ─── 수동 확인 완료된 검색 쿼리 오버라이드 ───
// 자동 매칭이 실패하거나 오매칭되는 시설에 대해 정확한 검색 쿼리를 지정
const SEARCH_OVERRIDES: Record<string, { query: string; source: 'naver' | 'google'; expectName?: string }> = {
  // 한국 — Naver 오매칭 방지
  '관악사우나': { query: '관악24시불가마사우나', source: 'naver', expectName: '관악' },
  '온양관광호텔 대온천탕': { query: '온양관광호텔', source: 'naver', expectName: '온양관광' },
  '하남사우나': { query: '하남사우나 용산구', source: 'naver', expectName: '하남사우나' },
  '더메디스파 신사': { query: '더메디스파 신사', source: 'naver', expectName: '메디스파' },
  '석정 휴스파': { query: '석정온천 휴스파', source: 'naver', expectName: '석정' },
  '허심청': { query: '허심청 동래', source: 'naver', expectName: '허심청' },
  '풍림사우나': { query: '풍림24시불가마사우나 마포', source: 'naver', expectName: '풍림' },
  '백제인삼사우나': { query: '백제불한증막 인삼사우나 송파', source: 'naver', expectName: '백제' },
  '골드로즈사우나': { query: '골드로즈사우나 선릉', source: 'naver', expectName: '골드로즈' },
  '석천24시사우나': { query: '석천24시사우나 의정부', source: 'naver', expectName: '석천' },
  // 해외 — Google 오매칭 방지
  'The Sauna': { query: 'The Sauna 長野 野尻湖', source: 'google', expectName: 'The Sauna' },
  'Shiriuchi Onsen Kokyu no Ma': { query: '知内温泉 呼吸の間', source: 'google', expectName: '知内温泉' },
  'Anettai Sauna': { query: '亜熱帯 サウナ 沖縄', source: 'google', expectName: '亜熱帯' },
  'Lauhaniemi sauna': { query: 'Rauhaniemi Folk Spa Tampere', source: 'google', expectName: 'Rauhaniemi' },
}

// ─── 메인 ───
async function main() {
  const seedPath = path.resolve(__dirname, 'seed-data-unified.json')
  const seeds: SeedItem[] = JSON.parse(fs.readFileSync(seedPath, 'utf-8'))

  console.log(`\n🌱 시드 데이터 벌크 등록 ${DRY_RUN ? '(DRY RUN)' : ''}`)
  console.log(`   총 ${seeds.length}건 | 어드민 로그: ${SKIP_LOGS ? 'SKIP' : 'ON'}\n`)

  const results = {
    success: 0,
    manualReview: 0,
    failed: 0,
    logCreated: 0,
  }

  const manualReview: SeedItem[] = []
  const registrationMap: Array<{ name: string; place_id: string; match_status: string }> = []

  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i]
    const progress = `[${i + 1}/${seeds.length}]`

    try {
      // 1. API 검색
      let searchResults: SearchResult[] = []
      const isKorean = seed.source !== 'google'
      const override = SEARCH_OVERRIDES[seed.name]

      if (override) {
        // 수동 확인된 쿼리 사용
        searchResults = override.source === 'naver'
          ? await searchNaver(override.query)
          : await searchGoogle(override.query)
      } else if (isKorean) {
        // 1차: 이름만으로 Naver 검색
        searchResults = await searchNaver(seed.name)

        // 2차: 이름+주소 앞 2단어 (지역 힌트)
        if (!pickBestMatch(seed, searchResults) && seed.address) {
          const query = `${seed.name} ${seed.address.split(' ').slice(0, 2).join(' ')}`
          const retry = await searchNaver(query)
          if (retry.length > 0) searchResults = retry
        }

        // 3차: Naver 실패 시 Google 폴백
        if (!pickBestMatch(seed, searchResults)) {
          const google = await searchGoogle(`${seed.name} ${seed.address || 'Korea'}`)
          if (google.length > 0) searchResults = google
        }
      } else {
        // 해외: name_local(원어명)로 우선 검색, 없으면 영문명
        const localName = seed.name_local ?? seed.name
        searchResults = await searchGoogle(localName)

        // 매칭 안 되면 주소로 재검색
        if (searchResults.length === 0 && seed.address) {
          searchResults = await searchGoogle(`${seed.name} ${seed.address}`)
        }
      }

      // 2. 매칭
      const matched = pickBestMatch(seed, searchResults)

      if (matched && matched.confidence === 'high') {
        // 자동 등록
        if (!DRY_RUN) {
          const placeId = await registerPlace(seed, matched.match)
          seed.place_id = placeId
          seed.match_status = 'auto'

          // 어드민 로그
          if (!SKIP_LOGS) {
            await createAdminLog(seed, placeId)
            results.logCreated++
          }

          registrationMap.push({ name: seed.name, place_id: placeId, match_status: 'auto' })
        }
        console.log(`${progress} ✅ ${seed.name} → ${matched.match.name} (${matched.confidence})`)
        results.success++

      } else if (matched && (matched.confidence === 'medium' || matched.confidence === 'low')) {
        // 매칭은 됐지만 확신 낮음 → 일단 등록하되 manual-review에도 기록
        if (!DRY_RUN) {
          const placeId = await registerPlace(seed, matched.match)
          seed.place_id = placeId
          seed.match_status = `review-${matched.confidence}`

          if (!SKIP_LOGS) {
            await createAdminLog(seed, placeId)
            results.logCreated++
          }

          registrationMap.push({ name: seed.name, place_id: placeId, match_status: `review-${matched.confidence}` })
        }
        console.log(`${progress} ⚠️ ${seed.name} → ${matched.match.name} (${matched.confidence}, review 필요)`)
        manualReview.push({ ...seed, match_status: `review-${matched.confidence}` })
        results.success++
        results.manualReview++

      } else {
        // 매칭 실패 → manual 등록
        if (!DRY_RUN) {
          const placeId = await registerPlace(seed, null)
          seed.place_id = placeId
          seed.match_status = 'manual'

          if (!SKIP_LOGS) {
            await createAdminLog(seed, placeId)
            results.logCreated++
          }

          registrationMap.push({ name: seed.name, place_id: placeId, match_status: 'manual' })
        }
        console.log(`${progress} 📝 ${seed.name} → manual (검색 결과 없음)`)
        manualReview.push({ ...seed, match_status: 'manual' })
        results.success++
        results.manualReview++
      }

    } catch (err) {
      console.error(`${progress} ❌ ${seed.name}: ${err}`)
      seed.match_status = 'failed'
      results.failed++
    }

    // Rate limiting: Naver 10req/sec, Google 10req/sec
    await new Promise(r => setTimeout(r, 200))
  }

  // ─── 결과 저장 ───
  if (!DRY_RUN) {
    // 시드 JSON에 place_id 기록
    fs.writeFileSync(seedPath, JSON.stringify(seeds, null, 2), 'utf-8')

    // 이름↔UUID 매핑
    const resultPath = path.resolve(__dirname, 'seed-registration-result.json')
    fs.writeFileSync(resultPath, JSON.stringify(registrationMap, null, 2), 'utf-8')

    // manual-review 건
    if (manualReview.length > 0) {
      const reviewPath = path.resolve(__dirname, 'seed-manual-review.json')
      fs.writeFileSync(reviewPath, JSON.stringify(manualReview, null, 2), 'utf-8')
    }
  }

  // ─── 요약 ───
  console.log(`
════════════════════════════════
📊 벌크 등록 완료 ${DRY_RUN ? '(DRY RUN)' : ''}
────────────────────────────────
  총 처리:     ${seeds.length}건
  성공:        ${results.success}건
  수동 확인:   ${results.manualReview}건
  실패:        ${results.failed}건
  로그 생성:   ${results.logCreated}건
────────────────────────────────
  결과 파일:
    seed-data-unified.json (place_id 추가됨)
    seed-registration-result.json (이름↔UUID)
    ${manualReview.length > 0 ? 'seed-manual-review.json (수동 확인 필요)' : ''}
════════════════════════════════
  `)
}

main().catch(console.error)
