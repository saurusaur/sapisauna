/**
 * 재조합 주소 vs Google formatted_address 정보 무결성 검증
 * - 각 의미있는 토큰(단어/번지)이 양쪽 다 존재하는지 비교
 * - 정보 손실 / 정보 추가 / 차이 분류
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { createClient } from '@supabase/supabase-js'
import { resolveAddress } from '../src/lib/geo/address-builder'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(__dirname, '../.env.local')
for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim()
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// 정규화: 우편번호/전각숫자/공백/콤마 제거 → 비교 가능한 소문자 토큰
function normalize(addr: string): Set<string> {
  let s = addr
    .replace(/〒?\d{3}-\d{4}/g, '')            // JP 우편번호
    .replace(/\s\d{5}(-\d{4})?(?=,|$|\s)/g, '') // US/EU 우편번호
    .replace(/,/g, ' ')
    .replace(/０/g, '0').replace(/１/g, '1').replace(/２/g, '2').replace(/３/g, '3')
    .replace(/４/g, '4').replace(/５/g, '5').replace(/６/g, '6').replace(/７/g, '7')
    .replace(/８/g, '8').replace(/９/g, '9')
    .replace(/−/g, '-').replace(/ー/g, '-')    // 전각 하이픈
  return new Set(
    s.toLowerCase().split(/\s+/)
      .filter(t => t.length > 0)
      .map(t => t.replace(/^(w|e|n|s|st|ave|rd|blvd)\.?$/, ''))  // 축약어 정규화 (빈 문자열로)
      .filter(t => t.length > 0)
  )
}

// 의미있는 토큰 (POI 이름·부속 번호 제외)
const IGNORE_TOKENS = new Set(['japan', 'usa', 'ward', 'city', 'kerroksessa', 'chōme', 'chome', 'street', 'st', 'avenue', 'ave'])

;(async () => {
  const { data } = await s.from('places')
    .select('id, latitude, longitude, place_sources(source, name_original)')
  const targets = (data ?? []).filter((p: any) => {
    const g = p.place_sources?.find((x: any) => x.source === 'google')
    return g && p.latitude && p.longitude
  })

  let matches = 0
  let googleHasExtra = 0
  let oursHasExtra = 0
  const issues: { id: string; name: string; google: string; ours: string; onlyGoogle: string[]; onlyOurs: string[] }[] = []

  for (const tp of targets as any[]) {
    const g = tp.place_sources.find((x: any) => x.source === 'google')
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${tp.latitude},${tp.longitude}&language=en&key=${process.env.GOOGLE_PLACES_API_KEY}`
    const r = await fetch(url)
    const d = await r.json()
    if (d.status !== 'OK') continue

    const googleAddr: string = d.results[0].formatted_address
    const ours = resolveAddress(d.results[0].address_components, g.name_original).address

    const gTokens = normalize(googleAddr)
    const oTokens = normalize(ours)

    const onlyGoogle: string[] = []
    const onlyOurs: string[] = []
    for (const t of gTokens) {
      if (!oTokens.has(t) && !IGNORE_TOKENS.has(t)) onlyGoogle.push(t)
    }
    for (const t of oTokens) {
      if (!gTokens.has(t) && !IGNORE_TOKENS.has(t)) onlyOurs.push(t)
    }

    if (onlyGoogle.length === 0 && onlyOurs.length === 0) {
      matches++
    } else {
      if (onlyGoogle.length > 0) googleHasExtra++
      if (onlyOurs.length > 0) oursHasExtra++
      issues.push({
        id: tp.id.slice(0, 8),
        name: g.name_original,
        google: googleAddr,
        ours,
        onlyGoogle,
        onlyOurs,
      })
    }

    await new Promise(r => setTimeout(r, 250))
  }

  console.log(`\n═══ 무결성 검증 결과 ═══`)
  console.log(`전체 Google-source 장소: ${targets.length}`)
  console.log(`완전 일치: ${matches}`)
  console.log(`Google에만 있음 (정보 손실): ${googleHasExtra}`)
  console.log(`우리 쪽에만 있음 (정보 추가): ${oursHasExtra}`)
  console.log(`\n상세 차이:`)
  for (const i of issues) {
    console.log(`\n── ${i.id} · ${i.name}`)
    console.log(`  Google: ${i.google}`)
    console.log(`  Ours:   ${i.ours}`)
    if (i.onlyGoogle.length) console.log(`  Google만: ${JSON.stringify(i.onlyGoogle)}`)
    if (i.onlyOurs.length) console.log(`  Ours만:   ${JSON.stringify(i.onlyOurs)}`)
  }
})()
