/**
 * 오매칭 15건 재검색 + DB/JSON 수정
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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function searchNaver(query: string) {
  const url = new URL('https://openapi.naver.com/v1/search/local.json')
  url.searchParams.set('query', query)
  url.searchParams.set('display', '1')
  const res = await fetch(url.toString(), {
    headers: {
      'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID!,
      'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET!,
    },
  })
  const data = await res.json()
  const item = data.items?.[0]
  if (!item) return null
  return {
    name: item.title.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&'),
    address: item.roadAddress || item.address,
    lat: parseInt(item.mapy) / 10000000,
    lng: parseInt(item.mapx) / 10000000,
    external_id: `${item.mapx}_${item.mapy}`,
  }
}

async function searchGoogle(query: string) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
  url.searchParams.set('query', query)
  url.searchParams.set('language', 'en')
  url.searchParams.set('key', process.env.GOOGLE_PLACES_API_KEY!)
  const res = await fetch(url.toString())
  const data = await res.json()
  const item = data.results?.[0]
  if (!item) return null
  return {
    name: item.name,
    address: item.formatted_address,
    lat: item.geometry.location.lat,
    lng: item.geometry.location.lng,
    external_id: item.place_id,
  }
}

// 정확한 검색 쿼리
const FIXES: Array<{
  seedName: string
  query: string
  api: 'naver' | 'google'
  expectName?: string // 지도명으로 업데이트할 이름 (null이면 검색 결과 사용)
}> = [
  // 한국 — Naver
  { seedName: '강남목욕탕', query: '강남목욕탕 천안시 동남구', api: 'naver' },
  { seedName: '네이처스파', query: '네이처스파 파주 교하', api: 'naver' },
  { seedName: '스파마린', query: '스파마린 해운대 마린시티', api: 'naver' },
  { seedName: '천성산온천', query: '천성산온천 양산', api: 'naver' },
  { seedName: '유천스파', query: '유천스파 강릉', api: 'naver' },
  { seedName: '성성호수사우나', query: '호수사우나 천안 성성', api: 'naver' },
  { seedName: '스파앳홈', query: '스파앳홈 인천공항', api: 'naver' },
  { seedName: '솔로사우나레포', query: '솔로사우나레포 광명점', api: 'naver' },
  { seedName: '소노캄 여수', query: '소노캄여수 사우나', api: 'naver' },
  { seedName: '석천24시사우나', query: '석천24시사우나 의정부', api: 'naver' },
  { seedName: '율암온천', query: '율암온천 화성', api: 'naver' },
  // 해외 — Google (영문, language=en)
  { seedName: 'The Sauna', query: 'The Sauna 長野 野尻湖 lamp', api: 'google' },
  { seedName: 'KIWAMI SAUNA Osu', query: 'KIWAMI SAUNA Osu Nagoya', api: 'google' },
  { seedName: 'SAUNA SAKURADO', query: 'SAUNA SAKURADO Fukuoka', api: 'google' },
  { seedName: 'sauna kolme kylä', query: 'sauna kolme kyla Okayama', api: 'google' },
  { seedName: 'AIRE Ancient Baths', query: 'AIRE Ancient Baths Barcelona', api: 'google' },
]

async function main() {
  const seedPath = path.resolve(__dirname, 'seed-data-unified.json')
  const seeds = JSON.parse(fs.readFileSync(seedPath, 'utf-8'))

  console.log(`\n🔧 오매칭 ${FIXES.length}건 수정\n`)

  for (const fix of FIXES) {
    const seed = seeds.find((s: any) => s.name === fix.seedName)
    if (!seed?.place_id) {
      console.log(`  ⏭️  ${fix.seedName} — place_id 없음`)
      continue
    }

    const result = fix.api === 'naver'
      ? await searchNaver(fix.query)
      : await searchGoogle(fix.query)

    if (!result) {
      console.log(`  ❌ ${fix.seedName} — 검색 결과 없음 (query: ${fix.query})`)
      continue
    }

    const mapName = result.name
    const source = fix.api

    // DB places 좌표 업데이트
    await supabase.from('places')
      .update({ latitude: result.lat, longitude: result.lng, coordinate_source: source })
      .eq('id', seed.place_id)

    // DB place_sources 업데이트
    await supabase.from('place_sources')
      .update({
        source,
        name_original: mapName,
        address_original: result.address,
        latitude: result.lat,
        longitude: result.lng,
        external_id: result.external_id,
      })
      .eq('place_id', seed.place_id)

    // JSON 업데이트
    if (!seed.name_alias) seed.name_alias = seed.name
    seed.name = mapName

    console.log(`  ✅ ${fix.seedName} → ${mapName} | ${result.address?.substring(0, 30)}`)
    await new Promise(r => setTimeout(r, 200))
  }

  fs.writeFileSync(seedPath, JSON.stringify(seeds, null, 2), 'utf-8')
  console.log('\n완료')
}

main().catch(console.error)
