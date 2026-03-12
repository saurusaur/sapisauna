'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ONBOARDING, RESERVED_NICKNAMES } from '@/constants/content'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/user-context'
import BottomCTA from '@/components/ui/bottom-cta'

export default function NicknameEdit() {
  const router = useRouter()
  const { user, updateUser } = useUser()
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [originalNickname] = useState(user?.nickname || '')
  const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'checking' | 'available' | 'duplicate' | 'invalid' | 'reserved'>('idle')

  // 소문자 영문+숫자+언더스코어만
  const isNicknameValid = nickname.length >= 2 && nickname.length <= 10 && /^[a-z0-9_]+$/.test(nickname)

  const checkNickname = async () => {
    if (!isNicknameValid) {
      setNicknameStatus('invalid')
      return
    }

    if (RESERVED_NICKNAMES.includes(nickname.toLowerCase())) {
      setNicknameStatus('reserved')
      return
    }

    if (nickname === originalNickname) {
      setNicknameStatus('available')
      return
    }

    setNicknameStatus('checking')

    try {
      const { data, error } = await supabase
        .from('users')
        .select('nickname')
        .eq('nickname', nickname)
        .single()

      if (error && error.code === 'PGRST116') {
        setNicknameStatus('available')
      } else if (data) {
        setNicknameStatus('duplicate')
      } else {
        setNicknameStatus('available')
      }
    } catch (err) {
      setNicknameStatus('available')
    }
  }

  const handleSave = () => {
    if (nicknameStatus !== 'available') return
    updateUser({ nickname })
    router.back()
  }

  return (
    <div className="min-h-dvh bath-tile-bg flex flex-col">
      {/* 헤더 — 앱 통일 패턴 (history/[id], place/add 동일) */}
      <header className="p-5 pt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 text-stone-500 hover:text-stone-700 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1
              className="text-2xl font-extrabold italic font-heading"
            >
              NICKNAME
            </h1>
          </div>
        </div>
      </header>

      <main className="p-5 flex flex-col flex-1">
        {/* 입력 필드 — 카드 없이 단독 */}
        <input
          type="text"
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value.toLowerCase())
            setNicknameStatus('idle')
          }}
          placeholder={ONBOARDING.NICKNAME.PLACEHOLDER}
          className="w-full px-5 py-4 rounded-xl text-stone-700 glass-input border-2 border-stone-200 focus:outline-none transition-all"
          style={nicknameStatus === 'available' ? { borderColor: 'var(--color-primary-light)' } : {}}
          maxLength={10}
        />

        {/* 중복확인 버튼 — 입력 아래 중앙 */}
        <div className="flex justify-center mt-4">
          <button
            onClick={checkNickname}
            disabled={!nickname || nicknameStatus === 'checking' || nicknameStatus === 'available'}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 ${
              nicknameStatus === 'available'
                ? 'bg-stone-100 text-stone-400'
                : 'text-white hover:opacity-90'
            }`}
            style={nicknameStatus !== 'available' && nickname ? { backgroundColor: 'var(--color-primary)' } : {}}
          >
            {nicknameStatus === 'checking' ? '확인 중...' : '중복 확인'}
          </button>
        </div>

        {/* 상태 메시지 — 중앙 */}
        {nicknameStatus !== 'idle' && nicknameStatus !== 'checking' && (
          <p className={`mt-3 text-sm flex items-center justify-center gap-1 ${
            nicknameStatus === 'available' ? 'text-emerald-500' : 'text-stone-500'
          }`}>
            {nicknameStatus === 'available' && (
              <>
                <span className="material-symbols-outlined text-sm">check</span>
                {ONBOARDING.NICKNAME.AVAILABLE}
              </>
            )}
            {nicknameStatus === 'duplicate' && ONBOARDING.NICKNAME.DUPLICATE}
            {nicknameStatus === 'reserved' && ONBOARDING.NICKNAME.RESERVED}
            {nicknameStatus === 'invalid' && ONBOARDING.NICKNAME.INVALID}
          </p>
        )}
      </main>

      <BottomCTA onClick={handleSave} disabled={nicknameStatus !== 'available'}>저장</BottomCTA>
    </div>
  )
}
