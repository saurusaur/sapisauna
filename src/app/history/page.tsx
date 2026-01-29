'use client'

import { useRouter } from 'next/navigation'
import { NAV, ICONS, TYPE_EMOJI_MAP, TYPE_CATEGORY_MAP } from '@/constants/content'
import { formatShortDate, getWaterQualityLabel, getRestQualityLabel, getCleanlinessLabel } from '@/lib/utils'

// 더미 히스토리 데이터
const DUMMY_LOGS = [
  {
    id: '1',
    place_name: '스파랜드',
    date: '2025-01-27',
    log_type: 'sauner' as const,
    revisit_score: 5,
    sauna_temp: 95,
    cold_bath_temp: 15,
    sets: 3,
    totono: 5,
  },
  {
    id: '2',
    place_name: '스파랜드',
    date: '2025-01-25',
    log_type: 'sauner' as const,
    revisit_score: 4,
    sauna_temp: 92,
    cold_bath_temp: 14,
    sets: 4,
    totono: 4,
  },
  {
    id: '3',
    place_name: '청학동목욕탕',
    date: '2025-01-20',
    log_type: 'bather' as const,
    revisit_score: 3,
    water_quality: 4,
    hot_bath_temp: 42,
  },
  {
    id: '4',
    place_name: '드래곤힐스파',
    date: '2024-12-31',
    log_type: 'jimi' as const,
    revisit_score: 4,
    rest_quality: 5,
    cleanliness: 4,
  },
]

export default function History() {
  const router = useRouter()

  // 월별로 그룹화
  const groupByMonth = (logs: typeof DUMMY_LOGS) => {
    const groups: Record<string, typeof DUMMY_LOGS> = {}

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

  const groupedLogs = groupByMonth(DUMMY_LOGS)


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
  const getDetailText = (log: (typeof DUMMY_LOGS)[0]) => {
    switch (log.log_type) {
      case 'sauner':
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
        <button className="p-2 text-stone-500 hover:text-stone-700 transition-colors">
          <span className="material-symbols-outlined">filter_list</span>
        </button>
      </header>

      <main className="p-4">
        {Object.entries(groupedLogs).map(([month, logs]) => (
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
        ))}
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
