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

// 타입별 표시 이름 (이탤릭 세리프)
const TYPE_DISPLAY_NAMES: Record<string, string> = {
  saunner: 'Saunner',
  bather: 'Bather',
  jimi: 'Jimi',
}

export default function Story() {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  const [log, setLog] = useState<LogWithPlace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [showSaveToast, setShowSaveToast] = useState(false)
  const [bgPhoto, setBgPhoto] = useState<string | null>(null) // 배경 사진 data URL
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
          // 성공 토스트 표시
          setShowSaveToast(true)
          setTimeout(() => setShowSaveToast(false), 3000)
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
    // input 초기화 (같은 파일 재선택 가능하도록)
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
        return { value: String(deltaT), unit: '°C', label: 'temperature delta' }
      }
      case 'bather': {
        const temp = log.hot_bath_temp || 40
        return { value: String(temp), unit: '°C', label: 'immersion temperature' }
      }
      case 'jimi': {
        const temp = log.jjim_temp
        return temp
          ? { value: String(temp), unit: '°C', label: 'jjimjilbang temperature' }
          : { value: '—', unit: '', label: 'jjimjilbang' }
      }
      default:
        return { value: '', unit: '', label: '' }
    }
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

  if (isLoading || !log) {
    return (
      <div className="min-h-screen bath-tile-bg flex items-center justify-center">
        <p className="text-stone-400">로딩 중...</p>
      </div>
    )
  }

  const bgColor = TYPE_BG_COLORS[log.tribe_id] || TYPE_BG_COLORS.saunner
  const displayName = TYPE_DISPLAY_NAMES[log.tribe_id] || 'Saunner'
  const metric = getMainMetric()

  return (
    <div className="min-h-screen bath-tile-bg">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm flex items-center justify-between">
        <h1 className="text-lg font-bold text-stone-700">스토리 카드</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              localStorage.removeItem('savedLogId')
              router.push('/history')
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-500 hover:bg-stone-100 transition-colors"
          >
            내 기록
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('savedLogId')
              router.push('/home')
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-500 hover:bg-stone-100 transition-colors"
          >
            홈으로
          </button>
        </div>
      </header>

      <main className="p-4">
        {/* 성공 토스트 */}
        {showSaveToast && (
          <div className="mb-4 py-2.5 px-4 rounded-xl bg-green/10 text-center animate-fade-in">
            <p className="text-sm font-medium" style={{ color: 'var(--color-green)' }}>
              기록이 저장되었어요!
            </p>
          </div>
        )}

        {/* 9:16 카드 프리뷰 */}
        <div className="flex justify-center mb-6">
          <div
            ref={cardRef}
            className="relative w-full max-w-[280px] rounded-2xl overflow-hidden shadow-xl"
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
                {/* 오버레이: 텍스트 가독성 확보 */}
                <div className="absolute inset-0 bg-black/30" />
              </div>
            )}
            <div className="relative h-full flex flex-col px-6 py-8">
              {/* 상단: 장소명 + 날짜 */}
              <div className="text-center">
                <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-md px-2.5 py-1">
                  <span
                    className="material-symbols-outlined text-white/50 leading-none"
                    style={{ fontSize: '12px' }}
                  >
                    onsen
                  </span>
                  <h2
                    className="text-white/50 text-xs font-normal"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {log.place_name}
                  </h2>
                </div>
                <p
                  className="text-white/50 text-[12.5px] mt-1.5 italic"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {new Date(log.record_date || log.date || '').toISOString().slice(0, 10).replace(/-/g, '.')}
                </p>
              </div>

              {/* 중앙: 숫자 + 그래프 (겹침) */}
              <div className="flex-1 flex flex-col items-center justify-center relative">
                <div className="text-center z-10 mb-[-40px]">
                  <p
                    className="text-white/40 text-[10px] tracking-[0.2em] uppercase mb-2"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    {metric.label}
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span
                      className="text-white text-8xl font-light tracking-tight"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      {metric.value}
                    </span>
                    <span
                      className="text-white/70 text-2xl font-light ml-1"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      {metric.unit}
                    </span>
                  </div>
                </div>

                <div className="w-full h-[200px]">
                  {renderGraph()}
                </div>
              </div>

              {/* 하단: 타입태그 + 워터마크 */}
              <div className="text-center">
                <p
                  className="text-white/60 text-xs italic mb-1"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {displayName}
                </p>
                <p
                  className="text-white/20 text-[9px] tracking-[0.25em] uppercase"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {APP.NAME}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 사진 추가/삭제 */}
        <div className="flex justify-center gap-3 mb-4">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handleAddPhoto}
            className="hidden"
          />
          {bgPhoto ? (
            <button
              onClick={handleRemovePhoto}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-500 bg-white border border-stone-200 hover:bg-stone-50 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
              사진 삭제
            </button>
          ) : (
            <button
              onClick={() => photoInputRef.current?.click()}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-500 bg-white border border-stone-200 hover:bg-stone-50 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_photo_alternate</span>
              사진 추가
            </button>
          )}
          {bgPhoto && (
            <button
              onClick={() => photoInputRef.current?.click()}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-500 bg-white border border-stone-200 hover:bg-stone-50 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>swap_horiz</span>
              사진 변경
            </button>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              disabled={isExporting}
              className="flex-1 py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-green)' }}
            >
              <span className="material-symbols-outlined">share</span>
              공유
            </button>
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex-1 py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-green)' }}
            >
              <span className="material-symbols-outlined">download</span>
              저장
            </button>
          </div>

          {/* 공유/저장 피드백 */}
          <div className="h-6 flex items-center justify-center">
            {exportMessage && (
              <p className={`text-sm font-medium ${exportMessage.type === 'success' ? 'text-green' : 'text-red-500'}`}>
                {exportMessage.text}
              </p>
            )}
          </div>

          {/* 네비게이션 */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                localStorage.removeItem('savedLogId')
                router.push('/place')
              }}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-stone-600 bg-white border border-stone-200 hover:bg-stone-50 transition-all"
            >
              한 번 더 기록
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('savedLogId')
                router.push('/home')
              }}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-stone-400 hover:text-stone-600 transition-all"
            >
              홈으로
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
