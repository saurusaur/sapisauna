'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { APP, ONBOARDING, TRIBES, RESERVED_NICKNAMES } from '@/constants/content'
import type { TribeId } from '@/types'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/user-context'
import { useAuth } from '@/contexts/auth-context'
import { grantReward } from '@/lib/reward-service'
import { addAdjectivePrefix } from '@/lib/reward-engine'
import { IS_BETA, BASE_MILESTONES } from '@/constants/rewards'

// 온보딩 단계: 닉네임 → 성별 → 타입 선택 (3단계)
type OnboardingStep = 'nickname' | 'gender' | 'type'

export default function Onboarding() {
  const router = useRouter()
  const { setUser } = useUser()
  const { user: authUser } = useAuth()

  // 현재 단계
  const [step, setStep] = useState<OnboardingStep>('nickname')

  // Step 1: 닉네임
  const [nickname, setNickname] = useState('')
  const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'checking' | 'available' | 'duplicate' | 'invalid' | 'reserved' | 'error'>('idle')

  // Step 2: 성별
  const [gender, setGender] = useState<'male' | 'female' | null>(null)

  // Step 3: 타입 선택
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [lastToggledType, setLastToggledType] = useState<string | null>(null)
  const [lastToggleAction, setLastToggleAction] = useState<'selected' | 'deselected' | null>(null)

  // 제출 상태
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // 닉네임 유효성 검사 (대문자 영문+숫자+언더스코어만)
  const isNicknameValid = nickname.length >= 2 && nickname.length <= 10 && /^[A-Z0-9_]+$/.test(nickname)

  // 닉네임 중복 체크
  const checkNickname = async () => {
    if (!isNicknameValid) {
      setNicknameStatus('invalid')
      return
    }

    if (RESERVED_NICKNAMES.includes(nickname.toLowerCase())) {
      setNicknameStatus('reserved')
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
      setStep('gender')
    } else if (step === 'gender') {
      setStep('type')
    }
  }

  // 이전 단계로 이동
  const goToPrevStep = () => {
    if (step === 'gender') {
      setStep('nickname')
    } else if (step === 'type') {
      setStep('gender')
    }
  }

  // 최종 제출 - DB 저장 성공 후 localStorage 캐시 + 홈 이동
  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    const userData = {
      nickname,
      gender,
      user_types: selectedTypes,
      primary_type: selectedTypes[0] as TribeId,
    }

    try {
      if (authUser) {
        const { error } = await supabase.from('users').upsert({
          id: authUser.id,
          nickname: userData.nickname,
          gender: userData.gender,
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

      // 웰컴 XP 지급 + 칭호 (베타: 고정 / 정식: 랜덤 형용사)
      const welcomeTitle = IS_BETA
        ? BASE_MILESTONES.beta_signup.title
        : addAdjectivePrefix(BASE_MILESTONES.signup.title)
      const reward = await grantReward('welcome')
      setUser({
        ...userData,
        gender: userData.gender ?? undefined,
        xp: reward?.newTotalXp ?? 20,
        level: reward?.newLevel ?? 1,
        active_title: welcomeTitle,
        profile_color: null,
        profile_emoji: null,
      })
      // 웰컴 칭호를 active_title로 설정
      if (authUser) {
        await supabase.from('users').update({ active_title: welcomeTitle }).eq('id', authUser.id)
        // 칭호 직접 삽입 (grantReward 내부에서 못 넣었을 경우 대비)
        await supabase.from('user_titles').upsert(
          { user_id: authUser.id, title: welcomeTitle, source: IS_BETA ? 'beta' : 'welcome' },
          { onConflict: 'user_id,title' }
        )
      }
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
    <div className="flex flex-col min-h-dvh bath-tile-bg">
      {/* Step 1: 닉네임 입력 */}
      {step === 'nickname' && (
        <div className="flex flex-col items-center flex-1 px-6 pb-24">
          {/* 헤더 — 홈 스타일 통일 */}
          <header className="w-full pt-8 mb-12">
            <h1
              className="text-3xl font-extrabold italic font-heading"
            >
              WELCOME TO{' '}
              <span style={{ color: 'var(--color-primary)' }}>SA-PI</span>
            </h1>
          </header>

          {/* 설명 */}
          <p className="text-sm text-stone-400 mb-6">{ONBOARDING.NICKNAME.TITLE}</p>

          {/* 입력 필드 */}
          <input
            type="text"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value.toUpperCase())
              setNicknameStatus('idle')
            }}
            placeholder={ONBOARDING.NICKNAME.PLACEHOLDER}
            className="w-full max-w-xs px-5 py-4 rounded-xl text-stone-700 glass-input border-2 border-stone-200 focus:outline-none transition-all"
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
              {nicknameStatus === 'reserved' && ONBOARDING.NICKNAME.RESERVED}
              {nicknameStatus === 'invalid' && ONBOARDING.NICKNAME.INVALID}
              {nicknameStatus === 'error' && '확인에 실패했습니다. 다시 시도해주세요.'}
            </p>
          )}
        </div>
      )}

      {/* Step 2: 성별 선택 */}
      {step === 'gender' && (
        <div className="flex flex-col items-center flex-1 px-6 pb-24">
          <header className="w-full pt-8 pb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={goToPrevStep}
                className="p-1 text-stone-500 hover:text-stone-700 transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h1 className="text-2xl font-extrabold italic font-heading">
                YOUR BATH
              </h1>
            </div>
          </header>

          <p className="text-sm text-stone-400 mb-8">어느 탕을 이용하시나요?</p>

          <div className="flex gap-4 mb-6">
            {([
              { id: 'male' as const, label: '남탕', icon: 'male' },
              { id: 'female' as const, label: '여탕', icon: 'female' },
            ]).map((opt) => (
              <button
                key={opt.id}
                onClick={() => { setGender(opt.id); goToNextStep() }}
                className={`w-28 h-28 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                  gender === opt.id
                    ? 'shadow-md scale-105'
                    : 'glass-card-light text-stone-500 hover:shadow-sm'
                }`}
                style={gender === opt.id ? { backgroundColor: 'var(--color-primary)', color: 'white' } : {}}
              >
                <span
                  className="material-symbols-outlined text-3xl"
                  style={gender === opt.id ? { color: 'white' } : {}}
                >
                  {opt.icon}
                </span>
                <span className={`text-sm font-medium ${gender === opt.id ? 'text-white' : ''}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => { setGender(null); goToNextStep() }}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors underline underline-offset-2 mt-2"
          >
            말하고 싶지 않아요
          </button>
        </div>
      )}

      {/* Step 3: 타입 선택 */}
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
                className="text-2xl font-extrabold italic font-heading"
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
                      relative w-24 h-24 rounded-xl flex items-center justify-center text-4xl
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
                      className={`text-sm font-extrabold italic block transition-all duration-200 font-heading ${isSelected ? '' : 'text-stone-400'}`}
                      style={{ color: isSelected ? type.color : undefined }}
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
              <p className="text-sm text-stone-600">
                &ldquo;{Object.values(TRIBES).find(t => t.id === lastToggledType)?.description}&rdquo;
              </p>
            ) : (
              <p className="text-sm text-stone-400">
                좋아하는 순서대로 선택해주세요
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
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 pb-6 z-20 pointer-events-none">
        {step === 'nickname' && (
          <button
            onClick={goToNextStep}
            disabled={!canProceed}
            className="btn-primary"
          >
            {ONBOARDING.NEXT_BUTTON}
          </button>
        )}
        {step === 'type' && (
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="btn-primary"
          >
            {ONBOARDING.START_BUTTON}
          </button>
        )}

        {/* 단계 표시 */}
        <div className="flex gap-2 justify-center mt-4 pointer-events-none">
          {(['nickname', 'gender', 'type'] as OnboardingStep[]).map((s) => (
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
