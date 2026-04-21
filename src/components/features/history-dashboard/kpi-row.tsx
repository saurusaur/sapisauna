/**
 * KpiRow — 이번 달 요약 KPI 3칸
 * 헤더: "이번 달 요약" (좌) + "기록의 역사" (우)
 * KPI: 기록한 날 | 다녀온 곳 | 역대 방문 (트라이브명)
 */

import type { KpiData } from '@/lib/history-stats'

interface KpiRowProps extends KpiData {
  accentColor?: string
  tribeName?: string   // 영문 대문자: 'BATHER', 'SAUNNER', 'JIMI', 'ALL'
}

export default function KpiRow({
  recordedDays,
  daysInMonth,
  uniquePlaces,
  allTimeCount,
  accentColor,
  tribeName = 'ALL',
}: KpiRowProps) {
  return (
    <div className="space-y-2">
      {/* 헤더: 이번 달 요약 (2칸 위) + 총 기록 카운트 (3번째 칸 위) */}
      <div className="grid grid-cols-3 gap-2">
        <p className="col-span-2 text-xs font-bold text-stone-500 px-1">이번 달 요약</p>
        <p className="text-xs font-bold text-stone-500 px-1">총 기록 카운트</p>
      </div>

      {/* KPI 3칸 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-card-light p-3 rounded-xl">
          <p
            className="text-[10px] font-semibold mb-1"
            style={{ color: accentColor || '#78716c' }}
          >
            기록한 날
          </p>
          <p className="font-heading text-2xl font-semibold text-stone-800">
            {recordedDays}
            <span className="text-sm text-stone-400 font-normal">/{daysInMonth}</span>
          </p>
        </div>
        <div className="glass-card-light p-3 rounded-xl">
          <p
            className="text-[10px] font-semibold mb-1"
            style={{ color: accentColor || '#78716c' }}
          >
            다녀온 곳
          </p>
          <p className="font-heading text-2xl font-semibold text-stone-800">
            {String(uniquePlaces).padStart(2, '0')}
          </p>
        </div>
        <div className="glass-card-light p-3 rounded-xl">
          <p
            className="text-[10px] font-semibold mb-1"
            style={{ color: accentColor || '#78716c' }}
          >
            {tribeName}
          </p>
          <p className="font-heading text-2xl font-semibold text-stone-800">
            {allTimeCount}
          </p>
        </div>
      </div>
    </div>
  )
}
