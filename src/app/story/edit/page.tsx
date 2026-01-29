'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MESSAGES, TYPE_EMOJI_MAP, TYPE_CATEGORY_MAP } from '@/constants/content'
import { formatDate } from '@/lib/utils'

type LogData = {
  place_name: string
  log_type: 'bather' | 'sauner' | 'jimi'
  created_at: string
  sauna_temp?: number
  cold_bath_temp?: number
  sets?: number
  revisit_score: number
}

export default function StoryEdit() {
  const router = useRouter()
  const [log, setLog] = useState<LogData | null>(null)
  const [template, setTemplate] = useState('minimal')
  const [caption, setCaption] = useState('')

  // 표시 옵션
  const [showTemp, setShowTemp] = useState(true)
  const [showSets, setShowSets] = useState(true)
  const [showRevisit, setShowRevisit] = useState(true)
  const [showDate, setShowDate] = useState(true)

  useEffect(() => {
    const logData = localStorage.getItem('currentLog')
    const templateData = localStorage.getItem('selectedTemplate')

    if (logData) {
      setLog(JSON.parse(logData))
    }
    if (templateData) {
      setTemplate(templateData)
    }
  }, [])


  // 공유 처리
  const handleShare = () => {
    // TODO: 실제 이미지 생성 및 공유 기능
    alert('스토리 이미지가 생성되었습니다! (MVP에서는 알림만 표시)')
    router.push('/home')
  }

  // 또올래요 점수 표시
  const renderRevisitDots = (score: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full ${i <= score ? 'bg-white' : 'bg-white/30'}`}
          />
        ))}
      </div>
    )
  }

  // 템플릿별 스타일
  const getTemplateStyles = () => {
    switch (template) {
      case 'dark':
        return {
          bg: 'bg-gray-900',
          text: 'text-white',
          subtext: 'text-gray-400',
          accent: 'var(--color-orange)',
        }
      case 'gradient':
        return {
          bg: 'bg-gradient-to-br from-sky-100 to-blue-200',
          text: 'text-blue-900',
          subtext: 'text-blue-600',
          accent: '#0369a1',
        }
      case 'retro':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-900',
          subtext: 'text-amber-700',
          accent: '#92400e',
        }
      default:
        return {
          bg: 'bg-white',
          text: 'text-stone-800',
          subtext: 'text-stone-500',
          accent: 'var(--color-green)',
        }
    }
  }

  const styles = getTemplateStyles()

  if (!log) {
    return (
      <div className="min-h-screen bath-tile-bg flex items-center justify-center">
        <p className="text-stone-400">로딩 중...</p>
      </div>
    )
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
          <h1 className="text-lg font-bold text-stone-700">{MESSAGES.STORY.EDIT_TITLE}</h1>
        </div>
        <button
          onClick={handleShare}
          className="px-4 py-2 rounded-xl font-semibold text-white flex items-center gap-1 hover:opacity-90 transition-all"
          style={{ backgroundColor: 'var(--color-orange)' }}
        >
          공유
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </header>

      <main className="p-4">
        {/* 미리보기 */}
        <div className="mb-6">
          <div className={`${styles.bg} rounded-2xl p-6 shadow-lg aspect-[9/16] max-h-[400px] flex flex-col justify-center`}>
            {/* 타입 아이콘 */}
            <div className="text-center mb-4">
              <span className="text-4xl">{TYPE_EMOJI_MAP[log.log_type]}</span>
              <span className={`ml-2 text-xl font-bold ${styles.text}`}>{TYPE_CATEGORY_MAP[log.log_type]}</span>
            </div>

            {/* 장소 */}
            <p className={`text-center text-lg font-medium ${styles.text} mb-1`}>
              {log.place_name}
            </p>

            {/* 날짜 */}
            {showDate && (
              <p className={`text-center text-sm ${styles.subtext} mb-4`}>
                {formatDate(new Date(log.created_at))}
              </p>
            )}

            {/* 온도 정보 */}
            {showTemp && log.log_type === 'sauner' && (
              <div className="flex justify-center gap-4 mb-4">
                <div className={`text-center px-4 py-2 rounded-lg ${template === 'dark' ? 'bg-white/10' : 'bg-black/5'}`}>
                  <p className={`text-xl font-bold ${styles.text}`}>{log.sauna_temp}°</p>
                  <p className={`text-xs ${styles.subtext}`}>사우나</p>
                </div>
                <div className={`text-center px-4 py-2 rounded-lg ${template === 'dark' ? 'bg-white/10' : 'bg-black/5'}`}>
                  <p className={`text-xl font-bold ${styles.text}`}>{log.cold_bath_temp}°</p>
                  <p className={`text-xs ${styles.subtext}`}>냉탕</p>
                </div>
              </div>
            )}

            {/* 세트 수 */}
            {showSets && log.sets && (
              <p className={`text-center font-medium ${styles.text} mb-4`}>
                {log.sets}세트 완료 🔥
              </p>
            )}

            {/* 문구 */}
            {caption && (
              <div className={`text-center px-4 py-3 border-t border-b ${template === 'dark' ? 'border-white/20' : 'border-black/10'} mb-4`}>
                <p className={`italic ${styles.subtext}`}>&ldquo;{caption}&rdquo;</p>
              </div>
            )}

            {/* 또올래요 */}
            {showRevisit && (
              <div className="flex justify-center items-center gap-2">
                <span className={`text-sm ${styles.subtext}`}>또올래요</span>
                {renderRevisitDots(log.revisit_score)}
              </div>
            )}
          </div>

          <p className="text-center text-xs text-stone-400 mt-2">9:16 미리보기</p>
        </div>

        {/* 설정 영역 */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          {/* 문구 추가 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              {MESSAGES.STORY.ADD_TEXT}
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={MESSAGES.STORY.TEXT_PLACEHOLDER}
              className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-green text-stone-700"
            />
          </div>

          {/* 표시 항목 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-3">
              {MESSAGES.STORY.DISPLAY_OPTIONS}
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'temp', label: '온도', state: showTemp, setter: setShowTemp },
                { key: 'sets', label: '세트', state: showSets, setter: setShowSets },
                { key: 'revisit', label: '또올래요', state: showRevisit, setter: setShowRevisit },
                { key: 'date', label: '날짜', state: showDate, setter: setShowDate },
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => option.setter(!option.state)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1
                    ${option.state
                      ? 'text-white'
                      : 'bg-stone-100 text-stone-500'
                    }
                  `}
                  style={option.state ? { backgroundColor: 'var(--color-green)' } : {}}
                >
                  <span className="material-symbols-outlined text-sm">
                    {option.state ? 'check' : 'close'}
                  </span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
