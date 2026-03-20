/**
 * UserLogCard — 유저 기록 카드 (explore 장소 상세 + 홈 커뮤니티 피드)
 *
 * showPlace=true: 장소명 표시 (홈 피드용)
 * showPlace=false: 장소명 숨김 (장소 상세용, 기본값)
 * compact=true: 날짜 숨김 + 트라이브 이모지 우상단 (홈 가로스크롤용)
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

  return (
    <Wrapper
      onClick={onClick}
      className={`w-full glass-card p-4 text-left relative${onClick ? ' hover:shadow-md transition-all' : ''}`}
    >
      {/* 트라이브 이모지 — compact 모드에서 우상단 배치 */}
      {compact && (
        <span className="absolute top-2.5 right-3 text-sm">{TRIBE_EMOJI_MAP[log.tribe_id]}</span>
      )}

      {/* 장소명 (showPlace일 때만) */}
      {showPlace && (
        <p className="text-sm font-medium text-stone-700 mb-1.5 truncate pr-6">{log.place_name}</p>
      )}

      {/* Row1: 점수 + 숏로그 메트릭 (좌) / 날짜 + 트라이브 이모지 (우, compact 아닐 때) */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 text-xs text-stone-500${compact ? ' pr-6' : ''}`}>
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
        {!compact && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-stone-400">{shortDate}</span>
            <span className="text-sm">{TRIBE_EMOJI_MAP[log.tribe_id]}</span>
          </div>
        )}
      </div>

      {/* Row2: 메모 (있을 때만) */}
      {log.deep_log?.memo && (
        <p className="text-sm text-stone-600 leading-relaxed mt-1.5 line-clamp-2">{log.deep_log.memo}</p>
      )}

      {/* Row3: 추천 메뉴 (있을 때만) */}
      {log.deep_log?.store_memo && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="material-symbols-outlined text-stone-400" style={{ fontSize: '14px' }}>restaurant</span>
          <span className="text-xs text-stone-500">추천 메뉴:</span>
          <span className="text-xs font-medium text-stone-600">{log.deep_log.store_memo}</span>
        </div>
      )}

      {/* Row4: 칭호 + 닉네임 (하단 우측) */}
      <div className="flex items-center justify-end gap-1.5 mt-2">
        {log.user_title && (
          <span className="text-xs text-amber-600/70 px-2 py-0.5 rounded-full bg-amber-50">{log.user_title}</span>
        )}
        <span className="text-xs text-stone-400">{log.user_nickname || '익명'}</span>
      </div>
    </Wrapper>
  )
}
