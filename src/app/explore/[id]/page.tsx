'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ICONS, EXPLORE, PLACE_DETAIL, PLACE_SPECS, QUICK_LOG,
  TRIBE_EMOJI_MAP, TRIBE_PERSONA_MAP, DEEP_LOG,
} from '@/constants/content'
import { getStepLabel, getDetailText } from '@/lib/utils'
import { usePlace, usePlaceStats } from '@/hooks/use-places'
import { useLogsByPlace } from '@/hooks/use-logs'
import { useFavorites } from '@/hooks/use-favorites'
import Badge24h from '@/components/ui/badge-24h'
import Chip from '@/components/ui/chip'
import DataState from '@/components/ui/data-state'
import { useAuth } from '@/contexts/auth-context'
import BottomCTA from '@/components/ui/bottom-cta'

// PLACE_SPECS 섹션별로 시설 분류 (AMENITIES 포함)
const specSections = ['HEAT', 'ICE', 'PAUSE', 'BEYOND', 'AMENITIES'] as const

export default function PlaceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const placeId = params.id as string

  const { data: place, loading: placeLoading, error: placeError } = usePlace(placeId)
  const { data: placeLogs, loading: logsLoading } = useLogsByPlace(placeId)
  const { stats } = usePlaceStats(placeId)
  const { toggleFavorite, isFavorited } = useFavorites()
  const { user: authUser } = useAuth()
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [logSort, setLogSort] = useState<'latest' | 'memo' | 'score' | 'tribe'>('latest')
  const [tribeSortId, setTribeSortId] = useState<string>('')
  const tribeDropdownRef = useRef<HTMLDivElement>(null)

  // 트라이브 드롭다운 바깥 클릭 시 닫기
  useEffect(() => {
    if (logSort !== 'tribe') return
    const handleClick = (e: MouseEvent) => {
      if (tribeDropdownRef.current && !tribeDropdownRef.current.contains(e.target as Node)) {
        setLogSort('latest')
        setTribeSortId('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [logSort])

  // 로딩/에러/없음 상태
  if (placeLoading) {
    return (
      <div className="min-h-dvh bath-tile-bg flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl text-stone-300 animate-spin">progress_activity</span>
      </div>
    )
  }

  if (placeError || !place) {
    return (
      <div className="min-h-dvh bath-tile-bg flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--color-accent)' }}>location_off</span>
        <p className="text-stone-500 text-sm">장소를 찾을 수 없습니다</p>
        <a href="/explore" className="text-sm text-stone-400 hover:text-stone-600 transition-colors mt-2">탐색으로 돌아가기</a>
      </div>
    )
  }

  const isFavoritedPlace = isFavorited(placeId)

  // 시설 분류
  const facilityGroups: { label: string; items: { id: string; label: string; icon: string }[] }[] = []
  for (const key of specSections) {
    const section = PLACE_SPECS[key]
    const items = section.options.filter((opt) => place.facilities.includes(opt.id))
    if (items.length > 0) {
      facilityGroups.push({ label: section.label, items: items.map((o) => ({ id: o.id, label: o.label, icon: o.icon })) })
    }
  }

  // 표시할 기록 (기본 3개, 더보기 시 전체)

  // ── placeLogs 기반 통계 계산 ──
  const totalCount = placeLogs.length

  // 1. 트라이브 분포
  const tribeCounts: Record<string, number> = {}
  for (const log of placeLogs) {
    tribeCounts[log.tribe_id] = (tribeCounts[log.tribe_id] || 0) + 1
  }
  // 고정 순서: 사우너 → 목욕 → 찜질
  const tribeOrder = ['saunner', 'bather', 'jimi'] as const
  const tribeDistribution = tribeOrder
    .filter(t => tribeCounts[t] > 0)
    .map(tribeId => ({ tribeId, count: tribeCounts[tribeId] }))

  // 2. 온도 메트릭 (큰 숫자로 표시, 입력된 것만)
  const calcAvg = (field: keyof typeof placeLogs[0], filterTribe?: string) => {
    const logs = filterTribe ? placeLogs.filter(l => l.tribe_id === filterTribe) : placeLogs
    const vals = logs.filter(l => l[field] != null).map(l => l[field] as number)
    return vals.length > 0 ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : null
  }
  const tempMetrics = [
    { label: '온탕', value: calcAvg('hot_bath_temp', 'bather') },
    { label: '사우나', value: calcAvg('sauna_temp', 'saunner') },
    { label: '냉탕', value: calcAvg('cold_bath_temp') },
    { label: '한증막', value: calcAvg('jjim_temp', 'jimi') },
  ].filter(m => m.value !== null) as { label: string; value: number }[]

  // 3. 트라이브별 서브 메트릭 (컬럼 표시)
  const tribeSubMetrics: { tribeId: string; metrics: { label: string; value: string }[] }[] = [
    { tribeId: 'saunner', metrics: [
      ...(calcAvg('totono_score', 'saunner') != null ? [{ label: '토토노우', value: `${calcAvg('totono_score', 'saunner')}/5` }] : []),
      ...(calcAvg('revisit_score', 'saunner') != null ? [{ label: '재방문', value: `${calcAvg('revisit_score', 'saunner')}/5` }] : []),
    ]},
    { tribeId: 'bather', metrics: [
      ...(calcAvg('water_quality', 'bather') != null ? [{ label: '수질', value: `${calcAvg('water_quality', 'bather')}/5` }] : []),
      ...(calcAvg('revisit_score', 'bather') != null ? [{ label: '재방문', value: `${calcAvg('revisit_score', 'bather')}/5` }] : []),
    ]},
    { tribeId: 'jimi', metrics: [
      ...(calcAvg('sweat_quality', 'jimi') != null ? [{ label: '땀 만족도', value: `${calcAvg('sweat_quality', 'jimi')}/5` }] : []),
      ...(calcAvg('rest_quality', 'jimi') != null ? [{ label: '휴식', value: `${calcAvg('rest_quality', 'jimi')}/5` }] : []),
      ...(calcAvg('revisit_score', 'jimi') != null ? [{ label: '재방문', value: `${calcAvg('revisit_score', 'jimi')}/5` }] : []),
    ]},
  ].filter(t => t.metrics.length > 0)

  // 3. 평균 비용 (로그 데이터 최빈 통화 기준, Intl로 포맷)
  const costLogs = placeLogs.filter(l => l.deep_log?.cost != null)
  const currencyFreq: Record<string, number> = {}
  for (const l of costLogs) {
    const cur = l.deep_log?.currency || 'KRW'
    currencyFreq[cur] = (currencyFreq[cur] || 0) + 1
  }
  const mainCurrency = Object.entries(currencyFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'KRW'
  const costEntries = costLogs
    .filter(l => (l.deep_log?.currency || 'KRW') === mainCurrency)
    .map(l => l.deep_log!.cost as number)
  const avgCost = costEntries.length > 0
    ? { amount: Math.round(costEntries.reduce((s, v) => s + v, 0) / costEntries.length), currency: mainCurrency }
    : null

  // 4. 혼잡도 분포
  const crowdCounts: Record<string, number> = {}
  for (const log of placeLogs) {
    if (log.deep_log?.crowd) crowdCounts[log.deep_log.crowd] = (crowdCounts[log.deep_log.crowd] || 0) + 1
  }
  const crowdLabelMap = Object.fromEntries(DEEP_LOG.CROWD.options.map(o => [o.id, o.label]))
  const crowdDistribution = DEEP_LOG.CROWD.options.map(o => ({ id: o.id, count: crowdCounts[o.id] || 0 }))
  const crowdTotal = crowdDistribution.reduce((s, c) => s + c.count, 0)

  // 5. 세신 만족도
  const scrubLogs = placeLogs.filter(l => l.deep_log?.has_scrub)
  const scrubSatVals = scrubLogs.filter(l => l.deep_log?.scrub_satisfaction != null).map(l => l.deep_log!.scrub_satisfaction as number)
  const scrubAvg = scrubSatVals.length > 0 ? scrubSatVals.reduce((s, v) => s + v, 0) / scrubSatVals.length : 0

  // 5-1. 매점 점수
  const storeScoreVals = placeLogs.filter(l => l.deep_log?.store_score != null).map(l => l.deep_log!.store_score as number)
  const storeAvg = storeScoreVals.length > 0 ? storeScoreVals.reduce((s, v) => s + v, 0) / storeScoreVals.length : null

  // 5-2. 추가 정보 메트릭 (세신, 매점, 이용료 — 있는 것만)
  const additionalMetrics: { label: string; value: string }[] = []
  if (scrubSatVals.length > 0) {
    additionalMetrics.push({ label: '세신', value: `${Math.round(scrubAvg)}/5` })
  }
  if (storeAvg !== null) {
    additionalMetrics.push({ label: '매점', value: `${Math.round(storeAvg)}/5` })
  }
  if (avgCost) {
    const costStr = new Intl.NumberFormat('en', { style: 'currency', currency: avgCost.currency, maximumFractionDigits: 0 }).format(avgCost.amount)
    additionalMetrics.push({ label: '비용', value: costStr })
  }

  // 6. 통합 로그 카드 (소팅)
  const sortedLogs = (() => {
    let logs = [...placeLogs]
    switch (logSort) {
      case 'memo':
        logs = logs.filter(l => l.deep_log?.memo)
        logs.sort((a, b) => b.date.localeCompare(a.date))
        break
      case 'score':
        logs.sort((a, b) => b.revisit_score - a.revisit_score || b.date.localeCompare(a.date))
        break
      case 'tribe':
        if (tribeSortId) logs = logs.filter(l => l.tribe_id === tribeSortId)
        logs.sort((a, b) => b.date.localeCompare(a.date))
        break
      default:
        logs.sort((a, b) => b.date.localeCompare(a.date))
    }
    return logs
  })()
  const displayedLogs2 = showAllReviews ? sortedLogs : sortedLogs.slice(0, 3)

  // 지도 URL — external_id(place_id) 우선, fallback은 좌표/이름 기반
  const googleSource = place.sources.find(s => s.source === 'google')

  // Naver external_id는 좌표 조합(mapx_mapy)이라 place URL로 사용 불가 → 검색 URL 사용
  const naverMapUrl = place.latitude
    ? `https://map.naver.com/v5/search/${encodeURIComponent(place.name)}?c=${place.longitude},${place.latitude},17`
    : `https://map.naver.com/v5/search/${encodeURIComponent(place.name + ' ' + place.address)}`

  const googleMapUrl = googleSource?.external_id
    ? `https://www.google.com/maps/place/?q=place_id:${googleSource.external_id}`
    : place.latitude
      ? `https://www.google.com/maps/search/${encodeURIComponent(place.name)}/@${place.latitude},${place.longitude},17z`
      : `https://www.google.com/maps/search/${encodeURIComponent(place.name + ' ' + place.address)}`

  // "기록하기" CTA — 미인증 시 로그인 리다이렉트
  const handleRecord = () => {
    if (!authUser) {
      router.push('/login?next=/log')
      return
    }
    localStorage.removeItem('currentLog')
    localStorage.setItem('selectedPlace', JSON.stringify({ id: place.id, name: place.name, countryCode: place.country_code, facilityType: place.facility_type }))
    router.push('/log')
  }

  return (
    <div className="min-h-dvh pb-24 bath-tile-bg">
      {/* A. 헤더 — 서브페이지 스타일 */}
      <header className="p-5 pt-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">{ICONS.BACK}</span>
          </button>

          <h1
            className="text-2xl font-extrabold italic font-heading"
          >
            PLACE
          </h1>

          {authUser && (
            <button
              onClick={() => router.push(`/place/${placeId}/edit`)}
              className="ml-auto p-1 text-stone-400 hover:text-stone-600 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
            </button>
          )}
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* B. 장소 정보 카드 — 평점 통합 + 하트 이름과 같은 줄 */}
        <div className="glass-card p-4">
          <h2 className="text-lg font-bold text-stone-700">{place.name}</h2>
          <p className="text-xs text-stone-400 mt-2">{place.address}</p>

          {/* 평점 통합 */}
          {stats.count > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="material-symbols-outlined" style={{ color: 'var(--color-accent)', fontSize: '16px' }}>move</span>
              <span className="text-sm font-bold" style={{ color: 'var(--color-accent)' }}>
                {stats.avg}
              </span>
              <span className="text-xs text-stone-400">
                · {EXPLORE.LOG_COUNT(stats.count)}
              </span>
            </div>
          )}

          {/* 지도 링크 — 국내: 네이버+구글, 해외: 구글만 */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-3 flex-1">
            {place.country_code === 'KR' && (
              <>
                <a
                  href={naverMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-70"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {PLACE_DETAIL.NAVER_MAP}
                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>open_in_new</span>
                </a>
                <span className="text-stone-300">|</span>
              </>
            )}
            <a
              href={googleMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-70"
              style={{ color: 'var(--color-primary)' }}
            >
              {PLACE_DETAIL.GOOGLE_MAP}
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>open_in_new</span>
            </a>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {(place.facility_type === 'male-only' || place.facility_type === 'female-only') && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: place.facility_type === 'male-only' ? '#DBEAFE' : '#FCE7F3',
                    color: place.facility_type === 'male-only' ? '#3B82F6' : '#EC4899',
                  }}
                >
                  {place.facility_type === 'male-only' ? '♂' : '♀'}
                </span>
              )}
              {place.is_24h && <Badge24h />}
              <div onClick={() => toggleFavorite(placeId)} className="cursor-pointer ml-0.5">
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ color: isFavoritedPlace ? 'var(--color-primary)' : 'var(--color-icon-inactive)' }}
                >
                  {isFavoritedPlace ? ICONS.FAVORITE : ICONS.FAVORITE_BORDER}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* C. 시설 정보 — glass-card */}
        {facilityGroups.length > 0 && (
          <div>
          <h3 className="text-sm font-semibold text-stone-500 mb-3">시설 정보</h3>
          <div className="glass-card p-4">
            <div className="space-y-3">
              {facilityGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-xs text-stone-400 mb-1.5">{group.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <Chip key={item.id} label={item.label} icon={item.icon} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        )}

        {/* D. 통계 섹션 — 사-피엔스의 흔적 */}
        {totalCount > 0 && (
          <div>
            {/* 헤더 + 트라이브 바 한줄 */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-500">사-피 리포트</h3>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-stone-400">{totalCount}건</span>
                {tribeDistribution.map(({ tribeId, count }) => (
                  <span key={tribeId} className="flex items-center gap-0.5 text-xs">
                    <span>{TRIBE_EMOJI_MAP[tribeId]}</span>
                    <span className="font-bold" style={{ color: `var(--color-${tribeId})` }}>{count}</span>
                  </span>
                ))}
                <div className="flex h-1.5 rounded-full overflow-hidden w-16">
                  {tribeDistribution.map(({ tribeId, count }) => (
                    <div
                      key={tribeId}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                      style={{
                        width: `${(count / totalCount) * 100}%`,
                        backgroundColor: `var(--color-${tribeId})`,
                        opacity: 0.7,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="glass-card p-4 space-y-3">

              {/* 온도 메트릭: 항상 한 줄, 트라이브 서브메트릭과 동일 그리드 사용 */}
              {tempMetrics.length > 0 && (
              <div className={`py-3 grid gap-x-6 ${tribeSubMetrics.length >= 3 ? 'grid-cols-3' : tribeSubMetrics.length >= 2 ? 'grid-cols-2' : 'grid-cols-1 max-w-[160px]'}`}>
                {tempMetrics.map((m) => (
                  <div key={m.label} className="flex flex-col">
                    <span className="text-xs font-semibold text-stone-500 mb-1">{m.label}</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xl font-bold text-stone-700">{Math.round(m.value)}</span>
                      <span className="text-[10px] text-stone-400">°C</span>
                    </div>
                  </div>
                ))}
              </div>
              )}

              {/* 트라이브별 서브 메트릭: 온도 메트릭과 동일 그리드 */}
              {tribeSubMetrics.length > 0 && (
              <div className={`pt-3 border-t border-stone-200 grid gap-x-6 ${tribeSubMetrics.length >= 3 ? 'grid-cols-3' : tribeSubMetrics.length >= 2 ? 'grid-cols-2' : 'grid-cols-1 max-w-[160px]'}`}>
                {tribeSubMetrics.map(({ tribeId, metrics }) => (
                  <div key={tribeId} className={`py-1 ${tribeSubMetrics.length <= 1 ? 'max-w-[160px]' : ''}`}>
                    <p className="text-xs font-medium mb-2" style={{ color: `var(--color-${tribeId})` }}>
                      {TRIBE_EMOJI_MAP[tribeId]} {TRIBE_PERSONA_MAP[tribeId]}
                    </p>
                    <div className="space-y-1.5">
                      {metrics.map(m => (
                        <div key={m.label} className="flex items-center justify-between text-xs">
                          <span className="text-stone-500">{m.label}</span>
                          <span className="font-bold text-stone-700">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              )}

              {/* 혼잡도 + 더보기: 항상 2col */}
              {(crowdTotal > 0 || additionalMetrics.length > 0) && (
              <div className="grid grid-cols-2 gap-6 pt-3 border-t border-stone-200">
                {/* 좌: 혼잡도 바차트 */}
                <div>
                  {crowdTotal > 0 && (
                  <>
                  <p className="text-xs text-stone-400 mb-2">혼잡도</p>
                  <div className="flex gap-1 items-end h-12">
                    {crowdDistribution.map(({ id, count }) => {
                      const pct = Math.round((count / crowdTotal) * 100)
                      return (
                        <div key={id} className="flex-1 flex flex-col items-center">
                          <div className="w-full flex items-end justify-center" style={{ height: '32px' }}>
                            <div
                              className="w-full rounded-t"
                              style={{
                                height: `${Math.max(pct * 0.32, 2)}px`,
                                backgroundColor: 'var(--color-primary)',
                                opacity: count > 0 ? 0.2 + (pct / 100) * 0.6 : 0.1,
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {crowdDistribution.map(({ id, count }) => {
                      const pct = Math.round((count / crowdTotal) * 100)
                      return (
                        <div key={id} className="flex-1 text-center">
                          <p className="text-[10px] text-stone-500 leading-tight">{crowdLabelMap[id]}</p>
                          <p className="text-[10px] text-stone-400">{pct}%</p>
                        </div>
                      )
                    })}
                  </div>
                  </>
                  )}
                </div>
                {/* 우: + 더보기 (세신, 매점, 비용) */}
                <div>
                  {additionalMetrics.length > 0 && (
                  <>
                  <p className="text-xs text-stone-400 mb-2">+ 더보기</p>
                  <div className="space-y-1.5">
                    {additionalMetrics.map(m => (
                      <div key={m.label} className="flex items-center gap-3 text-xs">
                        <span className="text-stone-500">{m.label}</span>
                        <span className="font-bold text-stone-700">{m.value}</span>
                      </div>
                    ))}
                  </div>
                  </>
                  )}
                </div>
              </div>
              )}

            </div>
          </div>
        )}

        {/* E. 사-피엔스의 흔적 — 통합 로그 카드 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-stone-500">{PLACE_DETAIL.LOGS_TITLE}</h3>
            <div className="flex items-center gap-1">
              {([
                { key: 'latest' as const, label: '최신' },
                { key: 'memo' as const, label: '메모' },
              ]).map(s => (
                <button
                  key={s.key}
                  onClick={() => { setLogSort(s.key); setShowAllReviews(false) }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    logSort === s.key
                      ? 'text-white shadow-md'
                      : 'glass-card-light text-stone-500 hover:text-stone-700'
                  }`}
                  style={logSort === s.key ? { backgroundColor: 'var(--color-primary)' } : {}}
                >
                  {s.label}
                </button>
              ))}
              {/* 트라이브 드롭다운 */}
              <div className="relative" ref={tribeDropdownRef}>
                <button
                  onClick={() => {
                    if (logSort === 'tribe') { setLogSort('latest'); setTribeSortId('') }
                    else { setLogSort('tribe') }
                    setShowAllReviews(false)
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    logSort === 'tribe'
                      ? 'text-white shadow-md'
                      : 'glass-card-light text-stone-500 hover:text-stone-700'
                  }`}
                  style={logSort === 'tribe' ? { backgroundColor: 'var(--color-primary)' } : {}}
                >
                  {logSort === 'tribe' && tribeSortId ? TRIBE_PERSONA_MAP[tribeSortId] : 'TRIBE'}
                </button>
                {logSort === 'tribe' && (
                  <div className="absolute right-0 top-full mt-1 z-10 glass-card p-1 shadow-lg rounded-lg flex flex-col gap-0.5 min-w-[80px]">
                    <button
                      onClick={() => { setTribeSortId(''); setShowAllReviews(false) }}
                      className={`px-2.5 py-1.5 rounded text-xs text-left transition-all ${
                        !tribeSortId ? 'font-bold text-stone-700 bg-stone-100' : 'text-stone-500 hover:bg-stone-50'
                      }`}
                    >
                      전체
                    </button>
                    {(['saunner', 'bather', 'jimi'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => { setTribeSortId(t); setShowAllReviews(false) }}
                        className={`px-2.5 py-1.5 rounded text-xs text-left font-medium transition-all ${
                          tribeSortId === t ? 'bg-stone-100' : 'hover:bg-stone-50'
                        }`}
                        style={{ color: `var(--color-${t})` }}
                      >
                        {TRIBE_PERSONA_MAP[t]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DataState loading={logsLoading} error={null} isEmpty={placeLogs.length === 0} emptyMessage={PLACE_DETAIL.NO_LOGS}>
           <div style={{ minHeight: '320px' }}>
            {sortedLogs.length === 0 && placeLogs.length > 0 ? (
              <p className="text-center text-xs text-stone-400 py-6">해당 조건의 기록이 없어요</p>
            ) : (
            <div className="space-y-2">
              {displayedLogs2.map((log) => {
                const detailText = getDetailText(log)
                const shortDate = log.date.slice(5, 10).replace(/^0/, '').replace('-0', '/').replace('-', '/')
                return (
                  <div
                    key={log.id}
                    className="w-full glass-card p-4 text-left"
                  >
                    {/* Row1: 점수 + 숏로그 메트릭 (좌) / 날짜 + 트라이브 이모지 (우) */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--color-accent)' }}>move</span>
                          <span className="font-bold" style={{ color: 'var(--color-primary)' }}>{log.revisit_score}/5</span>
                        </span>
                        {detailText && (
                          <>
                            <span className="text-stone-300">·</span>
                            <span className="text-stone-400 truncate">{detailText}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-stone-400">{shortDate}</span>
                        <span className="text-sm">{TRIBE_EMOJI_MAP[log.tribe_id]}</span>
                      </div>
                    </div>

                    {/* Row2: 메모 (있을 때만) */}
                    {log.deep_log?.memo && (
                      <p className="text-sm text-stone-600 leading-relaxed mt-1.5">{log.deep_log.memo}</p>
                    )}

                    {/* Row3: 추천 메뉴 (있을 때만) */}
                    {log.deep_log?.store_memo && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="material-symbols-outlined text-stone-400" style={{ fontSize: '14px' }}>restaurant</span>
                        <span className="text-xs text-stone-500">추천 메뉴:</span>
                        <span className="text-xs font-medium text-stone-600">{log.deep_log.store_memo}</span>
                      </div>
                    )}

                    {/* Row4: 칭호 + 닉네임 (하단 우측) */}
                    <div className="flex items-center justify-end gap-1.5 mt-2 pt-1.5 border-t border-stone-100">
                      {log.user_title && (
                        <span className="text-[10px] text-stone-400">{log.user_title}</span>
                      )}
                      <span className="text-xs font-medium text-stone-600">{log.user_nickname || '익명'}</span>
                    </div>
                  </div>
                )
              })}

              {!showAllReviews && sortedLogs.length > 3 && (
                <button
                  onClick={() => setShowAllReviews(true)}
                  className="w-full pt-2 pb-1 text-center text-xs font-medium underline underline-offset-2 transition-colors"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {PLACE_DETAIL.MORE_LOGS} ({sortedLogs.length - 3}건 더)
                </button>
              )}
            </div>
            )}
           </div>
          </DataState>
        </div>
      </main>

      <BottomCTA onClick={handleRecord}>{PLACE_DETAIL.RECORD_CTA}</BottomCTA>
    </div>
  )
}
