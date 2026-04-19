'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/user-context'
import { useToast } from '@/contexts/toast-context'
import { TRIBE_EMOJI_MAP } from '@/constants/content'
import HueSlider from '@/components/ui/hue-slider'
import EmojiPickerField from '@/components/ui/emoji-picker-field'
import { coverHex } from '@/lib/utils'
import type { TribeId } from '@/types'

// 트라이브별 기본 hue (HSL, 0~360). 프로필 hue가 null일 때 초기값.
const TRIBE_DEFAULT_HUE: Record<TribeId, number> = {
  bather: 217,   // 파랑
  saunner: 25,   // 주황
  jimi: 142,     // 초록
}

export default function ProfileIconEdit() {
  const router = useRouter()
  const { user, updateUser } = useUser()
  const { showNotice } = useToast()

  const tribe = user?.primary_type || 'saunner'
  const defaultHue = TRIBE_DEFAULT_HUE[tribe]
  const defaultEmoji = TRIBE_EMOJI_MAP[tribe]

  const [hue, setHue] = useState(user?.profile_hue ?? defaultHue)
  const [emoji, setEmoji] = useState<string | null>(user?.profile_emoji ?? null)
  const [saving, setSaving] = useState(false)

  const currentHex = coverHex(hue)
  const displayEmoji = emoji || defaultEmoji

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateUser({
        profile_hue: hue,
        profile_emoji: emoji,
      })
      showNotice('아이콘이 저장되었어요')
      router.back()
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setHue(defaultHue)
    setEmoji(null)
  }

  return (
    <div className="min-h-dvh bath-tile-bg">
      <header className="p-5 pt-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-2xl font-extrabold italic font-heading">
            EDIT ICON
          </h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* 미리보기 */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-md"
            style={{ backgroundColor: currentHex }}
          >
            <span className="text-4xl leading-none">{displayEmoji}</span>
          </div>
          <p className="text-xs text-stone-400">미리보기</p>
        </div>

        {/* 배경색 */}
        <div className="glass-card-light p-4 rounded-xl space-y-4">
          <div>
            <label className="text-xs text-stone-500 mb-1.5 block">배경색</label>
            <HueSlider hue={hue} onChange={setHue} />
          </div>

          {/* 이모지 */}
          <EmojiPickerField
            emoji={emoji}
            onChange={setEmoji}
            label="이모지"
          />
        </div>

        {/* 기본값 되돌리기 */}
        <button
          type="button"
          onClick={handleReset}
          className="w-full text-center text-xs text-stone-400 hover:text-stone-600 transition-colors py-2"
        >
          기본값으로 되돌리기
        </button>

        {/* 저장 */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </main>
    </div>
  )
}
