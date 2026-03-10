/**
 * 스토리 카드 뷰어 페이지
 * /story
 *
 * DB 저장 완료 후 진입 — 순수 카드 프리뷰 + 공유/다운로드 도구
 * savedLogId로 DB에서 로그를 fetch하여 카드를 렌더링
 */
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { APP } from '@/constants/content'
import type { LogWithPlace, TribeId } from '@/types'
import { getLogById } from '@/lib/logs-service'
import { captureCard, shareImage, downloadImage } from '@/lib/image-export'
import SaunnerGraph from '@/components/svg/saunner-graph'
import BatherGraph from '@/components/svg/bather-graph'
import JimiGraph from '@/components/svg/jimi-graph'

// 타입별 배경색 (CSS 변수 참조)
const TYPE_BG_COLORS: Record<string, string> = {
  saunner: 'var(--story-bg-saunner)',
  bather: 'var(--story-bg-bather)',
  jimi: 'var(--story-bg-jimi)',
}

// 타입별 표시 이름
const TYPE_DISPLAY_NAMES: Record<string, string> = {
  saunner: 'SAUNNER',
  bather: 'BATHER',
  jimi: 'JIMI',
}

// 타입별 점 색상
const TYPE_DOT_COLORS: Record<string, string> = {
  saunner: 'var(--color-primary)',
  bather: 'var(--color-bather)',
  jimi: 'var(--color-jimi)',
}

// 타입별 RGB (그라데이션 오버레이용)
const TYPE_RGB: Record<string, string> = {
  saunner: '194,92,74',
  bather: '74,139,156',
  jimi: '97,144,109',
}

