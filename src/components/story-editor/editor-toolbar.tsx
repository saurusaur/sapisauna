/**
 * 에디터 하단 툴바
 * [배경] [스티커추가] + 선택 스티커 컨트롤 [90° 회전] [삭제]
 * 부모(에디터)에서 frosted glass 스타일 wrapper로 감싸줌
 */
'use client'

interface EditorToolbarProps {
  selectedStickerId: string | null
  onOpenBackground: () => void
  onOpenStickers: () => void
  onRotate: () => void
  onDelete: () => void
}

export default function EditorToolbar({
  selectedStickerId,
  onOpenBackground,
  onOpenStickers,
  onRotate,
  onDelete,
}: EditorToolbarProps) {
  return (
    <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenBackground}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 text-white/70 text-sm
            hover:bg-white/20 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-lg">palette</span>
          배경
        </button>
        <button
          onClick={onOpenStickers}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 text-white/70 text-sm
            hover:bg-white/20 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          스티커 추가
        </button>

        {/* 스페이서 */}
        <div className="flex-1" />

        {/* 선택 스티커 컨트롤 */}
        {selectedStickerId && (
          <>
            <button
              onClick={onRotate}
              className="p-2.5 rounded-xl bg-white/10 text-white/70
                hover:bg-white/20 active:scale-95 transition-all"
              title="90° 회전"
            >
              <span className="material-symbols-outlined text-lg">rotate_right</span>
            </button>
            <button
              onClick={onDelete}
              className="p-2.5 rounded-xl bg-red-500/20 text-red-400
                hover:bg-red-500/30 active:scale-95 transition-all"
              title="삭제"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
