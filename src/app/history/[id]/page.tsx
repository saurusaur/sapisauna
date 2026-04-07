'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ui/confirm-modal'
import { TRIBE_EMOJI_MAP, ICONS, DEEP_LOG, QUICK_LOG, COMPUTED_METRICS } from '@/constants/content'
import { formatDateTime, formatShortDate, getWaterQualityLabel, getRestQualityLabel, getStepLabel, getDetailText, generateShortAddress } from '@/lib/utils'
import { useLog, useMyLogsByPlace } from '@/hooks/use-logs'
import { deleteLog } from '@/lib/logs-service'
import { captureError } from '@/lib/error-logger'
import RecordCard from '@/components/features/record-card'
import ScoreBadge from '@/components/features/score-badge'
import BottomCTA from '@/components/ui/bottom-cta'

// DEEP_LOG options에서 id로 옵션을 찾는 헬퍼
function findOption(options: readonly { id: string; label: string; icon: string }[], id: string) {
  return options.find(o => o.id === id)
}

// 영문 라벨: COMPUTED_METRICS (메인 계산값) + QUICK_LOG.*.labelEn (서브 항목)

export default function HistoryDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [showAllSamePlace, setShowAllSamePlace] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // DB 로그 로드
  const { data: log, loading, error } = useLog(params.id)
  const { data: allPlaceLogs } = useMyLogsByPlace(log?.place_id || '')

  // 같은 장소 과거 기록 (현재 기록 제외)
  const samePlaceLogs = log ? allPlaceLogs.filter(l => l.id !== log.id) : []
  const visibleSamePlaceLogs = showAllSamePlace ? samePlaceLogs : samePlaceLogs.slice(0, 2)
  const hasMoreSamePlaceLogs = samePlaceLogs.length > 2

  const getRevisitLabel = (score: number): string => {
    return getStepLabel(QUICK_LOG.COMMON.REVISIT.steps, score)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await deleteLog(params.id)
      router.push('/history')
    } catch (e) {
      captureError(e, { label: '로그 삭제 실패' })
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // 로딩/에러 상태
  if (loading) {
    return (
      <div className="min-h-dvh bath-tile-bg flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl text-stone-300 animate-spin">progress_activity</span>
      </div>
    )
  }

  if (error || !log) {
    return (
      <div className="min-h-dvh bath-tile-bg flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--color-accent)' }}>description_off</span>
        <p className="text-stone-500 text-sm">기록을 찾을 수 없습니다</p>
        <a href="/home" className="text-sm text-stone-400 hover:text-stone-600 transition-colors mt-2">홈으로 돌아가기</a>
      </div>
    )
  }

  // 타입별 메인 메트릭 (스토리와 동일 로직)
  const getMainMetricValue = (): number | null => {
    switch (log.tribe_id) {
      case 'saunner':
        return (log.sauna_temp || 80) - (log.cold_bath_temp || 15)
      case 'bather':
        return log.hot_bath_temp || 40
      case 'jimi':
        return log.jjim_temp || null
      default:
        return null
    }
  }

  const mainMetricValue = getMainMetricValue()
  const mainMetricLabel = COMPUTED_METRICS[log.tribe_id as keyof typeof COMPUTED_METRICS]?.labelEn || ''

  // 루틴 뱃지 (항상 4개 표시, 미입력은 '-')
  const routineBadges = log.tribe_id === 'jimi'
    ? [
        { value: log.heat_time || null, label: 'HEAT', unit: 'MIN' },
        { value: log.pause_time || null, label: 'PAUSE', unit: 'MIN' },
        { value: log.repeat || null, label: 'RPT', unit: 'SET' },
        { value: log.sweat_quality || null, label: 'SWEAT', unit: '/5' },
      ]
    : [
        { value: log.heat_time || null, label: 'HEAT', unit: 'MIN' },
        { value: log.ice_time || null, label: 'ICE', unit: 'MIN' },
        { value: log.pause_time || null, label: 'PAUSE', unit: 'MIN' },
        { value: log.repeat || null, label: 'RPT', unit: 'SET' },
      ]

  return (
    <div className="min-h-dvh bath-tile-bg pb-24">
      {/* 헤더 */}
      <header className="p-5 pt-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>

          <h1
            className="text-2xl font-extrabold italic font-heading"
          >
            RECORD
          </h1>

          <div className="flex gap-2 ml-auto">
          <button
            onClick={() => {
              const logAsCurrentLog = {
                _editId: log.id,
                place_id: log.place_id,
                place_name: log.place_name,
                place_country_code: log.place_country_code,
                tribe_id: log.tribe_id,
                record_date: log.date,
                revisit_score: log.revisit_score,
                repeat: log.repeat,
                heat_time: log.heat_time,
                ice_time: log.ice_time,
                pause_time: log.pause_time,
                sauna_temp: log.sauna_temp,
                cold_bath_temp: log.cold_bath_temp,
                totono_score: log.totono_score,
                hot_bath_temp: log.hot_bath_temp,
                water_quality: log.water_quality,
                jjim_temp: log.jjim_temp,
                rest_quality: log.rest_quality,
                ...(log.deep_log && { deep_log: log.deep_log }),
              }
              localStorage.setItem('currentLog', JSON.stringify(logAsCurrentLog))
              localStorage.setItem('selectedPlace', JSON.stringify({ id: log.place_id, name: log.place_name, countryCode: log.place_country_code, facilityType: null }))
              router.push('/log')
            }}
            className="p-2 transition-colors hover:opacity-70"
            style={{ color: 'var(--color-primary)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>edit</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 transition-colors hover:opacity-70"
            style={{ color: 'var(--color-primary)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>delete</span>
          </button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">

        {/* ── 1. 장소 카드 (장소 상세 페이지 스타일 참조) ── */}
        <div className="glass-card-light p-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/explore/${log.place_id}`)}
              className="flex items-center gap-1 hover:opacity-70 transition-opacity"
            >
              <h2 className="text-lg font-bold text-stone-700">{log.place_name}</h2>
              <span className="material-symbols-outlined text-sm text-stone-400">chevron_right</span>
            </button>
            <span className="text-lg ml-auto">{TRIBE_EMOJI_MAP[log.tribe_id]}</span>
          </div>
          <p className="text-xs text-stone-400 mt-2.5">{generateShortAddress(log.address, log.place_country_code) || log.address}</p>
          <p className="text-xs text-stone-400 mt-2.5">{formatDateTime(new Date(log.date))}</p>

          {/* 점수 — move 아이콘 + 점수 · descriptor */}
          <div className="mt-2.5">
            <ScoreBadge score={log.revisit_score} showMax={false} descriptor={getRevisitLabel(log.revisit_score)} />
          </div>
        </div>

        {/* ── 2. 숏 리뷰: glass card 위 editorial 메트릭 + 루틴 ── */}
        <div className="glass-card-light p-5">

          {/* 메트릭 — 고정 3행 그리드, 모든 타입 동일 높이 */}
          <div className="grid grid-cols-[auto_1fr] grid-rows-3 gap-x-5 items-center">
            {/* 좌 col row1: 라벨 */}
            <p className="text-xs font-medium uppercase tracking-wider text-stone-400 self-center font-heading">
              {mainMetricLabel}
            </p>
            {/* 우 col row1 */}
            <div className="flex justify-between items-baseline self-center" style={{ borderLeft: '1px solid hsl(30 12% 87% / .4)', paddingLeft: '20px' }}>
              {log.tribe_id === 'saunner' && (
                <>
                  <span className="text-xs font-medium uppercase tracking-wider text-stone-400 font-heading">{QUICK_LOG.SAUNER.SAUNA_TEMP.labelEn}</span>
                  <span className="text-base font-bold text-stone-700 font-heading">{log.sauna_temp ?? '—'}°</span>
                </>
              )}
              {log.tribe_id === 'bather' && (
                <>
                  <span className="text-xs font-medium uppercase tracking-wider text-stone-400 font-heading">{QUICK_LOG.COMMON.COLD_BATH_TEMP.labelEn}</span>
                  <span className="text-base font-bold text-stone-700 font-heading">{log.cold_bath_temp ?? '—'}°</span>
                </>
              )}
              {log.tribe_id === 'jimi' && (
                <>
                  <span className="text-xs font-medium uppercase tracking-wider text-stone-400 font-heading">{QUICK_LOG.JIMI.REST_QUALITY.labelEn}</span>
                  <span className="text-base font-bold font-heading" style={{ color: 'var(--color-accent)' }}>
                    <span className="font-medium text-xs text-stone-400 mr-1.5">{getRestQualityLabel(log.rest_quality || 3)}</span>
                    {log.rest_quality || 3}<span className="font-medium text-xs text-stone-400">/5</span>
                  </span>
                </>
              )}
            </div>
            {/* 좌 col row2-3: 대형숫자 */}
            <div className="row-span-2 flex items-start">
              <span className="font-bold text-stone-800 leading-none tracking-tight font-heading" style={{ fontSize: '72px' }}>{mainMetricValue ?? '—'}</span>
              {mainMetricValue !== null && (
                <span className="text-stone-400 font-semibold mt-1 font-heading" style={{ fontSize: '20px' }}>°C</span>
              )}
            </div>
            {/* 우 col row2 */}
            <div className="flex justify-between items-baseline self-center" style={{ borderLeft: '1px solid hsl(30 12% 87% / .4)', paddingLeft: '20px' }}>
              {log.tribe_id === 'saunner' && (
                <>
                  <span className="text-xs font-medium uppercase tracking-wider text-stone-400 font-heading">{QUICK_LOG.COMMON.COLD_BATH_TEMP.labelEn}</span>
                  <span className="text-base font-bold text-stone-700 font-heading">{log.cold_bath_temp ?? '—'}°</span>
                </>
              )}
              {log.tribe_id === 'bather' && (
                <>
                  <span className="text-xs font-medium uppercase tracking-wider text-stone-400 font-heading">{QUICK_LOG.BATHER.WATER_QUALITY.labelEn}</span>
                  <span className="text-base font-bold font-heading" style={{ color: 'var(--color-accent)' }}>
                    <span className="font-medium text-xs text-stone-400 mr-1.5">{getWaterQualityLabel(log.water_quality || 3)}</span>
                    {log.water_quality || 3}<span className="font-medium text-xs text-stone-400">/5</span>
                  </span>
                </>
              )}
              {log.tribe_id === 'jimi' && <span />}
            </div>
            {/* 우 col row3 */}
            <div className="flex justify-between items-baseline self-center" style={{ borderLeft: '1px solid hsl(30 12% 87% / .4)', paddingLeft: '20px' }}>
              {log.tribe_id === 'saunner' && (
                <>
                  <span className="text-xs font-medium uppercase tracking-wider text-stone-400 font-heading">{QUICK_LOG.SAUNER.TOTONO.labelEn}</span>
                  <span className="text-base font-bold font-heading" style={{ color: 'var(--color-accent)' }}>
                    <span className="font-medium text-xs text-stone-400 mr-1.5">{getStepLabel(QUICK_LOG.SAUNER.TOTONO.steps, log.totono_score || 0)}</span>
                    {log.totono_score || 0}<span className="font-medium text-xs text-stone-400">/5</span>
                  </span>
                </>
              )}
              {log.tribe_id !== 'saunner' && <span />}
            </div>
          </div>

          {/* 루틴 — 숫자 위 + 라벨 아래 (스토리 동일), 단위 없음 */}
          <div className="mt-6 flex justify-center">
            <div className="grid grid-cols-4 gap-6 w-full max-w-xs">
              {routineBadges.map((badge) => (
                <div key={badge.label} className="flex flex-col items-center gap-2">
                  <span
                    className="font-bold leading-none font-heading"
                    style={{
                      fontSize: '28px',
                      color: badge.value !== null ? '#292524' : '#d6d3d1',
                    }}
                  >
                    {badge.value ?? '-'}
                    {badge.unit === '/5' && badge.value != null && (
                      <span className="text-stone-400 font-semibold" style={{ fontSize: '14px' }}>/5</span>
                    )}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider leading-none font-heading"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 3. 딥 리뷰 카드 ── */}
        {!log.deep_log && (
          <div>
            <button
              onClick={() => {
                const logAsCurrentLog = {
                  _editId: log.id,
                  _deepOnly: true,
                  place_id: log.place_id,
                  place_name: log.place_name,
                  place_country_code: log.place_country_code,
                  tribe_id: log.tribe_id,
                  record_date: log.date,
                  revisit_score: log.revisit_score,
                  repeat: log.repeat,
                  heat_time: log.heat_time,
                  ice_time: log.ice_time,
                  pause_time: log.pause_time,
                  sauna_temp: log.sauna_temp,
                  cold_bath_temp: log.cold_bath_temp,
                  totono_score: log.totono_score,
                  hot_bath_temp: log.hot_bath_temp,
                  water_quality: log.water_quality,
                  jjim_temp: log.jjim_temp,
                  rest_quality: log.rest_quality,
                }
                localStorage.setItem('currentLog', JSON.stringify(logAsCurrentLog))
                localStorage.setItem('selectedPlace', JSON.stringify({ id: log.place_id, name: log.place_name, countryCode: log.place_country_code, facilityType: null }))
                router.push('/log/deep')
              }}
              className="w-full h-[104px] glass-card-light rounded-xl flex flex-col items-center justify-center text-center hover:bg-white/30 transition-colors"
            >
              <p className="text-stone-400 text-sm mb-2">더 자세히 기록해보세요</p>
              <span
                className="text-xs font-medium underline underline-offset-2"
                style={{ color: 'var(--color-primary)' }}
              >
                딥로그 추가하기
              </span>
            </button>
          </div>
        )}
        {log.deep_log && (
          <div>
            <div className="glass-card-light rounded-xl p-4 space-y-3">
              {log.deep_log.companion && (
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-stone-400">동행</span>
                  <span className="text-sm font-medium text-stone-700">
                    {findOption(DEEP_LOG.COMPANION.options, log.deep_log.companion)?.label ?? log.deep_log.companion}
                  </span>
                </div>
              )}
              {log.deep_log.crowd && (
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-stone-400">혼잡도</span>
                  <span className="text-sm font-medium text-stone-700">
                    {findOption(DEEP_LOG.CROWD.options, log.deep_log.crowd)?.label ?? log.deep_log.crowd}
                  </span>
                </div>
              )}
              {log.deep_log.cleanliness != null && (
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-stone-400">청결도</span>
                  <span className="text-sm font-medium text-stone-700">
                    <span className="text-xs text-stone-400 mr-1">{DEEP_LOG.CLEANLINESS.steps.find(s => s.value === log.deep_log!.cleanliness)?.label ?? ''}</span>
                    {log.deep_log.cleanliness}<span className="text-xs text-stone-400">/5</span>
                  </span>
                </div>
              )}
              {log.deep_log.cost && (
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-stone-400">비용</span>
                  <span className="text-sm font-medium text-stone-700">
                    {log.deep_log.currency || 'KRW'} {log.deep_log.cost.toLocaleString()}
                  </span>
                </div>
              )}
              {log.deep_log.has_wet_sauna && log.deep_log.wet_sauna_temp != null && (
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-stone-400">습식 사우나</span>
                  <span className="text-sm font-medium text-stone-700">{log.deep_log.wet_sauna_temp}°C</span>
                </div>
              )}
              {log.hot_bath_temp != null && log.tribe_id === 'saunner' && (
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-stone-400">온탕</span>
                  <span className="text-sm font-medium text-stone-700">{log.hot_bath_temp}°C</span>
                </div>
              )}
              {log.deep_log.has_very_hot_bath && log.deep_log.very_hot_bath_temp != null && (
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-stone-400">열탕</span>
                  <span className="text-sm font-medium text-stone-700">{log.deep_log.very_hot_bath_temp}°C</span>
                </div>
              )}
              {log.deep_log.has_scrub && (
                <>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-stone-400">
                      {log.deep_log.scrub_types?.length
                        ? log.deep_log.scrub_types.map(t => t === 'scrub' ? '세신' : '마사지').join(' + ')
                        : '세신'}
                    </span>
                    {log.deep_log.scrub_cost != null && (
                      <span className="text-sm font-medium text-stone-700">
                        {log.deep_log.currency || 'KRW'} {log.deep_log.scrub_cost.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {log.deep_log.scrub_satisfaction != null && (
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-stone-400">만족도</span>
                      <span className="text-sm font-medium text-stone-700">
                        <span className="text-xs text-stone-400 mr-1">{DEEP_LOG.SCRUB.satisfaction.steps.find(s => s.value === log.deep_log!.scrub_satisfaction)?.label ?? ''}</span>
                        {log.deep_log.scrub_satisfaction}<span className="text-xs text-stone-400">/5</span>
                      </span>
                    </div>
                  )}
                </>
              )}
              {log.deep_log.has_store && (
                <>
                  {log.deep_log.store_score && (
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-stone-400">매점</span>
                      <span className="text-sm font-medium text-stone-700">
                        <span className="text-xs text-stone-400 mr-1">{log.deep_log.store_score >= 4 ? '만족' : log.deep_log.store_score >= 3 ? '보통' : '아쉬움'}</span>
                        {log.deep_log.store_score}<span className="text-xs text-stone-400">/5</span>
                      </span>
                    </div>
                  )}
                  {log.deep_log.store_memo && (
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-stone-400">추천 메뉴</span>
                      <span className="text-sm font-medium text-stone-700">{log.deep_log.store_memo}</span>
                    </div>
                  )}
                </>
              )}

              {/* 메모 — 별도 glass tile */}
            </div>

            {log.deep_log.memo && (
              <div className="glass-card-light rounded-xl p-4 mt-3">
                <p className="text-sm text-stone-600 leading-relaxed">{log.deep_log.memo}</p>
              </div>
            )}
          </div>
        )}

        {/* ── 4. 같은 장소 기록 ── */}
        {samePlaceLogs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-500">이 장소의 다른 기록</h3>
              <button
                onClick={() => router.push(`/explore/${log.place_id}`)}
                className="text-xs font-medium transition-colors hover:opacity-70"
                style={{ color: 'var(--color-primary)' }}
              >
                전체보기
              </button>
            </div>

            <div className="space-y-2.5">
              {visibleSamePlaceLogs.map((item) => (
                <RecordCard
                  key={item.id}
                  log={item}
                  onClick={() => router.push(`/history/${item.id}`)}
                />
              ))}

              {hasMoreSamePlaceLogs && !showAllSamePlace && (
                <button
                  onClick={() => setShowAllSamePlace(true)}
                  className="w-full py-2.5 text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-1"
                  style={{ color: 'var(--color-primary)' }}
                >
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                  더보기 ({samePlaceLogs.length - 2}개)
                </button>
              )}

              {showAllSamePlace && hasMoreSamePlaceLogs && (
                <button
                  onClick={() => setShowAllSamePlace(false)}
                  className="w-full py-2.5 text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-1 text-stone-400"
                >
                  <span className="material-symbols-outlined text-sm">expand_less</span>
                  접기
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── 5. 스토리 만들기 CTA ── */}
      <BottomCTA onClick={() => {
        localStorage.setItem('savedLogId', log.id)
        router.push('/story')
      }} className="flex items-center justify-center gap-2">
        <span className="material-symbols-outlined">photo_camera</span>
        카드 만들기
      </BottomCTA>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <ConfirmModal
          message="이 기록을 삭제하시겠습니까?"
          confirmLabel="삭제"
          cancelLabel="취소"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