// 요일 약어
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export default function Story() {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [log, setLog] = useState<LogWithPlace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [cardScale, setCardScale] = useState(() => {
    if (typeof window !== 'undefined') {
      return (window.innerWidth - 80) / 1080
    }
    return 0.28
  })
  const [exportMessage, setExportMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [bgPhoto, setBgPhoto] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const messageTimer = useRef<NodeJS.Timeout>()

  const showMessage = useCallback((text: string, type: 'success' | 'error') => {
    setExportMessage({ text, type })
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
        const fetched = await getLogById(logId)
        if (fetched) {
          setLog(fetched)
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

  const handleShare = async () => {
    if (!cardRef.current || !log) return
    setIsExporting(true)
    try {
      const blob = await captureCard(cardRef.current)
      await shareImage(blob, `sauna-log-${log.place_name}`)
      showMessage('공유되었어요!', 'success')
    } catch {
      showMessage('공유를 지원하지 않는 환경이에요', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownload = async () => {
    if (!cardRef.current || !log) return
    setIsExporting(true)
    try {
      const blob = await captureCard(cardRef.current)
      const date = log.date.slice(0, 10)
      downloadImage(blob, `sauna-log-${date}.png`)
      showMessage('저장되었어요!', 'success')
    } catch {
      showMessage('저장에 실패했어요', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  // 사진 추가
  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setBgPhoto(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // 사진 삭제 → 트라이브 기본 배경 복원
  const handleRemovePhoto = () => setBgPhoto(null)

  // 타입별 메인 수치
  const getMainMetric = () => {
    if (!log) return { value: '', unit: '', label: '' }

    switch (log.tribe_id) {
      case 'saunner': {
        const deltaT = (log.sauna_temp || 80) - (log.cold_bath_temp || 15)
        return { value: String(deltaT), unit: '°C', label: 'TEMP DELTA' }
      }
      case 'bather': {
        const temp = log.hot_bath_temp || 40
        return { value: String(temp), unit: '°C', label: 'BATH TEMP' }
      }
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

  // 루틴 뱃지 (라벨은 항상 표시, 숫자는 입력값 있을 때만)
  const getRoutineBadges = () => {
    if (!log) return []
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
        return (
          <JimiGraph
            restQuality={log.rest_quality || 3}
            jjimTemp={log.jjim_temp}
          />
        )
      default:
        return null
    }
  }

  // 날짜 포맷: 2026.03.08 · SAT
  const formatDate = () => {
    if (!log) return ''
    const d = new Date(log.date)
    const dateStr = log.date.slice(0, 10).replace(/-/g, '.')
    const day = DAY_NAMES[d.getDay()]
    return `${dateStr} · ${day}`
  }

  if (isLoading || !log) {
    return (
      <div className="min-h-screen bath-tile-bg flex items-center justify-center">
        <p className="text-stone-400">로딩 중...</p>
      </div>
    )
  }

  const bgColor = TYPE_BG_COLORS[log.tribe_id] || TYPE_BG_COLORS.saunner
  const displayName = TYPE_DISPLAY_NAMES[log.tribe_id] || 'SAUNNER'
  const dotColor = TYPE_DOT_COLORS[log.tribe_id] || TYPE_DOT_COLORS.saunner
  const tintRgb = TYPE_RGB[log.tribe_id] || TYPE_RGB.saunner
  const metric = getMainMetric()
  const routineBadges = getRoutineBadges()

  return (
    <div className="min-h-screen bath-tile-bg">
      <main className="px-10 pt-12 pb-8">
        {/* 9:16 카드 프리뷰 — 1080×1920 고정, scale로 축소 표시 */}
        <div
          ref={containerRef}
          className="relative w-full mb-4 flex justify-center"
          style={{ height: cardScale ? 1920 * cardScale + 16 : 0 }}
        >
          <div
            ref={cardRef}
            className="absolute top-0 overflow-hidden"
            style={{
              width: 1080,
              height: 1920,
              backgroundColor: bgColor,
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
                style={{ backgroundImage: `url(${bgPhoto})` }}
              >
                <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, rgba(${tintRgb},0.85) 0%, rgba(${tintRgb},0.5) 40%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.65) 100%)` }} />
              </div>
            )}

            <div
              className="relative h-full flex flex-col"
              style={{ padding: '72px 80px' }}
            >
              {/* 상단: 장소명 + 날짜 */}
              <div style={{ paddingTop: 16 }}>
                <h2
                  className="text-white font-bold"
                  style={{ fontFamily: 'var(--font-heading)', fontSize: 56, letterSpacing: '0.02em' }}
                >
                  {log.place_name}
                </h2>
                <p
                  className="text-white/70 italic"
                  style={{ fontFamily: 'var(--font-heading)', fontSize: 48, marginTop: 12 }}
                >
                  {formatDate()}
                </p>
              </div>

              {/* 중앙: 메인 수치 */}
              <div className="flex-1 flex flex-col justify-center" style={{ paddingTop: 80 }}>
                {/* 라벨 */}
                <p
                  className="text-white/70 uppercase font-bold"
                  style={{ fontFamily: 'var(--font-heading)', fontSize: 48, marginBottom: 16, letterSpacing: '0.2em' }}
                >
                  {metric.label}
                </p>

                {/* 큰 숫자 + 단위 */}
                <div className="flex items-start">
                  <span
                    className="text-white font-bold tracking-tight leading-none"
                    style={{ fontFamily: 'var(--font-heading)', fontSize: 380, marginLeft: -16 }}
                  >
                    {metric.value}
                  </span>
                  <span
                    className="text-white/80 font-semibold"
                    style={{ fontFamily: 'var(--font-heading)', fontSize: 88, marginTop: 28, marginLeft: 8 }}
                  >
                    {metric.unit}
                  </span>
                </div>

                {/* 루틴 뱃지 — 라벨 항상 표시, 숫자는 입력값만 */}
                {/* 디퓨즈 글로우 — 루틴 뒤, 메인 숫자 아래 */}
                {bgPhoto && (
                  <div style={{ position: 'relative', height: 0, overflow: 'visible' }}>
                    <div style={{ position: 'absolute', left: '-30%', right: '-10%', top: 40, height: 300, filter: 'blur(50px)', background: `radial-gradient(ellipse at 40% center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 75%)` }} />
                  </div>
                )}

                <div className="relative flex items-end" style={{ gap: 72, marginTop: 64 }}>
                  {routineBadges.map((badge) => (
                    <div key={badge.label} className="flex flex-col items-center" style={{ gap: 14 }}>
                      <span
                        className="text-white font-bold leading-none"
                        style={{ fontFamily: 'var(--font-heading)', fontSize: 96, minHeight: 96 }}
                      >
                        {badge.value ?? '-'}
                      </span>
                      <span
                        className="text-white/70 tracking-wider uppercase"
                        style={{ fontFamily: 'var(--font-heading)', fontSize: 42 }}
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
                  <div
                    className="rounded-full"
                    style={{ width: 30, height: 30, backgroundColor: dotColor }}
                  />
                  <span
                    className="text-white/70 font-bold tracking-wider"
                    style={{ fontFamily: 'var(--font-heading)', fontSize: 42 }}
                  >
                    {displayName}
                  </span>
                </div>
                <span
                  className="text-white/40 font-bold tracking-wider"
                  style={{ fontFamily: 'var(--font-heading)', fontSize: 42 }}
                >
                  JOIN THE SA-PIENS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 — 정사각 아이콘 + 라벨 아래 */}
        <div className="flex justify-center gap-5 mb-5">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handleAddPhoto}
            className="hidden"
          />

          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex flex-col items-center gap-1.5 disabled:opacity-50"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg hover:opacity-90 transition-all"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>download</span>
            </div>
            <span className="text-[11px] font-medium" style={{ color: 'var(--color-primary)' }}>저장</span>
          </button>

          <button
            onClick={handleShare}
            disabled={isExporting}
            className="flex flex-col items-center gap-1.5 disabled:opacity-50"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg hover:opacity-90 transition-all"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>share</span>
            </div>
            <span className="text-[11px] font-medium" style={{ color: 'var(--color-primary)' }}>공유</span>
          </button>

          <button
            onClick={() => bgPhoto ? handleRemovePhoto() : photoInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5"
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg hover:opacity-90 transition-all ${
                bgPhoto ? 'border-2 bg-white' : 'text-white'
              }`}
              style={bgPhoto
                ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }
                : { backgroundColor: 'var(--color-primary)' }
              }
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                {bgPhoto ? 'delete' : 'add_photo_alternate'}
              </span>
            </div>
            <span className="text-[11px] font-medium" style={{ color: 'var(--color-primary)' }}>
              {bgPhoto ? '삭제' : '사진'}
            </span>
          </button>
        </div>

        {/* 공유/저장 피드백 */}
        {exportMessage && (
          <div className="flex items-center justify-center mb-2">
            <p className={`text-sm font-medium ${exportMessage.type === 'success' ? 'text-stone-600' : 'text-red-500'}`}>
              {exportMessage.text}
            </p>
          </div>
        )}

        {/* 하단 네비게이션 */}
        <div className="flex justify-center gap-6">
          <button
            onClick={() => {
              localStorage.removeItem('savedLogId')
              router.push('/history')
            }}
            className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>history</span>
            지난 기록
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
    </div>
  )
}
