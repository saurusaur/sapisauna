'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ui/confirm-modal'
import { TRIBE_EMOJI_MAP, TRIBE_CATEGORY_MAP, ICONS, DEEP_LOG, QUICK_LOG } from '@/constants/content'
import { formatDateTime, formatShortDate, getWaterQualityLabel, getCleanlinessLabel, getStepLabel, getDetailText } from '@/lib/utils'
import { useLog, useLogsByPlace } from '@/hooks/use-logs'
import { deleteLog } from '@/lib/logs-service'
import DataState from '@/components/ui/data-state'

// DEEP_LOG options에서 id로 옵션을 찾는 헬퍼
function findOption(options: readonly { id: string; label: string; icon: string }[], id: string) {
  return options.find(o => o.id === id)
}

// 라벨 표시 컴포넌트
function OptionLabel({ options, id }: { options: readonly { id: string; label: string; icon: string }[]; id: string }) {
  const option = findOption(options, id)
  if (!option) return <span>{id}</span>
  return <span>{option.label}</span>
}

export default function HistoryDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [showAllSamePlace, setShowAllSamePlace] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // DB 로그 로드
  const { data: log, loading, error } = useLog(params.id)
  const { data: allPlaceLogs } = useLogsByPlace(log?.place_id || '')

  // 같은 장소 과거 기록 (현재 기록 제외)
  const samePlaceLogs = log ? allPlaceLogs.filter(l => l.id !== log.id) : []
  const visibleSamePlaceLogs = showAllSamePlace ? samePlaceLogs : samePlaceLogs.slice(0, 2)
  const hasMoreSamePlaceLogs = samePlaceLogs.length > 2

  // 점수를 descriptor 텍스트로 표시
  const getRevisitLabel = (score: number): string => {
    return getStepLabel(QUICK_LOG.COMMON.REVISIT.steps, score)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await deleteLog(params.id)
      router.push('/history')
    } catch (e) {
      console.error('삭제 실패:', e)
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // 로딩/에러 상태
  if (loading) {
    return (
      <div className="min-h-screen bath-tile-bg flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl text-stone-300 animate-spin">progress_activity</span>
      </div>
    )
  }

  if (error || !log) {
    return (
      <div className="min-h-screen bath-tile-bg flex items-center justify-center">
        <p className="text-stone-400">기록을 찾을 수 없습니다</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bath-tile-bg pb-8">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-stone-700">기록 상세</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              // 기존 기록을 currentLog로 설정하고 폼으로 이동
              const logAsCurrentLog = {
                _editId: log.id,
                place_id: log.place_id,
                place_name: log.place_name,
                tribe_id: log.tribe_id,
                created_at: log.date,
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
                cleanliness: log.cleanliness,
                ...(log.deep_log && { deep_log: log.deep_log }),
              }
              localStorage.setItem('currentLog', JSON.stringify(logAsCurrentLog))
              localStorage.setItem('selectedPlace', JSON.stringify({ id: log.place_id, name: log.place_name }))
              router.push('/log')
            }}
            className="p-2 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">edit</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-red-400 hover:text-red-600 transition-colors"
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* 장소 정보 */}
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <button
            onClick={() => router.push(`/explore/${log.place_id}`)}
            className="flex items-center justify-center gap-1 mb-1 hover:opacity-70 transition-opacity"
          >
            <span className="material-symbols-outlined text-xs text-stone-500">{ICONS.PLACE}</span>
            <span className="font-semibold text-lg text-stone-700">{log.place_name}</span>
            <span className="material-symbols-outlined text-sm text-stone-400">chevron_right</span>
          </button>
          <p className="text-sm text-stone-400 mb-2">{log.address}</p>
          <p className="text-sm text-stone-500">{formatDateTime(new Date(log.date))}</p>
        </div>

        {/* Quick Log 정보 */}
        <div>
          <h2 className="text-center text-sm font-bold text-stone-500 mb-3 flex items-center gap-2">
            <span className="w-full h-px bg-stone-200"></span>
            <span className="whitespace-nowrap px-2 flex items-center gap-1">
              {TRIBE_EMOJI_MAP[log.tribe_id]} {TRIBE_CATEGORY_MAP[log.tribe_id]}
            </span>
            <span className="w-full h-px bg-stone-200"></span>
          </h2>

          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            {log.tribe_id === 'saunner' && (
              <>
                <div className="flex justify-between">
                  <span className="text-stone-500">사우나 온도</span>
                  <span className="font-medium text-stone-700">{log.sauna_temp}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">냉탕 온도</span>
                  <span className="font-medium text-stone-700">{log.cold_bath_temp}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">세트 수</span>
                  <span className="font-medium text-stone-700">{log.repeat}세트</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">토토노이 강도</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-orange)' }}>
                    {getStepLabel(QUICK_LOG.SAUNER.TOTONO.steps, log.totono_score || 0)}
                  </span>
                </div>
              </>
            )}

            {log.tribe_id === 'bather' && (
              <>
                <div className="flex justify-between">
                  <span className="text-stone-500">수질</span>
                  <span className="font-medium text-stone-700">{getWaterQualityLabel(log.water_quality || 3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">온탕 온도</span>
                  <span className="font-medium text-stone-700">{log.hot_bath_temp}°C</span>
                </div>
              </>
            )}

            {log.tribe_id === 'jimi' && (
              <>
                {log.jjim_temp && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">한증막 온도</span>
                    <span className="font-medium text-stone-700">{log.jjim_temp}°C</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-500">청결도</span>
                  <span className="font-medium text-stone-700">{getCleanlinessLabel(log.cleanliness || 3)}</span>
                </div>
              </>
            )}

            <div className="pt-3 border-t border-stone-100 flex justify-end items-center gap-2">
              <span className="text-sm font-medium" style={{ color: 'var(--color-orange)' }}>
                {getRevisitLabel(log.revisit_score)}
              </span>
            </div>
          </div>
        </div>

        {/* Deep Log 정보 */}
        {log.deep_log && (
          <div>
            <h2 className="text-center text-sm font-bold text-stone-500 mb-3 flex items-center gap-2">
              <span className="w-full h-px bg-stone-200"></span>
              <span className="whitespace-nowrap px-2">Deep Log</span>
              <span className="w-full h-px bg-stone-200"></span>
            </h2>

            <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
              {log.deep_log.companion && (
                <div className="flex justify-between">
                  <span className="text-stone-500">동행자</span>
                  <span className="font-medium text-stone-700"><OptionLabel options={DEEP_LOG.COMPANION.options} id={log.deep_log.companion} /></span>
                </div>
              )}
              {log.deep_log.purposes && log.deep_log.purposes.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-stone-500">방문 목적</span>
                  <span className="font-medium text-stone-700">
                    {log.deep_log.purposes.map(id => {
                      const opt = DEEP_LOG.PURPOSE.options.find(o => o.id === id)
                      return opt?.label ?? id
                    }).join(', ')}
                  </span>
                </div>
              )}
              {log.deep_log.cost && (
                <div className="flex justify-between">
                  <span className="text-stone-500">비용</span>
                  <span className="font-medium text-stone-700">{log.deep_log.cost.toLocaleString()}원</span>
                </div>
              )}
              {log.deep_log.crowd && (
                <div className="flex justify-between">
                  <span className="text-stone-500">혼잡도</span>
                  <span className="font-medium text-stone-700"><OptionLabel options={DEEP_LOG.CROWD.options} id={log.deep_log.crowd} /></span>
                </div>
              )}
              {log.deep_log.has_scrub && (
                <div className="flex justify-between">
                  <span className="text-stone-500">세신</span>
                  <span className="font-medium text-stone-700">
                    {DEEP_LOG.SCRUB.satisfaction.steps.find(s => s.value === log.deep_log!.scrub_satisfaction)?.label ?? '이용'}
                  </span>
                </div>
              )}
              {log.deep_log.has_store && (
                <div className="flex justify-between">
                  <span className="text-stone-500">매점</span>
                  <span className="font-medium text-stone-700">
                    {log.deep_log.store_memo || '이용'}
                  </span>
                </div>
              )}
              {log.deep_log.memo && (
                <div className="pt-2 border-t border-stone-100">
                  <p className="text-sm text-stone-500">{log.deep_log.memo}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 같은 장소 과거 기록 */}
        {samePlaceLogs.length > 0 && (
          <div>
            <h2 className="text-center text-sm font-bold text-stone-500 mb-3 flex items-center gap-2">
              <span className="w-full h-px bg-stone-200"></span>
              <span className="whitespace-nowrap px-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">{ICONS.PLACE}</span>
                {log.place_name}에서의 기록
              </span>
              <span className="w-full h-px bg-stone-200"></span>
            </h2>

            <div className="space-y-3">
              {visibleSamePlaceLogs.map((item) => (
                <button
                  key={item.id}
                  onClick={() => router.push(`/history/${item.id}`)}
                  className="w-full bg-white p-4 rounded-xl shadow-sm text-left hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">
                      {TRIBE_EMOJI_MAP[item.tribe_id]} {TRIBE_CATEGORY_MAP[item.tribe_id]}
                    </span>
                    <span className="text-sm text-stone-400">{formatShortDate(new Date(item.date))}</span>
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-stone-400">{getDetailText(item)}</p>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-orange)' }}>
                      {getRevisitLabel(item.revisit_score)}
                    </span>
                  </div>
                </button>
              ))}

              {/* 더보기 버튼 */}
              {hasMoreSamePlaceLogs && !showAllSamePlace && (
                <button
                  onClick={() => setShowAllSamePlace(true)}
                  className="w-full py-3 text-sm font-medium rounded-xl border border-stone-200 bg-white hover:bg-stone-50 transition-colors flex items-center justify-center gap-1"
                  style={{ color: 'var(--color-green)' }}
                >
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                  더보기 ({samePlaceLogs.length - 2}개)
                </button>
              )}

              {/* 접기 버튼 */}
              {showAllSamePlace && hasMoreSamePlaceLogs && (
                <button
                  onClick={() => setShowAllSamePlace(false)}
                  className="w-full py-3 text-sm font-medium rounded-xl border border-stone-200 bg-white hover:bg-stone-50 transition-colors flex items-center justify-center gap-1 text-stone-400"
                >
                  <span className="material-symbols-outlined text-sm">expand_less</span>
                  접기
                </button>
              )}
            </div>
          </div>
        )}

        {/* 스토리 만들기 버튼 */}
        <button
          onClick={() => {
            localStorage.setItem('currentLog', JSON.stringify(log))
            router.push('/story')
          }}
          className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all"
          style={{ backgroundColor: 'var(--color-orange)' }}
        >
          <span className="material-symbols-outlined">photo_camera</span>
          스토리 만들기
        </button>
      </main>

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
