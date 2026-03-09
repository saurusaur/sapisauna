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

// 요일 약어
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export default function Story() {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  const [log, setLog] = useState<LogWithPlace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
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
      const date = new Date(log.record_date || log.date || '').toISOString().slice(0, 10)
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
        return { value: String(temp), unit: '°C', label: 'IMMERSION TEMP' }
      }
      case 'jimi': {
        const temp = log.jjim_temp
        return temp
          ? { value: String(temp), unit: '°C', label: 'JJIMJILBANG TEMP' }
          : { value: '—', unit: '', label: 'JJIMJILBANG' }
      }
      default:
        return { value: '', unit: '', label: '' }
    }
  }

  // 루틴 숫자 뱃지 (입력값이 있는 것만 표시)
  const getRoutineBadges = () => {
    if (!log) return []
    const badges: { value: number; label: string }[] = []

    if (log.heat_time) badges.push({ value: log.heat_time, label: 'HEAT' })
    if (log.ice_time) badges.push({ value: log.ice_time, label: 'ICE' })
    if (log.pause_time) badges.push({ value: log.pause_time, label: 'PAUSE' })
    if (log.repeat) badges.push({ value: log.repeat, label: 'RPT' })

    return badges
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
    const d = new Date(log.record_date || log.date || '')
    const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '.')
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
  const metric = getMainMetric()
  const routineBadges = getRoutineBadges()

  return (
    <div className="min-h-screen bath-tile-bg">
      {/* 헤더 — 미니멀 아이콘 */}
      <header className="flex items-center justify-between px-4 pt-6 pb-2">
        <button
          onClick={() => {
            localStorage.removeItem('savedLogId')
            router.push('/home')
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-200/50 transition-colors"
        >
          <span className="material-symbols-outlined text-stone-600" style={{ fontSize: '22px' }}>
            arrow_back
          </span>
        </button>
        <button
          onClick={() => {
            localStorage.removeItem('savedLogId')
            router.push('/home')
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-200/50 transition-colors"
        >
          <span className="material-symbols-outlined text-stone-600" style={{ fontSize: '22px' }}>
            home
          </span>
        </button>
      </header>

      {/* 성공 토스트 슬롯 — 추후 SaveSuccessToast 컴포넌트 삽입 */}
      <div className="h-12 px-4" id="toast-slot" />

      <main className="px-4 pb-8">
        {/* 장소명 + 날짜 (카드 바깥) */}
        <div className="text-center mb-4">
          <h2 className="text-sm font-semibold text-stone-700">{log.place_name}</h2>
          <p
            className="text-xs text-stone-400 mt-0.5 italic"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {formatDate()}
          </p>
        </div>

        {/* 9:16 카드 프리뷰 — 풀폭 */}
        <div className="flex justify-center mb-6">
          <div
            ref={cardRef}
            className="relative w-full rounded-2xl overflow-hidden shadow-xl"
            style={{
              aspectRatio: '9 / 16',
              backgroundColor: bgColor,
            }}
          >
            {/* 배경 사진 레이어 */}
            {bgPhoto && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${bgPhoto})` }}
              >
                <div className="absolute inset-0 bg-black/35" />
              </div>
            )}

            <div className="relative h-full flex flex-col px-6 py-8">
              {/* 상단: 장소명 + 날짜 (카드 내부) */}
              <div className="text-center">
                <h2 className="text-white/60 text-xs font-medium tracking-wide">
                  {log.place_name}
                </h2>
                <p
                  className="text-white/40 text-[11px] mt-1 italic"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {formatDate()}
                </p>
              </div>

              {/* 중앙: 메인 수치 */}
              <div className="flex-1 flex flex-col items-center justify-center">
                {/* 라벨 */}
                <p
                  className="text-white/40 text-[10px] tracking-[0.2em] uppercase mb-2"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {metric.label}
                </p>

                {/* 큰 숫자 */}
                <div className="flex items-baseline justify-center">
                  <span
                    className="text-white text-8xl font-light tracking-tight"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {metric.value}
                  </span>
                  <span
                    className="text-white/70 text-2xl font-light ml-1"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {metric.unit}
                  </span>
                </div>

                {/* 루틴 뱃지 (입력값 있을 때만) */}
                {routineBadges.length > 0 && (
                  <div className="flex items-center gap-3 mt-5">
                    {routineBadges.map((badge) => (
                      <div key={badge.label} className="flex flex-col items-center gap-1">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: 'var(--color-primary)' }}
                        >
                          {badge.value}
                        </div>
                        <span
                          className="text-white/40 text-[8px] tracking-wider uppercase"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {badge.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 그래프 */}
                <div className="w-full h-[180px] mt-2">
                  {renderGraph()}
                </div>
              </div>

              {/* 하단: 타입 + 워터마크 */}
              <div className="flex items-end justify-between">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: dotColor }}
                  />
                  <span
                    className="text-white/60 text-[10px] font-semibold tracking-wider"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {displayName}
                  </span>
                </div>
                <span
                  className="text-white/20 text-[9px] tracking-[0.2em] uppercase"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {APP.NAME}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 3개 — 빨간 라운드 사각 */}
        <div className="flex justify-center gap-4 mb-3">
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
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md hover:opacity-90 transition-all"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>download</span>
            </div>
            <span className="text-[11px] font-medium text-stone-500">저장</span>
          </button>

          <button
            onClick={handleShare}
            disabled={isExporting}
            className="flex flex-col items-center gap-1.5 disabled:opacity-50"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md hover:opacity-90 transition-all"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>share</span>
            </div>
            <span className="text-[11px] font-medium text-stone-500">공유</span>
          </button>

          <button
            onClick={() => bgPhoto ? handleRemovePhoto() : photoInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5"
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md hover:opacity-90 transition-all ${
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
            <span className="text-[11px] font-medium text-stone-500">
              {bgPhoto ? '사진 삭제' : '사진'}
            </span>
          </button>
        </div>

        {/* 공유/저장 피드백 */}
        <div className="h-6 flex items-center justify-center mb-4">
          {exportMessage && (
            <p className={`text-sm font-medium ${exportMessage.type === 'success' ? 'text-stone-600' : 'text-red-500'}`}>
              {exportMessage.text}
            </p>
          )}
        </div>

        {/* 하단 네비게이션 — 텍스트 링크 */}
        <div className="flex justify-center gap-8">
          <button
            onClick={() => {
              localStorage.removeItem('savedLogId')
              router.push('/place')
            }}
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            추가 기록
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('savedLogId')
              router.push('/history')
            }}
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>schedule</span>
            지난 기록
          </button>
        </div>
      </main>
    </div>
  )
}
