'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { APP, ONBOARDING, TRIBES } from '@/constants/content'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/user-context'

// 온보딩 단계: 닉네임 → 타입 선택 (2단계)
type OnboardingStep = 'nickname' | 'type'

export default function Onboarding() {
  const router = useRouter()
  const { setUser } = useUser()

  // 현재 단계
  const [step, setStep] = useState<OnboardingStep>('nickname')

  // Step 1: 닉네임
  const [nickname, setNickname] = useState('')
  const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'checking' | 'available' | 'duplicate' | 'invalid'>('idle')

  // Step 2: 타입 선택
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [lastToggledType, setLastToggledType] = useState<string | null>(null)
  const [lastToggleAction, setLastToggleAction] = useState<'selected' | 'deselected' | null>(null)

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
        // PGRST116 = no rows found = 사용 가능
        setNicknameStatus('available')
      } else if (data) {
        setNicknameStatus('duplicate')
      } else {
        setNicknameStatus('available')
      }
    } catch {
      // 에러 시에도 일단 available로 처리 (실제 저장 시 재확인)
      setNicknameStatus('available')
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
    } else if (step === 'nickname') {
      router.push('/')
    }
  }

  // 최종 제출 - DB에 일괄 저장
  const handleSubmit = async () => {
    // TODO: Supabase에 사용자 정보 저장
    console.log('온보딩 완료 - DB 저장:', {
      nickname,
      user_types: selectedTypes,
      primary_type: selectedTypes[0],
    })

    // Context + localStorage에 저장 (MVP)
    setUser({
      nickname,
      user_types: selectedTypes,
      primary_type: selectedTypes[0] as 'bather' | 'saunner' | 'jimi',
    })

    router.push('/home')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bath-tile-bg relative">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={goToPrevStep}
        className="absolute top-6 left-6 p-2 text-stone-500 hover:text-stone-700 transition-colors"
      >
        <span className="material-symbols-outlined text-2xl">arrow_back</span>
      </button>

      {/* 로고 영역 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-stone-700">{APP.NAME}</h1>
        <p className="text-stone-500">{APP.TAGLINE}</p>
      </div>

      {/* Step 1: 닉네임 입력 */}
      {step === 'nickname' && (
        <>
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-1 text-stone-700">{ONBOARDING.NICKNAME.TITLE}</h2>
          </div>

          <div className="w-full max-w-xs mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value)
                  setNicknameStatus('idle')
                }}
                placeholder={ONBOARDING.NICKNAME.PLACEHOLDER}
                className="flex-1 px-4 py-3 border-2 border-stone-300 rounded-xl focus:outline-none focus:border-green text-stone-800 bg-white placeholder-stone-400"
                maxLength={10}
              />
              <button
                onClick={checkNickname}
                disabled={!nickname || nicknameStatus === 'checking'}
                className="px-4 py-3 rounded-xl hover:opacity-80 disabled:opacity-50 font-medium transition-all"
                style={{ backgroundColor: 'var(--color-green-light)', color: 'var(--color-green)' }}
              >
                {nicknameStatus === 'checking' ? '...' : ONBOARDING.NICKNAME.CHECK_BUTTON}
              </button>
            </div>

            {/* 상태 메시지 */}
            <p className={`mt-2 text-sm ${
              nicknameStatus === 'available' ? 'text-green' :
              nicknameStatus === 'duplicate' || nicknameStatus === 'invalid' ? 'text-red-500' :
              'text-stone-500'
            }`}>
              {nicknameStatus === 'available' && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check</span>
                  {ONBOARDING.NICKNAME.AVAILABLE}
                </span>
              )}
              {nicknameStatus === 'duplicate' && ONBOARDING.NICKNAME.DUPLICATE}
              {nicknameStatus === 'invalid' && ONBOARDING.NICKNAME.INVALID}
              {nicknameStatus === 'checking' && ONBOARDING.NICKNAME.CHECKING}
            </p>
          </div>

          <button
            onClick={goToNextStep}
            disabled={nicknameStatus !== 'available'}
            className={`
              w-full max-w-xs py-4 px-6 font-semibold rounded-2xl transition-all duration-200
              ${nicknameStatus === 'available'
                ? 'text-white hover:opacity-90'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }
            `}
            style={nicknameStatus === 'available' ? { backgroundColor: 'var(--color-green)' } : {}}
          >
            {ONBOARDING.NEXT_BUTTON}
          </button>
        </>
      )}

      {/* Step 2: 타입 선택 */}
      {step === 'type' && (
        <>
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-1 text-stone-700">{ONBOARDING.TYPE.TITLE}</h2>
            <p className="text-sm text-stone-500">{ONBOARDING.TYPE.SUBTITLE}</p>
          </div>

          <div className="flex gap-4 mb-4">
            {Object.values(TRIBES).map((type) => {
              const rank = getSelectionRank(type.id)
              const isSelected = rank !== null

              return (
                <div key={type.id} className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => handleTypeClick(type.id)}
                    className={`
                      relative w-24 h-24 rounded-2xl flex items-center justify-center text-4xl
                      transition-all duration-200 cursor-pointer border-3
                      ${isSelected
                        ? 'scale-110 shadow-lg border-transparent'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                      }
                    `}
                    style={{
                      backgroundColor: isSelected ? type.color : undefined,
                      borderColor: isSelected ? type.color : undefined,
                    }}
                  >
                    {type.emoji}

                    {isSelected && (
                      <span
                        className="absolute -top-2 -right-2 px-2 py-0.5 bg-white rounded-full
                                   flex items-center justify-center text-xs font-bold shadow-md"
                        style={{ color: type.color }}
                      >
                        #{rank}
                      </span>
                    )}
                  </button>

                  <span
                    className={`
                      text-sm font-medium transition-all duration-200
                      ${isSelected ? 'opacity-100' : 'opacity-60'}
                    `}
                    style={{ color: isSelected ? type.color : '#78716c' }}
                  >
                    {type.persona}
                  </span>
                </div>
              )
            })}
          </div>

          {/* 마지막으로 선택한 타입의 설명 표시 (해제 시 사라짐) */}
          <div className="text-center mb-8 h-12 flex items-center justify-center">
            {lastToggledType && lastToggleAction === 'selected' ? (
              <p className="text-sm text-stone-600 italic">
                &ldquo;{Object.values(TRIBES).find(t => t.id === lastToggledType)?.description}&rdquo;
              </p>
            ) : (
              <p className="text-sm text-stone-400">
                FIND YOUR TRIBE
              </p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={selectedTypes.length === 0}
            className={`
              w-full max-w-xs py-4 px-6 font-semibold rounded-2xl transition-all duration-200
              ${selectedTypes.length > 0
                ? 'text-white hover:opacity-90'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }
            `}
            style={selectedTypes.length > 0 ? { backgroundColor: 'var(--color-green)' } : {}}
          >
            {ONBOARDING.START_BUTTON}
          </button>
        </>
      )}

      {/* 단계 표시 (2단계) */}
      <div className="flex gap-2 mt-8">
        {(['nickname', 'type'] as OnboardingStep[]).map((s) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all ${
              step === s ? 'w-6' : 'w-2 bg-stone-300'
            }`}
            style={step === s ? { backgroundColor: 'var(--color-green)' } : {}}
          />
        ))}
      </div>

      {/* 버전 */}
      <p className="mt-4 text-xs text-stone-400">v{APP.VERSION}</p>
    </div>
  )
}
