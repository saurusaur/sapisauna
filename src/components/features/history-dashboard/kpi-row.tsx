/**
 * KpiRow — 이번 달 요약 KPI
 * 상단: "이번 달 요약" + "기록의 역사"(역대 방문, 트라이브명)
 * 하단: 기록한 날 | 다녀온 곳 (2칸)
 */

import type { KpiData } from '@/lib/history-stats'

interface KpiRowProps extends KpiData {
  accentColor?: string
  tribeName?: string   // 영문 대문자 트라이브명 ('BATHER', 'SAUNNER', 'JIMI', 'ALL')
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
      {/* 헤더 행: 이번 달 요약 | 기록의 역사 */}
      <div className="flex items-baseline justify-between px-1">
        <p className="text-[11px] font-bold text-stone-500">이번 달 요약</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] text-stone-400">기록의 역사</span>
          <span
            className="font-heading text-lg font-semibold"
            style={{ color: accentColor || '#292524' }}
          >
            {allTimeCount}
          </span>
          <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wide">
            {tribeName}
          </span>
        </div>
      </div>

      {/* KPI 2칸 */}
      <div className="grid grid-cols-2 gap-2">
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
      </div>
    </div>
  )
}
