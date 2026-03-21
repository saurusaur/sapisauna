/**
 * UserLogCard — 유저 기록 카드
 *
 * compact=true (홈 라이브 피드): 4줄 고정 높이, 메모 1줄 truncate
 * compact=false (장소 상세): 메모 전체 표시, 높이 유동
 */

import type { LogWithPlace } from '@/types'
import { getDetailText } from '@/lib/utils'
import { TRIBE_EMOJI_MAP } from '@/constants/content'

interface UserLogCardProps {
  log: LogWithPlace
  onClick?: () => void
  showPlace?: boolean
  compact?: boolean
}

export default function UserLogCard({ log, onClick, showPlace = false, compact = false }: UserLogCardProps) {
  const detailText = getDetailText(log)
  const shortDate = log.date.slice(5, 10).replace(/^0/, '').replace('-0', '/').replace('-', '/')

  const Wrapper = onClick ? 'button' : 'div'

  // ── compact: 홈 라이브 피드용 (4줄 고정) ──
  if (compact) {
    return (
      <Wrapper
        onClick={onClick}
        className={`w-full glass-card px-3 py-3.5 text-left h-[124px] flex flex-col justify-between overflow-hidden${onClick ? ' hover:shadow-md transition-all' : ''}`}
      >
        {/* Line 1: 장소명 + 트라이브 이모지 */}
        <div className="flex items-center justify-between">
          {showPlace
            ? <p className="text-sm font-medium text-stone-700 truncate">{log.place_name}</p>
            : <div />
          }
          <span className="text-sm shrink-0 ml-2">{TRIBE_EMOJI_MAP[log.tribe_id]}</span>
        </div>

        {/* Line 2: 점수 + 숏로그 메트릭 */}
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

        {/* Line 3: 메모 (1줄 고정 — 없으면 빈 칸) */}
        <div className="h-[20px] overflow-hidden">
          {log.deep_log?.memo && (
            <p className="text-sm text-stone-600 leading-tight truncate pr-3">{log.deep_log.memo}</p>
          )}
        </div>

        {/* Line 4: 닉네임 */}
        <div className="flex items-center justify-end gap-1.5">
          {log.user_title && (
            <span className="text-xs text-amber-600/70 px-2 py-0.5 rounded-full bg-amber-50">{log.user_title}</span>
          )}
          <span className="text-xs text-stone-400">{log.user_nickname || '익명'}</span>
        </div>
      </Wrapper>
    )
  }

  // ── default: 장소 상세용 (메모 전체, 높이 유동) ──
  return (
    <Wrapper
      onClick={onClick}
      className={`w-full glass-card p-4 text-left${onClick ? ' hover:shadow-md transition-all' : ''}`}
    >
      {/* 장소명 */}
      {showPlace && (
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-medium text-stone-700 truncate">{log.place_name}</p>
        </div>
      )}

      {/* Row1: 점수 + 메트릭 / 날짜 + 이모지 */}
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

      {/* Row2: 메모 (전체 표시) */}
      {log.deep_log?.memo && (
        <p className="text-sm text-stone-600 leading-relaxed mt-1.5">{log.deep_log.memo}</p>
      )}

      {/* Row3: 추천 메뉴 */}
      {log.deep_log?.store_memo && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="material-symbols-outlined text-stone-400" style={{ fontSize: '14px' }}>restaurant</span>
          <span className="text-xs text-stone-500">추천 메뉴:</span>
          <span className="text-xs font-medium text-stone-600">{log.deep_log.store_memo}</span>
        </div>
      )}

      {/* Row4: 닉네임 */}
      <div className="flex items-center justify-end gap-1.5 mt-2">
        {log.user_title && (
          <span className="text-xs text-amber-600/70 px-2 py-0.5 rounded-full bg-amber-50">{log.user_title}</span>
        )}
        <span className="text-xs text-stone-400">{log.user_nickname || '익명'}</span>
      </div>
    </Wrapper>
  )
}
