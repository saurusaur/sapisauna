'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ONBOARDING } from '@/constants/content'
import { supabase } from '@/lib/supabase'

export default function NicknameEdit() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [originalNickname, setOriginalNickname] = useState('')
  const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'checking' | 'available' | 'duplicate' | 'invalid'>('idle')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setNickname(user.nickname || '')
      setOriginalNickname(user.nickname || '')
    }
  }, [])

  const isNicknameValid = nickname.length >= 2 && nickname.length <= 10

  const checkNickname = async () => {
    if (!isNicknameValid) {
      setNicknameStatus('invalid')
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

    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      user.nickname = nickname
      localStorage.setItem('user', JSON.stringify(user))
    }

    router.back()
  }

  return (
    <div className="min-h-screen bath-tile-bg">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-stone-700">닉네임 수정</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={nicknameStatus !== 'available'}
          className={`
            px-4 py-2 rounded-xl font-semibold transition-all
            ${nicknameStatus === 'available'
              ? 'text-white hover:opacity-90'
              : 'bg-stone-200 text-stone-400'
            }
          `}
          style={nicknameStatus === 'available' ? { backgroundColor: 'var(--color-green)' } : {}}
        >
          <span className="material-symbols-outlined">check</span>
        </button>
      </header>

      <main className="p-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-stone-700 mb-2">닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value)
              setNicknameStatus('idle')
            }}
            placeholder={ONBOARDING.NICKNAME.PLACEHOLDER}
            className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-green text-stone-700 mb-3"
            maxLength={10}
          />

          <button
            onClick={checkNickname}
            disabled={!nickname || nicknameStatus === 'checking'}
            className="w-full py-3 rounded-xl font-medium transition-all disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-green-light)', color: 'var(--color-green)' }}
          >
            {nicknameStatus === 'checking' ? '확인 중...' : ONBOARDING.NICKNAME.CHECK_BUTTON}
          </button>

          {/* 상태 메시지 */}
          {nicknameStatus !== 'idle' && nicknameStatus !== 'checking' && (
            <p className={`mt-3 text-sm flex items-center gap-1 ${
              nicknameStatus === 'available' ? 'text-green' : 'text-red-500'
            }`}>
              {nicknameStatus === 'available' && (
                <>
                  <span className="material-symbols-outlined text-sm">check</span>
                  {ONBOARDING.NICKNAME.AVAILABLE}
                </>
              )}
              {nicknameStatus === 'duplicate' && ONBOARDING.NICKNAME.DUPLICATE}
              {nicknameStatus === 'invalid' && ONBOARDING.NICKNAME.INVALID}
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
