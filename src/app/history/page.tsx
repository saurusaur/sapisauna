'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { NAV, ICONS, TYPE_EMOJI_MAP, TYPE_CATEGORY_MAP } from '@/constants/content'
import { formatShortDate, getWaterQualityLabel, getRestQualityLabel, getCleanlinessLabel } from '@/lib/utils'
import { DUMMY_LOGS, type DummyLog } from '@/data/dummy-logs'

export default function History() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  // 검색어로 필터링
  const filteredLogs = searchQuery
    ? DUMMY_LOGS.filter((log) =>
        log.place_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : DUMMY_LOGS

  // 월별로 그룹화
  const groupByMonth = (logs: DummyLog[]) => {
    const groups: Record<string, DummyLog[]> = {}

    logs.forEach((log) => {
      const date = new Date(log.date)
      const key = `${date.getFullYear()}년 ${date.getMonth() + 1}월`
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(log)
    })

    return groups
  }

  const groupedLogs = groupByMonth(filteredLogs)

  // 또올래요 점수 표시
  const renderRevisitScore = (score: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full`}
            style={{ backgroundColor: i <= score ? 'var(--color-orange)' : '#e5e5e5' }}
          />
        ))}
      </div>
    )
  }

  // 상세 정보 텍스트
  const getDetailText = (log: DummyLog) => {
    switch (log.log_type) {
      case 'saunner':
        return `사우나 ${log.sauna_temp}°C · 냉탕 ${log.cold_bath_temp}°C · ${log.sets}세트`
      case 'bather':
        return `수질 ${getWaterQualityLabel(log.water_quality || 3)} · 온탕 ${log.hot_bath_temp}°C`
      case 'jimi':
        return `휴식 ${getRestQualityLabel(log.rest_quality || 3)} · 청결 ${getCleanlinessLabel(log.cleanliness || 3)}`
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen pb-20 bath-tile-bg">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/home')}
            className="p-2 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-stone-700">기록</h1>
        </div>
      </header>

      {/* 검색 */}
      <div className="px-4 pt-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xl">
            search
          </span>
          <input
            type="text"
            placeholder="장소명으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-white rounded-xl shadow-sm text-sm text-stone-700 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-stone-200 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>
      </div>

      <main className="p-4">
        {Object.keys(groupedLogs).length === 0 ? (
          // 검색 결과 없음
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-4xl text-stone-300 mb-2 block">
              search_off
            </span>
            <p className="text-stone-400 text-sm">
              &apos;{searchQuery}&apos;에 대한 기록이 없습니다
            </p>
          </div>
        ) : (
          Object.entries(groupedLogs).map(([month, logs]) => (
            <div key={month} className="mb-6">
              <h2 className="text-sm font-semibold text-stone-500 mb-3">{month}</h2>

              <div className="space-y-3">
                {logs.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => router.push(`/history/${log.id}`)}
                    className="w-full bg-white p-4 rounded-xl shadow-sm text-left hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-stone-400 text-sm">location_on</span>
                        <span className="font-medium text-stone-700">{log.place_name}</span>
                      </div>
                      <span className="text-sm text-stone-400">{formatShortDate(new Date(log.date))}</span>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">
                        {TYPE_EMOJI_MAP[log.log_type]} {TYPE_CATEGORY_MAP[log.log_type]}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-400">또올래요</span>
                        {renderRevisitScore(log.revisit_score)}
                      </div>
                    </div>

                    <p className="text-xs text-stone-400">{getDetailText(log)}</p>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-stone-200">
        <div className="flex justify-around py-3 max-w-md mx-auto">
          <button
            onClick={() => router.push('/home')}
            className="flex flex-col items-center text-stone-400 hover:text-stone-600"
          >
            <span className="material-symbols-outlined">{ICONS.HOME}</span>
            <span className="text-xs mt-1">{NAV.HOME}</span>
          </button>
          <button className="flex flex-col items-center" style={{ color: 'var(--color-green)' }}>
            <span className="material-symbols-outlined">{ICONS.HISTORY}</span>
            <span className="text-xs mt-1">{NAV.HISTORY}</span>
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="flex flex-col items-center text-stone-400 hover:text-stone-600"
          >
            <span className="material-symbols-outlined">{ICONS.SETTINGS}</span>
            <span className="text-xs mt-1">{NAV.SETTINGS}</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
