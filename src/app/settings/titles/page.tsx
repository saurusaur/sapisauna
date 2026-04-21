'use client'

/**
 * 나의 칭호 — 획득한 칭호 목록 + active 칭호 설정
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/user-context'
import { getMilestoneCondition } from '@/constants/rewards'
import type { UserTitle } from '@/types'
import ContentLoader from '@/components/ui/content-loader'

export default function TitlesPage() {
  const router = useRouter()
  const { user, updateUser } = useUser()
  const [titles, setTitles] = useState<UserTitle[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  // 칭호 목록 로드
  useEffect(() => {
    ;(async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data } = await supabase
        .from('user_titles')
        .select('*')
        .eq('user_id', authUser.id)
        .order('granted_at', { ascending: false })

      setTitles(data || [])
      setLoading(false)
    })()
  }, [])

  // active 칭호 변경
  const handleSetActive = async (title: string) => {
    if (updating) return
    setUpdating(title)
    try {
      await updateUser({ active_title: title })
    } finally {
      setUpdating(null)
    }
  }

  // 칭호 해제 (active → null)
  const handleClearActive = async () => {
    if (updating) return
    setUpdating('__clear__')
    try {
      await updateUser({ active_title: null })
    } finally {
      setUpdating(null)
    }
  }

  // 칭호 획득 사유 — milestone은 base_title 기반 구체 사유, 그 외는 일반 라벨
  const sourceLabel = (t: UserTitle) => {
    if (t.source === 'random') return '레벨업'
    if (t.source === 'welcome') return '환영'
    if (t.source === 'beta') return '베타'
    if (t.source === 'milestone' && t.base_title) {
      return getMilestoneCondition(t.base_title) ?? '마일스톤'
    }
    return t.source
  }

  return (
    <div className="min-h-dvh pb-20 bath-tile-bg">
      <header className="p-5 pt-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-2xl font-extrabold italic font-heading">
            MY TITLES
          </h1>
        </div>
      </header>

      <main className="p-4 space-y-3">
        {/* 현재 활성 칭호 */}
        {user?.active_title && (
          <div className="glass-card-light p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-stone-400 tracking-widest uppercase mb-1">
                Active
              </p>
              <p className="text-sm font-bold text-stone-700">{user.active_title}</p>
            </div>
            <button
              onClick={handleClearActive}
              disabled={updating === '__clear__'}
              className="text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2"
            >
              해제
            </button>
          </div>
        )}

        {/* 칭호 목록 */}
        {loading ? (
          <ContentLoader />
        ) : titles.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-stone-300 text-3xl mb-2 block">
              military_tech
            </span>
            <p className="text-stone-400 text-sm">아직 획득한 칭호가 없어요</p>
            <p className="text-stone-300 text-xs mt-1">기록을 시작하면 칭호를 얻을 수 있어요</p>
          </div>
        ) : (
          <div className="glass-card-light rounded-xl divide-y divide-stone-200/60">
            {titles.map((t) => {
              const isActive = user?.active_title === t.title
              return (
                <button
                  key={t.id}
                  onClick={() => handleSetActive(t.title)}
                  disabled={isActive || updating === t.title}
                  className="w-full p-4 flex items-center justify-between transition-colors hover:bg-white/30 disabled:hover:bg-transparent"
                >
                  <div className="text-left">
                    <p className={`text-sm font-medium ${isActive ? 'font-bold' : 'text-stone-700'}`}
                       style={isActive ? { color: 'var(--color-primary)' } : undefined}>
                      {t.title}
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {sourceLabel(t)} · {new Date(t.granted_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  {isActive ? (
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '20px' }}>
                      check_circle
                    </span>
                  ) : updating === t.title ? (
                    <span className="material-symbols-outlined text-stone-300 animate-spin" style={{ fontSize: '20px' }}>
                      progress_activity
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-stone-300" style={{ fontSize: '20px' }}>
                      radio_button_unchecked
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
