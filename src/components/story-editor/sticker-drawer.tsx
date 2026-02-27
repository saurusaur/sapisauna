/**
 * 스티커 추가 바텀시트 드로어
 * 실제 데이터로 렌더링된 미리보기 형태로 각 스티커 표시
 * 이미 캔버스에 존재하는 타입은 비활성 표시
 */
'use client'

import StickerContent from './sticker-content'
import type { LogData } from './sticker-content'
import type { Sticker, StickerType } from '@/lib/sticker-templates'
import { RITUAL_TYPES } from '@/lib/sticker-templates'

interface StickerDrawerProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (type: StickerType, text?: string) => void
  log: LogData
  nickname?: string
  existingStickers: Sticker[]
}

// 스티커 카테고리별 그룹
type StickerGroup = {
  label: string
  items: { type: StickerType; label: string }[]
}

function getStickerGroups(tribeId: string): StickerGroup[] {
  return [
    {
      label: '숫자',
      items: [
        { type: 'temp-delta', label: 'ΔT' },
        { type: 'heat-temp', label: '온도' },
      ],
    },
    {
      label: '그래프',
      items: [
        { type: 'graph', label: '그래프' },
      ],
    },
    {
      label: '정보',
      items: [
        { type: 'location', label: '장소' },
        { type: 'timestamp', label: '날짜' },
        { type: 'comment', label: '코멘트' },
        { type: 'score', label: '점수' },
        { type: 'nickname', label: '닉네임' },
        { type: 'tribe', label: tribeId === 'saunner' ? 'Saunner' : tribeId === 'bather' ? 'Bather' : 'Jimi' },
      ],
    },
    {
      label: '루틴',
      items: [
        { type: 'ritual-2line', label: '2줄' },
        { type: 'ritual-1col', label: '1컬럼' },
      ],
    },
  ]
}

export default function StickerDrawer({
  isOpen,
  onClose,
  onAdd,
  log,
  nickname,
  existingStickers,
}: StickerDrawerProps) {
  // 해당 타입이 이미 캔버스에 있는지 확인
  const isTypeUsed = (type: StickerType): boolean => {
    // ritual은 2line + 1col 합산
    if (RITUAL_TYPES.includes(type)) {
      return existingStickers.some(s => RITUAL_TYPES.includes(s.type))
    }
    // comment는 2개까지 허용
    if (type === 'comment') {
      return existingStickers.filter(s => s.type === 'comment').length >= 2
    }
    return existingStickers.some(s => s.type === type)
  }

  const groups = getStickerGroups(log.tribe_id)

  if (!isOpen) return null

  return (
    <>
      {/* 백드롭 */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* 바텀시트 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-stone-900 rounded-t-2xl max-h-[60vh] overflow-y-auto
        animate-slide-up">
        {/* 핸들 */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-stone-600 rounded-full" />
        </div>

        <div className="px-4 pb-6">
          <h3 className="text-white/80 text-sm font-medium mb-4 text-center">스티커 추가</h3>

          {groups.map(group => (
            <div key={group.label} className="mb-4">
              <p className="text-white/40 text-[11px] tracking-wider uppercase mb-2">{group.label}</p>
              <div className="flex flex-wrap gap-2">
                {group.items.map(item => {
                  const used = isTypeUsed(item.type)
                  return (
                    <button
                      key={item.type}
                      disabled={used}
                      onClick={() => {
                        onAdd(item.type, item.type === 'comment' ? '' : undefined)
                        onClose()
                      }}
                      className={`flex-shrink-0 px-3 py-2 rounded-xl border transition-all
                        ${used
                          ? 'border-stone-700 opacity-30 cursor-not-allowed'
                          : 'border-stone-600 hover:border-stone-400 active:scale-95'
                        }`}
                    >
                      <div className="pointer-events-none" style={{ maxWidth: '120px' }}>
                        <StickerContent
                          type={item.type}
                          log={log}
                          nickname={nickname}
                          text={item.type === 'comment' ? '자유 문구' : undefined}
                          isPreview
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
