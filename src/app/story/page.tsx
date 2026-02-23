'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { APP } from '@/constants/content'
import { captureCard, shareImage, downloadImage } from '@/lib/image-export'
import ConfirmModal from '@/components/ui/confirm-modal'
import SaunnerGraph from '@/components/svg/saunner-graph'
import BatherGraph from '@/components/svg/bather-graph'
import JimiGraph from '@/components/svg/jimi-graph'

type LogData = {
  _editId?: string
  display_id?: string
  place_name: string
  tribe_id: 'bather' | 'saunner' | 'jimi'
  created_at?: string
  date?: string
  // saunner
  sauna_temp?: number
  cold_bath_temp?: number
  repeat?: number
  totono?: number
  // bather
  water_quality?: number
  hot_bath_temp?: number
  refreshed_score?: number
  // jimi
  rest_quality?: number
  cleanliness?: number
  jjim_temp?: number
  // common
  revisit_score: number
  // deep log
  deep_log?: { [key: string]: unknown }
}

// 타입별 배경색 (CSS 변수 참조)
const TYPE_BG_COLORS: Record<string, string> = {
  saunner: 'var(--story-bg-saunner)',
  bather: 'var(--story-bg-bather)',
  jimi: 'var(--story-bg-jimi)',
}

// 타입별 표시 이름 (이탤릭 세리프)
const TYPE_DISPLAY_NAMES: Record<string, string> = {
  saunner: 'Saunner',
  bather: 'Bather',
  jimi: 'Jimi',
}

