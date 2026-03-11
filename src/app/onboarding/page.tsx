'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { APP, ONBOARDING, TRIBES } from '@/constants/content'
import type { TribeId } from '@/types'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/user-context'
import { useAuth } from '@/contexts/auth-context'

// 온보딩 단계: 닉네임 → 타입 선택 (2단계)
type OnboardingStep = 'nickname' | 'type'

export default function Onboarding() {
  const router = useRouter()
  const { setUser } = useUser()
  const { user: authUser } = useAuth()

  // 현재 단계
  const [step, setStep] = useState<OnboardingStep>('nickname')

  // Step 1: 닉네임
  const [nickname, setNickname] = useState('')
  const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'checking' | 'available' | 'duplicate' | 'invalid' | 'error'>('idle')

  // Step 2: 타입 선택
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [lastToggledType, setLastToggledType] = useState<string | null>(null)
  const [lastToggleAction, setLastToggleAction] = useState<'selected' | 'deselected' | null>(null)

  // 제출 상태
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // 닉네임 유효성 검사
  const isNicknameValid = nickname.length >= 2 && nickname.length <= 10

  // 닉네임 중복 체크
  const checkNickname = async () => {
    if (!isNicknameValid) {
      setNicknameStatus('invalid')
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
    } catch {
      setNicknameStatus('error')
    }
  }

  // 타입 클릭 핸들러 (복수 선택, 선택 순서 = 우선순위)
  const handleTypeClick = (typeId: string) => {
    setLastToggledType(typeId)
    setSelectedTypes((prev) => {
      if (prev.includes(typeId)) {
        setLastToggleAction('deselected')
        return prev.filter((id) => id !== typeId)
      } else {
        setLastToggleAction('selected')
        return [...prev, typeId]
      }
    })
  }

  // 선택 순서 반환
  const getSelectionRank = (typeId: string): number | null => {
    const index = selectedTypes.indexOf(typeId)
    return index >= 0 ? index + 1 : null
  }

  // 다음 단계로 이동
  const goToNextStep = () => {
    if (step === 'nickname' && nicknameStatus === 'available') {
      setStep('type')
    }
  }

  // 이전 단계로 이동
  const goToPrevStep = () => {
    if (step === 'type') {
      setStep('nickname')
    }
  }

  // 최종 제출 - DB 저장 성공 후 localStorage 캐시 + 홈 이동
  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    const userData = {
      nickname,
      user_types: selectedTypes,
      primary_type: selectedTypes[0] as TribeId,
    }

    try {
      if (authUser) {
        const { error } = await supabase.from('users').upsert({
          id: authUser.id,
          nickname: userData.nickname,
          user_types: userData.user_types,
          primary_type: userData.primary_type,
        })
        if (error) {
          if (error.code === '23505') {
            setNicknameStatus('duplicate')
            setStep('nickname')
            return
          }
          throw error
        }
      }

      setUser(userData)
      router.push('/home')
    } catch {
      setSubmitError('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = nicknameStatus === 'available'
  const canSubmit = selectedTypes.length > 0 && !isSubmitting

  return (
    <div className="flex flex-col min-h-screen bath-tile-bg">
      {/* Step 1: 닉네임 입력 */}
      {step === 'nickname' && (
        <div className="flex flex-col items-center flex-1 px-6 pb-24">
          {/* 로고 Placeholder */}
          <div className="mt-16 mb-4 w-28 h-28 rounded-3xl bg-stone-200/50 flex items-center justify-center">
            <span className="text-4xl text-stone-300">SA</span>
          </div>
          <p className="text-sm text-stone-500 mb-12">{APP.TAGLINE}</p>

          {/* 제목 */}
          <h2 className="text-xl font-bold text-stone-700 mb-6">{ONBOARDING.NICKNAME.TITLE}</h2>

          {/* 입력 필드 */}
          <input
            type="text"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value)
              setNicknameStatus('idle')
            }}
            placeholder={ONBOARDING.NICKNAME.PLACEHOLDER}
            className="w-full max-w-xs px-5 py-4 rounded-2xl text-stone-700 glass-input border-2 border-stone-200 focus:outline-none transition-all"
            style={nicknameStatus === 'available' ? { borderColor: 'var(--color-primary-light)' } : {}}
            maxLength={10}
          />

          {/* 중복확인 버튼 — 아래 중앙 */}
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

          {/* 상태 메시지 */}
          {nicknameStatus !== 'idle' && nicknameStatus !== 'checking' && (
            <p className={`mt-3 text-sm flex items-center gap-1 ${
              nicknameStatus === 'available' ? 'text-emerald-500' : 'text-stone-500'
            }`}>
              {nicknameStatus === 'available' && (
                <>
                  <span className="material-symbols-outlined text-sm">check</span>
                  {ONBOARDING.NICKNAME.AVAILABLE}
                </>
              )}
              {nicknameStatus === 'duplicate' && ONBOARDING.NICKNAME.DUPLICATE}
              {nicknameStatus === 'invalid' && ONBOARDING.NICKNAME.INVALID}
              {nicknameStatus === 'error' && '확인에 실패했습니다. 다시 시도해주세요.'}
            </p>
          )}
        </div>
      )}

      {/* Step 2: 타입 선택 */}
      {step === 'type' && (
        <div className="flex flex-col items-center flex-1 px-6 pb-24">
          {/* 헤더 — 서브페이지 서식 */}
          <header className="w-full pt-8 pb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={goToPrevStep}
                className="p-1 text-stone-500 hover:text-stone-700 transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h1
                className="text-2xl font-extrabold italic"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                PICK YOUR TRIBE
              </h1>
            </div>
          </header>

          <p className="text-sm text-stone-400 mb-8">{ONBOARDING.TYPE.SUBTITLE}</p>

          {/* 트라이브 카드 */}
          <div className="flex gap-4 mb-6">
            {Object.values(TRIBES).map((type) => {
              const rank = getSelectionRank(type.id)
              const isSelected = rank !== null

              return (
                <div key={type.id} className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => handleTypeClick(type.id)}
                    className={`
                      relative w-24 h-24 rounded-2xl flex items-center justify-center text-4xl
                      transition-all duration-200 cursor-pointer
                      ${isSelected
                        ? 'shadow-md scale-105'
                        : 'glass-card-light text-stone-500 hover:shadow-sm'
                      }
                    `}
                    style={isSelected ? { backgroundColor: type.color } : {}}
                  >
                    {type.emoji}

                    {isSelected && (
                      <span
                        className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full
                                   flex items-center justify-center text-xs font-bold shadow-md"
                        style={{ color: type.color }}
                      >
                        {rank}
                      </span>
                    )}
                  </button>

                  {/* 메인 라벨: 영문 (볼드 헤딩 폰트) + 서브: 한글 */}
                  <div className="text-center">
                    <span
                      className={`text-sm font-extrabold italic block transition-all duration-200 ${isSelected ? '' : 'text-stone-400'}`}
                      style={{ fontFamily: 'var(--font-heading)', color: isSelected ? type.color : undefined }}
                    >
                      {type.persona.toUpperCase()}
                    </span>
                    <span
                      className={`text-[11px] transition-all duration-200 ${isSelected ? 'font-medium' : 'text-stone-400'}`}
                      style={isSelected ? { color: type.color } : {}}
                    >
                      {type.name}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 선택 피드백 — 선택된 트라이브의 description */}
          <div className="text-center h-10 flex items-center justify-center">
            {lastToggledType && lastToggleAction === 'selected' ? (
              <p className="text-sm text-stone-600 italic">
                &ldquo;{Object.values(TRIBES).find(t => t.id === lastToggledType)?.description}&rdquo;
              </p>
            ) : (
              <p className="text-sm text-stone-400 italic">
                탭하여 선택 · 순서 = 우선순위
              </p>
            )}
          </div>

          {/* 제출 에러 */}
          {submitError && (
            <p className="text-red-500 text-sm mt-3">{submitError}</p>
          )}
        </div>
      )}

      {/* 하단 고정 버튼 — 앱 통일 패턴 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 z-20 pointer-events-none">
        {step === 'nickname' ? (
          <button
            onClick={goToNextStep}
            disabled={!canProceed}
            className={`w-full py-4 rounded-2xl font-semibold text-white transition-all text-base pointer-events-auto ${!canProceed ? 'opacity-40' : 'hover:opacity-90'}`}
            style={{ backgroundColor: 'var(--color-primary)', boxShadow: canProceed ? '0 8px 30px -4px rgba(204, 26, 26, 0.4), 0 4px 12px -2px rgba(0, 0, 0, 0.12)' : 'none' }}
          >
            {ONBOARDING.NEXT_BUTTON}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full py-4 rounded-2xl font-semibold text-white transition-all text-base pointer-events-auto ${!canSubmit ? 'opacity-40' : 'hover:opacity-90'}`}
            style={{ backgroundColor: 'var(--color-primary)', boxShadow: canSubmit ? '0 8px 30px -4px rgba(204, 26, 26, 0.4), 0 4px 12px -2px rgba(0, 0, 0, 0.12)' : 'none' }}
          >
            {ONBOARDING.START_BUTTON}
          </button>
        )}

        {/* 단계 표시 */}
        <div className="flex gap-2 justify-center mt-4 pointer-events-none">
          {(['nickname', 'type'] as OnboardingStep[]).map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                step === s ? 'w-6' : 'w-2 bg-stone-300'
              }`}
              style={step === s ? { backgroundColor: 'var(--color-primary)' } : {}}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
