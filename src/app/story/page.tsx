'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { APP, TYPE_ICON_MAP, TYPE_CATEGORY_MAP, STORY_TEMPLATES } from '@/constants/content'
import { formatDate } from '@/lib/utils'
import { captureCard, shareImage, downloadImage } from '@/lib/image-export'
import SaunerGraph from '@/components/svg/sauner-graph'
import BatherGraph from '@/components/svg/bather-graph'
import JimiGraph from '@/components/svg/jimi-graph'

type LogData = {
  place_name: string
  log_type: 'bather' | 'sauner' | 'jimi'
  created_at: string
  sauna_temp?: number
  cold_bath_temp?: number
  sets?: number
  totono?: number
  water_quality?: number
  hot_bath_temp?: number
  rest_quality?: number
  cleanliness?: number
  revisit_score: number
}

export default function Story() {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  const [log, setLog] = useState<LogData | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const logData = localStorage.getItem('currentLog')
    if (logData) {
      setLog(JSON.parse(logData))
    }
  }, [])

  // 이미지 공유
  const handleShare = async () => {
    if (!cardRef.current || !log) return
    setIsExporting(true)
    try {
      const blob = await captureCard(cardRef.current)
      await shareImage(blob, `sauna-log-${log.place_name}`)
    } catch {
      // 공유 실패 시 무시 (사용자가 취소한 경우 포함)
    } finally {
      setIsExporting(false)
    }
  }

  // 이미지 저장
  const handleDownload = async () => {
    if (!cardRef.current || !log) return
    setIsExporting(true)
    try {
      const blob = await captureCard(cardRef.current)
      const date = new Date(log.created_at).toISOString().slice(0, 10)
      downloadImage(blob, `sauna-log-${date}.png`)
    } catch {
      // 저장 실패
    } finally {
      setIsExporting(false)
    }
  }

  // Deep Log로 이동
  const handleDeepLog = () => {
    router.push('/log/deep')
  }

  // 타입별 SVG 그래프 렌더링
  const renderGraph = () => {
    if (!log) return null

    switch (log.log_type) {
      case 'sauner':
        return (
          <SaunerGraph
            saunaTemp={log.sauna_temp || 80}
            coldBathTemp={log.cold_bath_temp || 15}
            sets={log.sets || 3}
            totono={log.totono || 3}
          />
        )
      case 'bather':
        return (
          <BatherGraph
            waterQuality={log.water_quality || 3}
            hotBathTemp={log.hot_bath_temp || 40}
          />
        )
      case 'jimi':
        return (
          <JimiGraph
            restQuality={log.rest_quality || 3}
            cleanliness={log.cleanliness || 3}
          />
        )
      default:
        return null
    }
  }

  // 배경 이미지 (minimal 고정)
  const templateBg = STORY_TEMPLATES.MINIMAL.bg

  if (!log) {
    return (
      <div className="min-h-screen bath-tile-bg flex items-center justify-center">
        <p className="text-stone-400">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bath-tile-bg">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/home')}
            className="p-2 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <h1 className="text-lg font-bold text-stone-700">스토리</h1>
        </div>
      </header>

      <main className="p-4">
        {/* 9:16 카드 프리뷰 */}
        <div className="flex justify-center mb-6">
          <div
            ref={cardRef}
            className="relative w-full max-w-[280px] rounded-2xl overflow-hidden shadow-lg"
            style={{ aspectRatio: '9 / 16' }}
          >
            {/* 배경 이미지 */}
            <img
              src={templateBg}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* 콘텐츠 오버레이 */}
            <div className="relative z-10 h-full flex flex-col justify-between p-6">
              {/* 상단: 타입 + 장소 + 날짜 */}
              <div className="text-center pt-4">
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <span className="material-symbols-outlined text-stone-600" style={{ fontSize: '20px' }}>
                    {TYPE_ICON_MAP[log.log_type]}
                  </span>
                  <span className="text-sm font-semibold text-stone-600 tracking-wide uppercase">
                    {TYPE_CATEGORY_MAP[log.log_type]}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="material-symbols-outlined text-stone-500" style={{ fontSize: '16px' }}>
                    location_on
                  </span>
                  <span className="text-base font-bold text-stone-800">{log.place_name}</span>
                </div>
                <p className="text-xs text-stone-500">
                  {formatDate(new Date(log.created_at))}
                </p>
              </div>

              {/* 중앙: SVG 그래프 */}
              <div className="flex-1 flex items-center justify-center px-2">
                <div className="w-full max-w-[220px]">
                  {renderGraph()}
                </div>
              </div>

              {/* 하단: 워터마크 */}
              <div className="text-center pb-2">
                <p className="text-[10px] text-stone-400 tracking-widest uppercase">
                  {APP.NAME}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="space-y-3">
          {/* 공유 + 저장 (가로 배치) */}
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

          {/* 상세 기록 */}
          <button
            onClick={handleDeepLog}
            className="w-full py-4 rounded-2xl font-semibold text-stone-600 bg-white border border-stone-200 flex items-center justify-center gap-2 hover:bg-stone-50 transition-all"
          >
            <span className="material-symbols-outlined">edit_note</span>
            상세 기록 추가하기
          </button>

          {/* 홈으로 */}
          <button
            onClick={() => router.push('/home')}
            className="w-full py-3 text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </main>
    </div>
  )
}