export default function Story() {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  const [log, setLog] = useState<LogData | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  useEffect(() => {
    const logData = localStorage.getItem('currentLog')
    if (logData) {
      setLog(JSON.parse(logData))
    }
  }, [])

  const handleShare = async () => {
    if (!cardRef.current || !log) return
    setIsExporting(true)
    try {
      const blob = await captureCard(cardRef.current)
      await shareImage(blob, `sauna-log-${log.place_name}`)
    } catch {
      // 공유 실패
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownload = async () => {
    if (!cardRef.current || !log) return
    setIsExporting(true)
    try {
      const blob = await captureCard(cardRef.current)
      const date = new Date(log.created_at || log.date || '').toISOString().slice(0, 10)
      downloadImage(blob, `sauna-log-${date}.png`)
    } catch {
      // 저장 실패
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeepLog = () => {
    router.push('/log/deep')
  }

  // 편집 모드 여부 (히스토리에서 edit으로 진입한 경우 _editId가 존재)
  const isEditMode = Boolean(log?._editId)

  // 취소: 모달 확인 후 기록 폐기
  const handleCancelConfirm = () => {
    localStorage.removeItem('currentLog')
    localStorage.removeItem('selectedPlace')
    router.push(isEditMode ? '/history' : '/home')
  }

  // 타입별 메인 수치
  const getMainMetric = () => {
    if (!log) return { value: '', unit: '', label: '' }

    switch (log.tribe_id) {
      case 'saunner': {
        const deltaT = (log.sauna_temp || 80) - (log.cold_bath_temp || 15)
        return { value: String(deltaT), unit: '°C', label: 'temperature delta' }
      }
      case 'bather': {
        const temp = log.hot_bath_temp || 40
        return { value: String(temp), unit: '°C', label: 'immersion temperature' }
      }
      case 'jimi': {
        const temp = log.jjim_temp
        return temp
          ? { value: String(temp), unit: '°C', label: 'jjimjilbang temperature' }
          : { value: '—', unit: '', label: 'jjimjilbang' }
      }
      default:
        return { value: '', unit: '', label: '' }
    }
  }

  const renderGraph = () => {
    if (!log) return null

    switch (log.tribe_id) {
      case 'saunner':
        return (
          <SaunnerGraph
            saunaTemp={log.sauna_temp || 80}
            coldBathTemp={log.cold_bath_temp || 15}
            repeat={log.repeat || 3}
            totono={log.totono || 3}
          />
        )
      case 'bather':
        return (
          <BatherGraph
            waterQuality={log.water_quality || 3}
            hotBathTemp={log.hot_bath_temp || 40}
            coldBathTemp={log.cold_bath_temp}
            refreshedScore={log.refreshed_score}
          />
        )
      case 'jimi':
        return (
          <JimiGraph
            cleanliness={log.cleanliness || 3}
            jjimTemp={log.jjim_temp}
          />
        )
      default:
        return null
    }
  }

  if (!log) {
    return (
      <div className="min-h-screen bath-tile-bg flex items-center justify-center">
        <p className="text-stone-400">로딩 중...</p>
      </div>
    )
  }

  const bgColor = TYPE_BG_COLORS[log.tribe_id] || TYPE_BG_COLORS.saunner
  const displayName = TYPE_DISPLAY_NAMES[log.tribe_id] || 'Saunner'
  const metric = getMainMetric()

  return (
    <div className="min-h-screen bath-tile-bg">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm flex items-center justify-between">
        {/* 왼쪽: 뒤로가기 (이전 화면으로 — 모바일 백 버튼과 동일) */}
        <button
          onClick={() => router.back()}
          className="p-2 text-stone-500 hover:text-stone-700 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>

        {/* 오른쪽: 취소 + 기록 저장 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="p-2 text-stone-400 hover:text-stone-600 text-xs transition-colors"
          >
            {isEditMode ? '편집 취소' : '기록 취소'}
          </button>
          <button
            onClick={() => router.push('/complete')}
            className="px-4 py-2 rounded-xl font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--color-green)' }}
          >
            {isEditMode ? '편집 저장' : '기록 저장'}
          </button>
        </div>
      </header>

      <main className="p-4">
        {/* 9:16 카드 프리뷰 */}
        <div className="flex justify-center mb-6">
          <div
            ref={cardRef}
            className="relative w-full max-w-[280px] rounded-2xl overflow-hidden shadow-xl"
            style={{
              aspectRatio: '9 / 16',
              backgroundColor: bgColor,
            }}
          >
            <div className="h-full flex flex-col px-6 py-8">
              {/* 상단: 장소명 + 날짜 */}
              <div className="text-center">
                <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-md px-2.5 py-1">
                  <span
                    className="material-symbols-outlined text-white/50 leading-none"
                    style={{ fontSize: '12px' }}
                  >
                    onsen
                  </span>
                  <h2
                    className="text-white/50 text-xs font-normal"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {log.place_name}
                  </h2>
                </div>
                <p
                  className="text-white/50 text-[12.5px] mt-1.5 italic"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {new Date(log.created_at || log.date || '').toISOString().slice(0, 10).replace(/-/g, '.')}
                </p>
              </div>

              {/* 중앙: 숫자 + 그래프 (겹침) */}
              <div className="flex-1 flex flex-col items-center justify-center relative">
                {/* 메인 수치 (그래프 위로 겹침) */}
                <div className="text-center z-10 mb-[-40px]">
                  <p
                    className="text-white/40 text-[10px] tracking-[0.2em] uppercase mb-2"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    {metric.label}
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span
                      className="text-white text-8xl font-light tracking-tight"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      {metric.value}
                    </span>
                    <span
                      className="text-white/70 text-2xl font-light ml-1"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      {metric.unit}
                    </span>
                  </div>
                </div>

                {/* 그래프 */}
                <div className="w-full h-[200px]">
                  {renderGraph()}
                </div>
              </div>

              {/* 하단: 타입태그 + 워터마크 */}
              <div className="text-center">
                <p
                  className="text-white/60 text-xs italic mb-1"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {displayName}
                </p>
                <p
                  className="text-white/20 text-[9px] tracking-[0.25em] uppercase"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {APP.NAME}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              disabled={isExporting}
              className="flex-1 py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-green)' }}
            >
              <span className="material-symbols-outlined">share</span>
              공유
            </button>
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex-1 py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-orange)' }}
            >
              <span className="material-symbols-outlined">download</span>
              저장
            </button>
          </div>

          <button
            onClick={handleDeepLog}
            className="w-full py-4 rounded-2xl font-semibold text-stone-600 bg-white border border-stone-200 flex items-center justify-center gap-2 hover:bg-stone-50 transition-all"
          >
            <span className="material-symbols-outlined">edit_note</span>
            {log?.deep_log ? '상세 기록 편집하기' : '상세 기록 추가하기'}
          </button>

        </div>
      </main>

      {/* 취소 확인 모달 */}
      {showCancelConfirm && (
        <ConfirmModal
          message={isEditMode
            ? '편집 내용을 취소하시겠습니까?'
            : '기록을 취소하시겠습니까?\n입력한 내용이 삭제됩니다.'}
          confirmLabel={isEditMode ? '편집 취소' : '기록 취소'}
          cancelLabel="돌아가기"
          onConfirm={handleCancelConfirm}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}
    </div>
  )
}
