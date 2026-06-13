'use client'

import type { CSSProperties } from 'react'
import type { SaList } from '@/types'
import { listToneColors } from '@/lib/utils'

/**
 * 리스트 커버 카드 — 사리스트 리디자인 공용 카드.
 * cover_hue 파스텔 배경 + cover_emoji 워터마크(우하단, 반투명) + 단일 잉크색 제목.
 * 사피픽 캐러셀(pick: 172×196 고정)과 태그 결과 모자이크(mosaic: 가변 높이) 겸용.
 */
interface ListCoverCardProps {
  list: SaList
  onClick: () => void
  /** 카드 좌상단 작은 배지 (예: "사피픽 №1") */
  badge?: string
  /** pick: 캐러셀 고정 크기 / mosaic: 부모 폭 기준 가변 */
  variant?: 'pick' | 'mosaic'
  /** mosaic 높이(px). 미지정 시 콘텐츠 높이 */
  height?: number
  style?: CSSProperties
  className?: string
}

export default function ListCoverCard({
  list,
  onClick,
  badge,
  variant = 'mosaic',
  height,
  style,
  className = '',
}: ListCoverCardProps) {
  const tones = listToneColors(list.cover_hue)
  const isPick = variant === 'pick'

  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-[11px] text-left flex flex-col transition-transform active:scale-[0.97] ${
        isPick ? 'w-[172px] h-[196px] flex-shrink-0 p-3.5' : 'w-full p-3'
      } ${className}`}
      style={{
        backgroundColor: tones.bg,
        height: !isPick && height ? `${height}px` : undefined,
        boxShadow: isPick
          ? '0 3px 9px -4px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.25)'
          : '0 4px 14px -6px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.25)',
        ...style,
      }}
    >
      {/* 이모지 워터마크 — 우하단, 반투명 (도형 대체) */}
      <span
        className="absolute pointer-events-none select-none"
        style={{
          fontSize: isPick ? '72px' : '58px',
          opacity: 0.3,
          right: '-6px',
          bottom: '-14px',
          transform: 'rotate(-8deg)',
        }}
        aria-hidden
      >
        {list.cover_emoji || '🧖'}
      </span>

      {badge && (
        <span
          className="relative z-[1] self-start text-[8.5px] font-extrabold tracking-[0.12em] rounded-full px-2 py-[3px] mb-1.5"
          style={{ backgroundColor: 'rgba(255,255,255,0.55)', color: tones.accent }}
        >
          {badge}
        </span>
      )}

      {/* 제목 — 단일 잉크색, 자연 줄바꿈 */}
      <span
        className={`relative z-[1] font-extrabold leading-tight line-clamp-2 ${
          isPick ? 'text-[15px]' : 'text-[14px]'
        }`}
        style={{ wordBreak: 'keep-all' }}
      >
        {list.title}
      </span>

      {/* 소개 — 리스트 설명 (사-피 추천 카드에만, 제목과 15px 간격으로 가독성 확보) */}
      {isPick && list.description && (
        <span className="relative z-[1] mt-[15px] text-[10.5px] leading-snug text-stone-700/75 line-clamp-3" style={{ wordBreak: 'keep-all' }}>
          {list.description}
        </span>
      )}

      {/* 하단 메타 — 큐레이터 · 구독수 */}
      <span className="relative z-[1] mt-auto text-[10px] font-semibold opacity-65 truncate w-full">
        @{list.owner_nickname || 'SA-PI'}
        {list.subscriber_count > 0 && ` · 구독 ${list.subscriber_count}`}
      </span>
    </button>
  )
}
