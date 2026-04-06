'use client'

/**
 * EmojiPickerField — 탭하면 Frimousse 이모지 피커가 열리는 공용 필드
 * 사용처: SA-LIST 커버 이모지, 프로필 아이콘
 * 사람/몸, 기호, 깃발 카테고리 제거 (API 프록시로 필터링)
 */

import { useState, useEffect, type ComponentProps } from 'react'

interface EmojiPickerFieldProps {
  emoji: string | null
  onChange: (v: string | null) => void
  label?: string
}

// 커스텀 컴포넌트: 카테고리 헤더 → 구분선만
function CategoryHeader({ category, ...props }: { category: { label: string } } & ComponentProps<'div'>) {
  return <div {...props} className="border-t border-stone-100" />
}

// 커스텀 컴포넌트: 이모지 버튼 → 크게
function EmojiButton({ emoji, ...props }: { emoji: { emoji: string; label: string; isActive: boolean } } & ComponentProps<'button'>) {
  return (
    <button
      {...props}
      className={`flex items-center justify-center rounded-lg text-2xl transition-colors ${
        emoji.isActive ? 'bg-stone-100' : 'hover:bg-stone-50 active:bg-stone-100'
      }`}
      style={{ width: '100%', aspectRatio: '1', fontSize: '28px' }}
    >
      {emoji.emoji}
    </button>
  )
}

export default function EmojiPickerField({ emoji, onChange, label = '이모지 (선택)' }: EmojiPickerFieldProps) {
  const [open, setOpen] = useState(false)
  const [Picker, setPicker] = useState<typeof import('frimousse')['EmojiPicker'] | null>(null)

  useEffect(() => {
    if (open && !Picker) {
      import('frimousse').then(m => setPicker(() => m.EmojiPicker))
    }
  }, [open, Picker])

  return (
    <div>
      <label className="text-xs text-stone-500 mb-1.5 block">{label}</label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-10 h-10 rounded-xl text-xl flex items-center justify-center border border-stone-200 bg-white hover:border-stone-300 transition-colors"
        >
          {emoji || <span className="material-symbols-outlined text-stone-300" style={{ fontSize: '20px' }}>add_reaction</span>}
        </button>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-xs text-stone-500 hover:text-stone-700 transition-colors"
        >
          {open ? '닫기' : emoji ? '변경' : '선택'}
        </button>
        {emoji && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            제거
          </button>
        )}
      </div>

      {open && (
        <div className="mt-2 rounded-xl border border-stone-200 overflow-hidden bg-white">
          {!Picker ? (
            <div className="flex items-center justify-center py-8">
              <span className="material-symbols-outlined text-stone-300 animate-spin">progress_activity</span>
            </div>
          ) : (
            <Picker.Root
              onEmojiSelect={({ emoji: e }) => { onChange(e); setOpen(false) }}
              locale="ko"
              columns={6}
              emojibaseUrl="/api/emoji"
            >
              <Picker.Search
                placeholder="이모지 검색..."
                className="w-full px-3 py-2.5 text-sm text-stone-700 outline-none border-b border-stone-100 bg-transparent placeholder:text-stone-400"
              />
              <Picker.Viewport className="h-[260px]">
                <Picker.Loading>
                  <div className="flex items-center justify-center py-6">
                    <span className="material-symbols-outlined text-stone-300 animate-spin">progress_activity</span>
                  </div>
                </Picker.Loading>
                <Picker.Empty>
                  <p className="text-center text-xs text-stone-400 py-6">결과 없음</p>
                </Picker.Empty>
                <Picker.List
                  components={{
                    CategoryHeader,
                    Emoji: EmojiButton,
                  }}
                />
              </Picker.Viewport>
            </Picker.Root>
          )}
        </div>
      )}
    </div>
  )
}
