/**
 * 스토리 카드 뷰어 페이지
 * /story
 *
 * DB 저장 완료 후 진입 — 순수 카드 프리뷰 + 공유/다운로드 도구
 * 프리뷰: 기존 JSX 렌더링 (빠르고 정확)
 * 내보내기: Canvas에서 직접 렌더링 → PNG (서버 왕복 없음)
 */
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { STORY_COLORS, type StoryTribeId } from '@/constants/story-colors'
import type { LogWithPlace } from '@/types'
import { getMyLogById } from '@/lib/logs-service'
import { renderCard, shareImage, downloadImage } from '@/lib/image-export'
import { processPhoto } from '@/lib/process-photo'
import confetti from 'canvas-confetti'
import SteamCardReveal from '@/components/features/steam-card-reveal'
import type { RewardResult } from '@/types'
import SaunnerGraph from '@/components/svg/saunner-graph'
import BatherGraph from '@/components/svg/bather-graph'

// 요일 약어
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export default function Story() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [log, setLog] = useState<LogWithPlace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [cardScale, setCardScale] = useState(() => {
    if (typeof window !== 'undefined') {
      return (Math.min(window.innerWidth, 448) - 80) / 1080
    }
    return 0.28
  })
  const [exportMessage, setExportMessage] = useState<{ text: string; type: 'success' | 'error'; source: 'download' | 'share' } | null>(null)
  const [bgPhoto, setBgPhoto] = useState<string | null>(null)
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false)
  const [pendingReward, setPendingReward] = useState<RewardResult | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const messageTimer = useRef<NodeJS.Timeout>()

  const showMessage = useCallback((text: string, type: 'success' | 'error', source: 'download' | 'share' = 'download') => {
    setExportMessage({ text, type, source })
    clearTimeout(messageTimer.current)
    messageTimer.current = setTimeout(() => setExportMessage(null), 2500)
  }, [])

  useEffect(() => () => clearTimeout(messageTimer.current), [])

  // 카드 스케일 계산: 화면 폭에 맞춰 1080px 카드를 축소
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.offsetWidth
        setCardScale(availableWidth / 1080)
      }
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  // savedLogId로 DB에서 로그 fetch
  useEffect(() => {
    const logId = localStorage.getItem('savedLogId')
    if (!logId) {
      router.replace('/home')
      return
    }

    ;(async () => {
      try {
        const fetched = await getMyLogById(logId)
        if (fetched) {
          setLog(fetched)
          // 새 기록일 때만 폭죽 발사
          const isNew = localStorage.getItem('isNewLog')
          if (isNew) {
            localStorage.removeItem('isNewLog')
            // 레벨업 보상이 있으면 Steam Card Reveal, 없으면 기본 컨페티
            const rewardStr = localStorage.getItem('pendingReward')
            if (rewardStr) {
              localStorage.removeItem('pendingReward')
              try {
                const reward = JSON.parse(rewardStr) as RewardResult
                if (reward.leveledUp && reward.newTitles.length > 0) {
                  setTimeout(() => setPendingReward(reward), 500)
                } else {
                  setTimeout(() => {
                    confetti({ particleCount: 60, spread: 55, origin: { x: 0.3, y: 0.6 } })
                    confetti({ particleCount: 60, spread: 55, origin: { x: 0.7, y: 0.6 } })
                  }, 300)
                }
              } catch {
                // 파싱 실패 → 기본 컨페티
                setTimeout(() => {
                  confetti({ particleCount: 60, spread: 55, origin: { x: 0.3, y: 0.6 } })
                  confetti({ particleCount: 60, spread: 55, origin: { x: 0.7, y: 0.6 } })
                }, 300)
              }
            } else {
              setTimeout(() => {
                confetti({ particleCount: 60, spread: 55, origin: { x: 0.3, y: 0.6 } })
                confetti({ particleCount: 60, spread: 55, origin: { x: 0.7, y: 0.6 } })
              }, 300)
            }
          }
        } else {
          router.replace('/home')
        }
      } catch {
        router.replace('/home')
      } finally {
        setIsLoading(false)
      }
    })()

    // 뒤로가기 차단 (이미 저장됨)
    window.history.pushState(null, '', '/story')
    const handlePopState = () => {
      window.history.pushState(null, '', '/story')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [router])

  // Canvas 기반 내보내기 (서버 호출 없음)
  const handleExport = async (mode: 'download' | 'share') => {
    if (!log) return
    setIsExporting(true)
    try {
      const blob = await renderCard({
        tribeId: log.tribe_id as StoryTribeId,
        placeName: log.place_name,
        date: log.date,
        bgPhoto,
        saunaTemp: log.sauna_temp,
        coldBathTemp: log.cold_bath_temp,
        hotBathTemp: log.hot_bath_temp,
        jjimTemp: log.jjim_temp,
        totono_score: log.totono_score,
        waterQuality: log.water_quality,
        heatTime: log.heat_time,
        iceTime: log.ice_time,
        pauseTime: log.pause_time,
        repeat: log.repeat,
      })
      const now = new Date()
      const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
      const base = `SA-PI_${log.place_name}_${log.tribe_id}_${ts}`
      if (mode === 'download') {
        downloadImage(blob, `${base}.png`)
      } else {
        await shareImage(blob, `${base}_s`)
      }
      showMessage('완료!', 'success', mode)
    } catch (err) {
      console.error('Export failed:', err)
      showMessage('실패', 'error', mode)
    } finally {
      setIsExporting(false)
    }
  }

  // 사진 추가 — HEIC 변환 + 리사이즈 + JPEG 압축
  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setIsProcessingPhoto(true)
    try {
      const url = await processPhoto(file)
      // 이전 Object URL 해제
      if (bgPhoto) URL.revokeObjectURL(bgPhoto)
      setBgPhoto(url)
    } catch (err) {
      console.error('Photo processing failed:', err)
    } finally {
      setIsProcessingPhoto(false)
    }
  }

  const handleRemovePhoto = () => {
    if (bgPhoto) URL.revokeObjectURL(bgPhoto)
    setBgPhoto(null)
  }

  // 타입별 메인 수치
  const getMainMetric = () => {
    if (!log) return { value: '', unit: '', label: '' }
    switch (log.tribe_id) {
      case 'saunner': {
        const deltaT = (log.sauna_temp || 80) - (log.cold_bath_temp || 15)
        return { value: String(deltaT), unit: '°C', label: 'TEMP DELTA' }
      }
      case 'bather':
        return { value: String(log.hot_bath_temp || 40), unit: '°C', label: 'BATH TEMP' }
      case 'jimi': {
        const temp = log.jjim_temp
        return temp
          ? { value: String(temp), unit: '°C', label: 'JJIMJIL TEMP' }
          : { value: '—', unit: '', label: 'JJIMJIL TEMP' }
      }
      default:
        return { value: '', unit: '', label: '' }
    }
  }

  const getRoutineBadges = () => {
    if (!log) return []
    if (log.tribe_id === 'jimi') {
      return [
        { value: log.heat_time || null, label: 'HEAT' },
        { value: log.pause_time || null, label: 'PAUSE' },
        { value: log.repeat || null, label: 'RPT' },
        { value: log.sweat_quality || null, label: 'SWEAT' },
      ]
    }
    return [
      { value: log.heat_time || null, label: 'HEAT' },
      { value: log.ice_time || null, label: 'ICE' },
      { value: log.pause_time || null, label: 'PAUSE' },
      { value: log.repeat || null, label: 'RPT' },
    ]
  }

  const renderGraph = () => {
    if (!log) return null
    switch (log.tribe_id) {
      case 'saunner':
        return (
          <SaunnerGraph
            saunaTemp={log.sauna_temp || 80}
            coldBathTemp={log.cold_bath_temp || 15}
            repeat={log.repeat || 3}
            totono_score={log.totono_score || 3}
          />
        )
      case 'bather':
        return (
          <BatherGraph
            waterQuality={log.water_quality || 3}
            hotBathTemp={log.hot_bath_temp || 40}
            coldBathTemp={log.cold_bath_temp}
          />
        )
      case 'jimi':
        return null
      default:
        return null
    }
  }

  const formatDate = () => {
    if (!log) return ''
    const d = new Date(log.date)
    const dateStr = log.date.slice(0, 10).replace(/-/g, '.')
    const day = DAY_NAMES[d.getDay()]
    return `${dateStr} · ${day}`
  }

  if (isLoading || !log) {
    return (
      <div className="min-h-dvh bath-tile-bg flex items-center justify-center">
        <p className="text-stone-400">로딩 중...</p>
      </div>
    )
  }

  const colors = STORY_COLORS[log.tribe_id as StoryTribeId] || STORY_COLORS.saunner
  const metric = getMainMetric()
  const routineBadges = getRoutineBadges()

  return (
    <div className="min-h-dvh bath-tile-bg overflow-hidden">
      <main className="px-10 pt-12 pb-8">
        {/* 9:16 카드 프리뷰 — 1080×1920 고정, scale로 축소 표시 */}
        <div
          ref={containerRef}
          className="relative w-full mb-4 flex justify-center"
          style={{ height: cardScale ? 1920 * cardScale + 16 : 0 }}
        >
          {/* 배경 변경 버튼 */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handleAddPhoto}
            className="hidden"
          />
          <button
            onClick={() => isProcessingPhoto ? undefined : bgPhoto ? handleRemovePhoto() : photoInputRef.current?.click()}
            disabled={isProcessingPhoto}
            className="absolute top-2 right-2 z-10 flex items-center justify-center gap-1 w-[88px] h-[30px] rounded-full transition-all hover:bg-white/25 shadow-lg"
            style={{ backgroundColor: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          >
            <span className={`material-symbols-outlined text-white/90 ${isProcessingPhoto ? 'animate-spin' : ''}`} style={{ fontSize: '14px' }}>
              {isProcessingPhoto ? 'progress_activity' : bgPhoto ? 'restart_alt' : 'add_photo_alternate'}
            </span>
            <span className="text-[11px] font-medium text-white/90">
              {isProcessingPhoto ? '처리 중...' : bgPhoto ? '초기화' : '배경 변경'}
            </span>
          </button>

          {/* 카드 프리뷰 (JSX 렌더링 — 캡처 대상 아님, 표시 전용) */}
          <div
            className="absolute top-0 overflow-hidden"
            style={{
              width: 1080,
              height: 1920,
              backgroundColor: colors.bg,
              transform: `scale(${cardScale})`,
              transformOrigin: 'top center',
              borderRadius: 48,
              boxShadow: '0 24px 80px rgba(0,0,0,0.35), 0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.06)',
            }}
          >
            {/* 배경 사진 레이어 */}
            {bgPhoto && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${bgPhoto})`, filter: 'blur(3px)', transform: 'scale(1.02)' }}
              >
                <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, rgba(${colors.rgb},0.88) 0%, rgba(${colors.rgb},0.65) 25%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.5) 75%, rgba(0,0,0,0.6) 100%)` }} />
              </div>
            )}

            <div className="relative h-full flex flex-col" style={{ padding: '72px 80px' }}>
              {/* 상단: 장소명 + 날짜 (leading-none으로 Canvas 정합) */}
              <div style={{ paddingTop: 16 }}>
                <h2 className="text-white font-bold leading-none font-heading" style={{ fontSize: 56, letterSpacing: '0.02em' }}>
                  {log.place_name}
                </h2>
                <p className="text-white/70 italic leading-none font-heading" style={{ fontSize: 48, marginTop: 24 }}>
                  {formatDate()}
                </p>
              </div>

              {/* 중앙: 메인 수치 */}
              <div className="flex-1 flex flex-col justify-center" style={{ paddingTop: 80 }}>
                <p className="text-white/70 uppercase font-bold leading-none font-heading" style={{ fontSize: 48, marginBottom: 28, letterSpacing: '0.2em' }}>
                  {metric.label}
                </p>

                <div className="flex items-start">
                  <span
                    className="text-white font-bold tracking-tight leading-none font-heading"
                    style={{ fontSize: 380, marginLeft: -16 }}
                  >
                    {metric.value}
                  </span>
                  <span
                    className="text-white/80 font-semibold leading-none font-heading"
                    style={{ fontSize: 88, marginTop: 28, marginLeft: 8, ...(bgPhoto ? { textShadow: '0 4px 40px rgba(0,0,0,0.5), 0 2px 16px rgba(0,0,0,0.3)' } : {}) }}
                  >
                    {metric.unit}
                  </span>
                </div>

                {/* 루틴 뱃지 */}
                <div className="relative flex items-end" style={{ gap: 72, marginTop: 64 }}>
                  {routineBadges.map((badge) => (
                    <div key={badge.label} className="flex flex-col items-center" style={{ gap: 22 }}>
                      <span
                        className="text-white font-bold leading-none font-heading"
                        style={{ fontSize: 96, minHeight: 96, ...(bgPhoto ? { textShadow: '0 4px 40px rgba(0,0,0,0.5), 0 2px 16px rgba(0,0,0,0.3)' } : {}) }}
                      >
                        {badge.value ?? '-'}
                      </span>
                      <span
                        className="text-white/70 tracking-wider uppercase leading-none font-heading"
                        style={{ fontSize: 42, ...(bgPhoto ? { textShadow: '0 3px 30px rgba(0,0,0,0.5), 0 1px 12px rgba(0,0,0,0.3)' } : {}) }}
                      >
                        {badge.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 그래프 */}
                <div style={{ width: '140%', height: 640, marginTop: -100, marginLeft: -80 }}>
                  {renderGraph()}
                </div>
              </div>

              {/* 하단: 타입 + 워터마크 */}
              <div className="flex items-end justify-between">
                <div className="flex items-center" style={{ gap: 20 }}>
                  <div className="rounded-full" style={{ width: 30, height: 30, backgroundColor: colors.dot }} />
                  <span className="text-white/70 font-bold tracking-wider leading-none font-heading" style={{ fontSize: 42 }}>
                    {log.tribe_id.toUpperCase()}
                  </span>
                </div>
                <span className="text-white/40 font-bold tracking-wider leading-none font-heading" style={{ fontSize: 42 }}>
                  JOIN THE SA-PIENS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-center gap-6 mb-5">
          <div className="relative flex flex-col items-center">
            {exportMessage?.source === 'download' && (
              <span className={`absolute -top-5 text-xs font-semibold animate-fade-in ${exportMessage.type === 'success' ? 'text-stone-500' : 'text-red-500'}`}>
                {exportMessage.text}
              </span>
            )}
            <button
              onClick={() => handleExport('download')}
              disabled={isExporting}
              className="flex flex-col items-center gap-1.5 disabled:opacity-50"
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 4px 16px rgba(204,26,26,0.35), 0 2px 6px rgba(0,0,0,0.15)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>download</span>
              </div>
              <span className="text-[11px] font-medium" style={{ color: 'var(--color-primary)' }}>저장</span>
            </button>
          </div>

          <div className="relative flex flex-col items-center">
            {exportMessage?.source === 'share' && (
              <span className={`absolute -top-5 text-xs font-semibold animate-fade-in ${exportMessage.type === 'success' ? 'text-stone-500' : 'text-red-500'}`}>
                {exportMessage.text}
              </span>
            )}
            <button
              onClick={() => handleExport('share')}
              disabled={isExporting}
              className="flex flex-col items-center gap-1.5 disabled:opacity-50"
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 4px 16px rgba(204,26,26,0.35), 0 2px 6px rgba(0,0,0,0.15)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>share</span>
              </div>
              <span className="text-[11px] font-medium" style={{ color: 'var(--color-primary)' }}>공유</span>
            </button>
          </div>

          <button
            onClick={() => {
              const logId = localStorage.getItem('savedLogId')
              if (logId) router.push(`/history/${logId}`)
            }}
            className="flex flex-col items-center gap-1.5"
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 4px 16px rgba(204,26,26,0.35), 0 2px 6px rgba(0,0,0,0.15)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>description</span>
            </div>
            <span className="text-[11px] font-medium" style={{ color: 'var(--color-primary)' }}>기록 보기</span>
          </button>
        </div>

        {/* 하단 네비게이션 */}
        <div className="flex justify-center gap-6">
          <button
            onClick={() => {
              localStorage.removeItem('savedLogId')
              router.push('/log')
            }}
            className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
            추가 기록
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('savedLogId')
              router.push('/home')
            }}
            className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>home</span>
            홈으로
          </button>
        </div>
      </main>

      {/* 레벨업 보상 애니메이션 */}
      {pendingReward && (
        <SteamCardReveal
          reward={pendingReward}
          onComplete={() => setPendingReward(null)}
        />
      )}
    </div>
  )
}
