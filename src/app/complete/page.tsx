'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TYPE_EMOJI_MAP, TYPE_CATEGORY_MAP } from '@/constants/content'
import { formatDateTime, getRevisitEmoji } from '@/lib/utils'

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

export default function Complete() {
  const router = useRouter()
  const [log, setLog] = useState<LogData | null>(null)

  useEffect(() => {
    const logData = localStorage.getItem('currentLog')
    if (logData) {
      setLog(JSON.parse(logData))
    }
  }, [])


  // 또올래요 점수 표시
  const renderRevisitScore = (score: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`w-3 h-3 rounded-full ${i <= score ? '' : 'bg-stone-200'}`}
            style={i <= score ? { backgroundColor: 'var(--color-orange)' } : {}}
          />
        ))}
      </div>
    )
  }

  if (!log) {
    return (
      <div className="min-h-screen bath-tile-bg flex items-center justify-center">
        <p className="text-stone-400">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bath-tile-bg flex flex-col items-center justify-center p-6">
      {/* 체크 아이콘 */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: 'var(--color-green-light)' }}
      >
        <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--color-green)' }}>check</span>
      </div>

      <h1 className="text-2xl font-bold text-stone-700 mb-2">기록 완료!</h1>

      {/* 장소 및 날짜 */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-1 text-stone-500 mb-1">
          <span className="material-symbols-outlined text-sm">location_on</span>
          <span>{log.place_name}</span>
        </div>
        <p className="text-sm text-stone-400">{formatDateTime(new Date(log.created_at))}</p>
      </div>

      {/* 기록 요약 카드 */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="text-center mb-4">
          <span className="text-3xl">{TYPE_EMOJI_MAP[log.log_type]}</span>
          <span className="ml-2 font-bold text-stone-700">{TYPE_CATEGORY_MAP[log.log_type]}</span>
        </div>

        <div className="space-y-2 text-sm">
          {log.log_type === 'sauner' && (
            <>
              <div className="flex justify-between">
                <span className="text-stone-500">사우나</span>
                <span className="font-medium text-stone-700">{log.sauna_temp}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">냉탕</span>
                <span className="font-medium text-stone-700">{log.cold_bath_temp}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">세트</span>
                <span className="font-medium text-stone-700">{log.sets}세트</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">토토노이</span>
                {renderRevisitScore(log.totono || 0)}
              </div>
            </>
          )}

          {log.log_type === 'bather' && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">수질</span>
                {renderRevisitScore(log.water_quality || 0)}
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">온탕</span>
                <span className="font-medium text-stone-700">{log.hot_bath_temp}°C</span>
              </div>
            </>
          )}

          {log.log_type === 'jimi' && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">휴식</span>
                {renderRevisitScore(log.rest_quality || 0)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">청결</span>
                {renderRevisitScore(log.cleanliness || 0)}
              </div>
            </>
          )}

          <div className="pt-2 border-t border-stone-100 flex justify-between items-center">
            <span className="text-stone-500">또올래요</span>
            <div className="flex items-center gap-2">
              {renderRevisitScore(log.revisit_score)}
              <span className="text-lg">{getRevisitEmoji(log.revisit_score)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 버튼들 */}
      <div className="w-full max-w-sm flex gap-3">
        <button
          onClick={() => router.push('/history')}
          className="flex-1 py-4 bg-white border-2 border-stone-200 rounded-2xl font-semibold text-stone-600 flex items-center justify-center gap-2 hover:border-stone-300 transition-all"
        >
          <span className="material-symbols-outlined">home</span>
          리스트 보기
        </button>
        <button
          onClick={() => router.push('/story')}
          className="flex-1 py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all"
          style={{ backgroundColor: 'var(--color-orange)' }}
        >
          <span className="material-symbols-outlined">photo_camera</span>
          스토리 만들기
        </button>
      </div>
    </div>
  )
}
