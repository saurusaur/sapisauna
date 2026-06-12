/**
 * 스토리 카드 뷰어 페이지
 * /story
 *
 * DB 저장 완료 후 진입 — 순수 카드 프리뷰 + 공유/다운로드 도구
 * 프리뷰: 기존 JSX 렌더링 (빠르고 정확)
 * 내보내기: Canvas에서 직접 렌더링 → PNG (서버 왕복 없음)
 *
 * v3 에디토리얼 디자인 (2026-06-09 확정) + v3.1~v3.2 결정 (2026-06-10):
 *  - 블리드 히어로(°반잘림, 130px 공통, top 96) + 우상 메트릭 라벨(top 72) + 좌중 사우나명(top 230)
 *    — 라벨↔히어로 간격 = 사우나명↔루틴 간격(~13px)과 동일
 *  - 세로 루틴 타임라인(활동 — 온도 — 시간) + 세트(×N, 높이정렬 보정)
 *  - 오로라 그라데이션 + 그레인(밴딩 방지) + 물결(steam) 워터마크 + 트라이브 점색
 *  - 요약 점수 = 블랙 점 5개(채움/빈 원), 칭호(일반)·닉네임(bold) 잉크 통일
 *  - 하단(v3.4): 우측 정렬 스택 bottom 72(IG 답장바 회피) — 트라이브명+도트(이름 먼저, italic) / 칭호·닉네임, 갭 10
 *  - 물결 워터마크(v3.4): 날짜 아래(20,92) 20px — IG 프로필칩 회피
 *  - v3.4: 여백 20px 통일(히어로 제외)·° 중심=모서리 반잘림·요일 제거·세트 × 잉크·비압축 행간 1.8(줄 갭 10px)
 *  - 긴 루틴: ≤6줄 기본 / 7줄 압축 / 초과 시 beyond 제외 → 「+N 활동」 7줄 컷
 *  - 사진 배경: 사진(블러·저채도) 위에 오로라 유지, 흰 베이스만 반투명(.38→.46)
 *  - 목욕파 히어로: 온탕 우선, 루틴상 열탕 시간이 더 길면 열탕
 *  - 온도 미입력(폴백): 물결 마크를 히어로로
 *  - 설계 SSOT: docs/po/스토리_프로토타입_v3_20260609.html · 결정 데모(아카이브): docs/po/archive/스토리_개선제안_데모_20260610.html
 *  - 레이아웃 값 단일 소스: src/lib/story-card-spec.ts (프리뷰·Canvas 공유)
 *
 * v3.6 페이지 크롬 (2026-06-12, 시안 아카이브: docs/po/archive/스토리페이지_리디자인_시안_20260611.html):
 *  - 레드 곡선 헤더(SAUNA CHECKED + 오늘의 사우나 카드 완성!, 타이틀↔서브 10px·서브↔카드 20px)
 *  - 도장 공유 FAB(레드+화이트 링 2px+공유 심볼, 우측 10°, 카드 우하단 겹침)
 *  - 하단 글래스 원형 버튼 4개: 저장·추가 기록·기록 보기·홈으로
 *  - 카드 프리뷰 라운드 앱 표준(px(14))으로 축소
 */
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { type StoryTribeId } from '@/constants/story-colors'
import type { LogWithPlace, LogBlock } from '@/types'
import { getMyLogById } from '@/lib/logs-service'
import { BLOCK_TYPES } from '@/constants/content'
import ContentLoader from '@/components/ui/content-loader'
import { renderCard, shareImage, downloadImage } from '@/lib/image-export'
import { processPhoto } from '@/lib/process-photo'
import { captureError } from '@/lib/error-logger'
import confetti from 'canvas-confetti'
import SteamCardReveal from '@/components/features/steam-card-reveal'
import type { RewardResult } from '@/types'
import { getPrimaryTempDelta, getJimiHeadlineTemp } from '@/lib/sauna-temp-helpers'
import {
  CARD_W, CARD_H, spx, SPEC, INK, DOT_COLOR, TRIBE_EN, METRIC_LABEL, SCORE_LABEL,
  STEAM_MARK, cssAurora, GRAIN_URI, GRAIN_ALPHA, GRAIN_TILE, PHOTO_FILTER, PHOTO_SCALE,
} from '@/lib/story-card-spec'

// ── v3.5: 디자인 토큰·레이아웃은 공유 스펙(story-card-spec)이 단일 소스 ──
// 프리뷰와 Canvas(image-export)가 같은 값을 import → 두 렌더러가 달라질 수 없음
const px = spx
const INK_D = 'rgba(28,25,23,0.55)' // 페이지 크롬(배경변경 버튼) 전용

// 블록 → 카탈로그 정의 (마사지세신은 variant로 구분)
function blockDef(b: LogBlock) {
  if (b.block_type === 'scrub' && b.variant === 'withmassage') {
    return BLOCK_TYPES.find((d) => d.id === 'scrub-withmassage')
  }
  return BLOCK_TYPES.find((d) => d.blockType === b.block_type)
}

// 블록 → 루틴 한 줄 { 이름, [온도, 시간 | 점수], beyond 여부(오버플로 시 우선 제외용) }
function blockLine(b: LogBlock): { name: string; parts: string[]; beyond: boolean } {
  const def = blockDef(b)
  const name = def?.label ?? b.block_type
  const parts: string[] = []
  if (b.temp != null) parts.push(`${b.temp}°`)
  if (b.duration_sec != null && b.duration_sec > 0) {
    parts.push(def?.durUnit === 'sec' ? `${b.duration_sec}초` : `${Math.round(b.duration_sec / 60)}분`)
  }
  // 온도·시간 없는 beyond 평가 블록(세신/마사지/매점/식당) → 점수
  if (b.temp == null && (b.duration_sec == null || b.duration_sec === 0) && b.score != null) {
    parts.push(`${b.score}/5`)
  }
  return { name, parts, beyond: def?.category === 'beyond' }
}

export default function Story() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [log, setLog] = useState<LogWithPlace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [cardScale, setCardScale] = useState(() => {
    if (typeof window !== 'undefined') {
      return (Math.min(window.innerWidth, 448) - 80) / CARD_W
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
        setCardScale(availableWidth / CARD_W)
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

  // Canvas 기반 내보내기 (서버 호출 없음) — 프리뷰와 동일한 표시 데이터(아래 derived 값)를 그대로 전달
  const handleExport = async (mode: 'download' | 'share') => {
    if (!log) return
    setIsExporting(true)
    try {
      const blob = await renderCard({
        tribeId: tribe,
        placeName: log.place_name,
        date: log.date,
        bgPhoto,
        heroTemp,
        metricLabel: METRIC_LABEL[tribe],
        routineLines,
        hiddenCount,
        repeat,
        dense,
        scoreLabel: SCORE_LABEL[tribe],
        scoreValue: nowScoreVal ?? null,
        userNickname: log.user_nickname,
        userTitle: log.user_title,
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
      captureError(err, { label: 'Story export 실패' })
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
      if (bgPhoto) URL.revokeObjectURL(bgPhoto)
      setBgPhoto(url)
    } catch (err) {
      captureError(err, { label: 'Photo 처리 실패' })
    } finally {
      setIsProcessingPhoto(false)
    }
  }

  const handleRemovePhoto = () => {
    if (bgPhoto) URL.revokeObjectURL(bgPhoto)
    setBgPhoto(null)
  }

  // v3.4: 요일 제거 — 날짜만
  const formatTopDate = () => {
    if (!log) return ''
    return log.date.slice(0, 10).replace(/-/g, '.')
  }

  if (isLoading || !log) {
    return (
      <div className="min-h-dvh bath-tile-bg flex items-center justify-center">
        <ContentLoader />
      </div>
    )
  }

  const tribe = (log.tribe_id as StoryTribeId) in DOT_COLOR ? (log.tribe_id as StoryTribeId) : 'saunner'

  // 히어로 온도 (없으면 null → 물결 마크 폴백)
  const heroTemp: number | null = (() => {
    if (tribe === 'saunner') { const p = getPrimaryTempDelta(log); return p ? p.delta : null }
    if (tribe === 'bather') {
      // 온탕 우선, 단 루틴(블록)상 열탕 총 시간이 온탕보다 길면 열탕 메인 (2026-06-10 확정)
      const durOf = (type: string) =>
        (log.blocks ?? []).filter((b) => b.block_type === type).reduce((s, b) => s + (b.duration_sec ?? 0), 0)
      const hot = log.hot_bath_temp ?? null
      const very = log.very_hot_bath_temp ?? null
      if (hot != null && very != null) return durOf('very-hot-bath') > durOf('hot-bath') ? very : hot
      return hot ?? very
    }
    return getJimiHeadlineTemp(log)?.value ?? null
  })()

  // 요약줄 점수 (트라이브 시그니처 품질)
  const nowScoreVal = tribe === 'saunner' ? log.totono_score : tribe === 'bather' ? log.water_quality : log.sweat_quality

  // 루틴 타임라인 (블록 seq 순) + 오버플로 규칙 (2026-06-10 확정, v3.2: 레이아웃 하향으로 max 7줄)
  // 줄 수(활동+세트) 기준: ≤6 기본 / 7 압축(11.5px·행간 1.58) / >7 beyond 제외 → 그래도 넘으면 활동 + 「+N 활동」 + 세트 = 7줄 컷
  const repeat = log.repeat ?? 0
  const setLine = repeat > 1 ? 1 : 0
  // is_extra(루틴 외 시설 온도 제보)는 타임라인 제외 — 루틴 활동만
  const allLines = (log.blocks ?? []).filter((b) => !b.is_extra).slice().sort((a, b) => a.seq - b.seq).map(blockLine)
  let routineLines = allLines
  let hiddenCount = 0
  if (routineLines.length + setLine > 7) {
    routineLines = allLines.filter((ln) => !ln.beyond) // beyond(세신/매점 등) 우선 제외
    if (routineLines.length + setLine > 7) {
      const visible = 7 - setLine - 1 // 「+N 활동」 줄 포함 총 7줄
      hiddenCount = allLines.length - visible // 숨김 = 전체 - 표시 (beyond 포함)
      routineLines = routineLines.slice(0, visible)
    }
  }
  // 압축 모드: 표시 줄 수(활동 + +N + 세트)가 7줄 이상일 때
  const dense = routineLines.length + (hiddenCount > 0 ? 1 : 0) + setLine > 6

  const fallbackHero = heroTemp == null

  return (
    <div className="min-h-dvh bath-tile-bg overflow-hidden">
      {/* 레드 곡선 헤더 (홈 무드) — v3.6 페이지 크롬 */}
      <div className="relative" style={{ backgroundColor: 'var(--color-primary)' }}>
        {/* 간격: 타이틀↔서브 10px, 서브↔카드 20px(pb-5 + main mt 0) */}
        <div className="pt-14 pb-5 text-center text-white">
          <div className="font-heading italic font-bold" style={{ fontSize: 26, letterSpacing: '0.03em', lineHeight: 1 }}>
            SAUNA CHECKED
          </div>
          <p className="text-[12px] font-semibold opacity-90" style={{ marginTop: 10 }}>오늘의 사우나 카드 완성!</p>
        </div>
        {/* 하단 곡선 */}
        <svg className="absolute left-0 w-full" style={{ bottom: -23, height: 24 }} viewBox="0 0 320 24" preserveAspectRatio="none" aria-hidden>
          <path d="M0,0 L320,0 L320,8 Q160,30 0,8 Z" fill="var(--color-primary)" />
        </svg>
      </div>

      <main className="px-10 pb-10">
        {/* 9:16 카드 프리뷰 — 1080×1920 고정, scale로 축소 표시. 레드 헤더에 살짝 겹침 */}
        <div
          ref={containerRef}
          className="relative w-full flex justify-center z-[5]"
          style={{ height: cardScale ? CARD_H * cardScale + 16 : 0 }}
        >
          {/* 배경 변경 버튼 */}
          <input ref={photoInputRef} type="file" accept="image/*" onChange={handleAddPhoto} className="hidden" />
          <button
            onClick={() => (isProcessingPhoto ? undefined : bgPhoto ? handleRemovePhoto() : photoInputRef.current?.click())}
            disabled={isProcessingPhoto}
            className="absolute top-2 right-2 z-10 flex items-center justify-center gap-1 w-[88px] h-[30px] rounded-full transition-all hover:bg-black/10 shadow-md"
            style={{ backgroundColor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          >
            <span className={`material-symbols-outlined ${isProcessingPhoto ? 'animate-spin' : ''}`} style={{ fontSize: '14px', color: INK_D }}>
              {isProcessingPhoto ? 'progress_activity' : bgPhoto ? 'restart_alt' : 'add_photo_alternate'}
            </span>
            <span className="text-[11px] font-medium" style={{ color: INK_D }}>
              {isProcessingPhoto ? '처리 중...' : bgPhoto ? '초기화' : '배경 변경'}
            </span>
          </button>

          {/* 카드 본체 (1080×1920, scale 축소) */}
          <div
            className="absolute top-0 overflow-hidden"
            style={{
              width: CARD_W,
              height: CARD_H,
              transform: `scale(${cardScale})`,
              transformOrigin: 'top center',
              borderRadius: px(14), // v3.6: 앱 표준 라운드(rounded-2xl 체감)로 축소
              boxShadow: '0 24px 80px rgba(0,0,0,0.35), 0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.06)',
              background: bgPhoto ? undefined : cssAurora(tribe, false),
            }}
          >
            {/* 사진 모드: 사진(블러·저채도) 뒤 + 오로라 오버레이(흰 베이스만 반투명) */}
            {bgPhoto && (
              <>
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${bgPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center',
                    filter: PHOTO_FILTER, transform: `scale(${PHOTO_SCALE})`,
                  }}
                />
                <div style={{ position: 'absolute', inset: 0, background: cssAurora(tribe, true) }} />
              </>
            )}
            {/* 그레인 (그라데이션 밴딩 방지) */}
            <div
              style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', opacity: GRAIN_ALPHA, mixBlendMode: 'multiply',
                backgroundImage: `url("${GRAIN_URI}")`, backgroundSize: `${px(GRAIN_TILE)}px ${px(GRAIN_TILE)}px`,
              }}
            />

            {/* 상단: 좌=날짜 / 우=메트릭 라벨 */}
            <div style={{ position: 'absolute', left: SPEC.pad, right: SPEC.pad, top: SPEC.top.y, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: SPEC.top.fs, fontWeight: 700, letterSpacing: `${SPEC.top.dateLs}em`, color: INK }}>{formatTopDate()}</span>
              <span style={{ fontSize: SPEC.top.fs, fontWeight: 700, letterSpacing: `${SPEC.top.metricLs}em`, textTransform: 'uppercase', textAlign: 'right', color: INK, maxWidth: SPEC.top.metricMaxW }}>
                {fallbackHero ? '' : METRIC_LABEL[tribe]}
              </span>
            </div>

            {/* 히어로: 온도 대형(° 중심=모서리 반잘림) 또는 물결 마크 폴백 (라벨 슬롯은 비움) */}
            {fallbackHero ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={STEAM_MARK} alt="" style={{ position: 'absolute', right: SPEC.pad, top: SPEC.hero.top, width: SPEC.fallbackMark.w, opacity: SPEC.fallbackMark.alpha }} />
            ) : (
              <div
                className="font-heading"
                style={{
                  position: 'absolute', right: SPEC.hero.previewRight, top: SPEC.hero.top, fontWeight: 700, fontSize: SPEC.hero.fs,
                  lineHeight: SPEC.hero.lh, letterSpacing: `${SPEC.hero.ls}em`,
                  backgroundImage: `linear-gradient(160deg,${SPEC.hero.gradFrom} 0%, ${SPEC.hero.gradTo} ${SPEC.hero.gradStop * 100}%)`,
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                }}
              >
                {heroTemp}
                <span style={{ fontSize: SPEC.hero.degFs, verticalAlign: 'top', marginLeft: SPEC.hero.gap }}>°</span>
              </div>
            )}

            {/* 좌중: 사우나명 */}
            <div style={{ position: 'absolute', left: SPEC.pad, top: SPEC.place.top, fontWeight: 700, fontSize: SPEC.place.fs, lineHeight: SPEC.place.lh, letterSpacing: `${SPEC.place.ls}em`, color: INK, maxWidth: SPEC.place.maxW }}>
              {log.place_name}
            </div>

            {/* 루틴 타임라인 + (+N 활동) + 세트 + 요약 점수(블랙 점 5개) */}
            <div style={{ position: 'absolute', left: SPEC.pad, top: SPEC.routine.top, right: SPEC.pad }}>
              {routineLines.map((ln, i) =>
                ln.parts.length === 0 ? (
                  // 온도/시간 없는 활동: 이름 뒤 장식 라인 (bare)
                  <div key={i} style={{ display: 'flex', alignItems: 'center', width: SPEC.routine.bare.w, fontSize: dense ? SPEC.routine.denseFs : SPEC.routine.fs, lineHeight: dense ? SPEC.routine.denseLh : SPEC.routine.lh, letterSpacing: `${SPEC.routine.ls}em`, color: INK }}>
                    <span style={{ fontWeight: 700 }}>{ln.name}</span>
                    <span style={{ flex: 1, height: 0, marginLeft: SPEC.routine.bare.ruleGap, borderTop: `${SPEC.routine.bare.ruleH}px solid ${SPEC.routine.bare.color}`, position: 'relative', top: -SPEC.routine.dash.raise }} />
                  </div>
                ) : (
                  <div key={i} style={{ fontSize: dense ? SPEC.routine.denseFs : SPEC.routine.fs, lineHeight: dense ? SPEC.routine.denseLh : SPEC.routine.lh, letterSpacing: `${SPEC.routine.ls}em`, color: INK }}>
                    <span style={{ fontWeight: 700 }}>{ln.name}</span>
                    {ln.parts.map((p, j) => (
                      <span key={j}>
                        {/* 구분 라인: 글리프(—) 대신 실선 — 잉크색·1px·정중앙 (v3.5.1) */}
                        <span style={{ display: 'inline-block', width: SPEC.routine.dash.w, height: SPEC.routine.dash.h, background: SPEC.routine.dash.color, margin: `0 ${SPEC.routine.dash.margin}px`, verticalAlign: 'middle', position: 'relative', top: -SPEC.routine.dash.raise }} />
                        {p}
                      </span>
                    ))}
                  </div>
                )
              )}
              {hiddenCount > 0 && (
                <div style={{ fontSize: SPEC.routine.more.fs, lineHeight: SPEC.routine.more.lh, color: INK }}>+ {hiddenCount} 활동</div>
              )}
              {repeat > 1 && (
                <div style={{ fontSize: dense ? SPEC.routine.denseFs : SPEC.routine.fs, lineHeight: dense ? SPEC.routine.denseLh : SPEC.routine.lh, letterSpacing: `${SPEC.routine.ls}em`, color: INK }}>
                  <span style={{ fontWeight: 700 }}>세트</span>
                  {/* ×는 살짝 내려 숫자와 높이 정렬, 잉크색 */}
                  <span style={{ margin: `0 ${SPEC.routine.dash.margin}px`, color: INK, fontWeight: 300, fontSize: SPEC.routine.x.fs, verticalAlign: -SPEC.routine.x.drop }}>×</span>
                  {repeat}
                </div>
              )}
              {nowScoreVal != null && (
                <div style={{ display: 'flex', alignItems: 'center', fontSize: SPEC.score.fs, fontWeight: 700, marginTop: dense ? SPEC.score.denseMt : SPEC.score.mt, color: INK }}>
                  {SCORE_LABEL[tribe]}
                  <span style={{ display: 'inline-flex', marginLeft: SPEC.score.pipMl, gap: SPEC.score.pipGap }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        style={{
                          width: SPEC.score.pipD, height: SPEC.score.pipD, borderRadius: '50%',
                          ...(n <= nowScoreVal ? { background: INK } : { border: `${SPEC.score.pipStroke}px solid ${INK}` }),
                        }}
                      />
                    ))}
                  </span>
                </div>
              )}
            </div>

            {/* 워터마크: 물결 마크 날짜 아래 (IG 프로필칩 회피), 폴백 시에도 유지 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={STEAM_MARK} alt="" style={{ position: 'absolute', left: SPEC.watermark.x, top: SPEC.watermark.y, width: SPEC.watermark.w, opacity: SPEC.watermark.alpha }} />

            {/* 하단 우측 스택: 트라이브명+도트(이름 먼저) 위 / 칭호·닉네임 아래 — 줄박스 lh1 + 갭 10(루틴 줄 갭과 동일 체감, v3.5) */}
            <div style={{ position: 'absolute', right: SPEC.pad, bottom: SPEC.foot.bottom, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: SPEC.foot.gap }}>
              <span className="font-heading" style={{ display: 'inline-flex', alignItems: 'center', gap: SPEC.foot.dotGap, fontSize: SPEC.foot.fs, lineHeight: SPEC.foot.lh, fontWeight: 700, fontStyle: 'italic', letterSpacing: `${SPEC.foot.tribeLs}em`, color: INK }}>
                {TRIBE_EN[tribe]}
                <span style={{ width: SPEC.foot.dotD, height: SPEC.foot.dotD, borderRadius: '50%', background: DOT_COLOR[tribe] }} />
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: SPEC.foot.fs, lineHeight: SPEC.foot.lh, fontWeight: 700, letterSpacing: `${SPEC.foot.nameLs}em`, color: INK }}>
                {/* 칭호(-0.5px 보정) · 점 양쪽 균일 갭 (v3.5) */}
                {log.user_title && (
                  <>
                    <span style={{ fontWeight: 400, fontSize: SPEC.foot.titleFs }}>{log.user_title}</span>
                    <span style={{ fontWeight: 400, fontSize: SPEC.foot.titleFs, margin: `0 ${SPEC.foot.sep}px` }}>·</span>
                  </>
                )}
                <span style={{ fontWeight: 700 }}>{log.user_nickname || 'SA-PIEN'}</span>
              </span>
            </div>
          </div>
          {/* 도장 공유 FAB — 카드 우하단 겹침, 우측 10° (시안 v2.2) */}
          <div className="absolute z-10" style={{ right: -28, bottom: -34, transform: 'rotate(10deg)' }}>
            {exportMessage?.source === 'share' && (
              <span className={`absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold animate-fade-in whitespace-nowrap ${exportMessage.type === 'success' ? 'text-stone-500' : 'text-red-500'}`}>
                {exportMessage.text}
              </span>
            )}
            <button
              onClick={() => handleExport('share')}
              disabled={isExporting}
              className="relative flex flex-col items-center justify-center text-white rounded-full transition-all hover:scale-105 active:scale-[0.96] active:brightness-90 disabled:opacity-50"
              style={{
                width: 88, height: 88,
                backgroundColor: 'var(--color-primary)',
                boxShadow: '0 16px 36px -10px rgba(204,26,26,0.45), 0 6px 16px -6px rgba(0,0,0,0.18)',
              }}
            >
              {/* 도장 링 (화이트 2px) */}
              <span className="absolute rounded-full border-2 border-white" style={{ inset: 6 }} aria-hidden />
              <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>ios_share</span>
              <span className="text-[11px] font-semibold mt-0.5">공유</span>
            </button>
          </div>
        </div>

        {/* 하단 액션: 글래스 원형 버튼 4개 — 저장 · 추가 기록 · 기록 보기 · 홈으로 */}
        <div className="flex justify-center gap-6 mt-14">
          <div className="relative flex flex-col items-center gap-1.5">
            {exportMessage?.source === 'download' && (
              <span className={`absolute -top-5 text-xs font-semibold animate-fade-in whitespace-nowrap ${exportMessage.type === 'success' ? 'text-stone-500' : 'text-red-500'}`}>
                {exportMessage.text}
              </span>
            )}
            <button onClick={() => handleExport('download')} disabled={isExporting} className="flex flex-col items-center gap-1.5 disabled:opacity-50">
              <span
                className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-[0.96] active:brightness-95"
                style={{ background: 'hsla(0,0%,100%,.6)', border: '0.5px solid hsla(0,0%,100%,.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', boxShadow: '0 3px 12px -3px hsla(0,10%,15%,.12), 0 1px 3px -1px hsla(0,10%,15%,.08)' }}
              >
                <span className="material-symbols-outlined text-stone-600" style={{ fontSize: '22px' }}>download</span>
              </span>
              <span className="text-[11px] font-semibold text-stone-500">저장</span>
            </button>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('savedLogId')
              router.push('/log')
            }}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-[0.96] active:brightness-95"
              style={{ background: 'hsla(0,0%,100%,.6)', border: '0.5px solid hsla(0,0%,100%,.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', boxShadow: '0 3px 12px -3px hsla(0,10%,15%,.12), 0 1px 3px -1px hsla(0,10%,15%,.08)' }}
            >
              <span className="material-symbols-outlined text-stone-600" style={{ fontSize: '22px' }}>add_circle</span>
            </span>
            <span className="text-[11px] font-semibold text-stone-500">추가 기록</span>
          </button>

          <button
            onClick={() => {
              const logId = localStorage.getItem('savedLogId')
              if (logId) router.push(`/history/${logId}`)
            }}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-[0.96] active:brightness-95"
              style={{ background: 'hsla(0,0%,100%,.6)', border: '0.5px solid hsla(0,0%,100%,.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', boxShadow: '0 3px 12px -3px hsla(0,10%,15%,.12), 0 1px 3px -1px hsla(0,10%,15%,.08)' }}
            >
              <span className="material-symbols-outlined text-stone-600" style={{ fontSize: '22px' }}>description</span>
            </span>
            <span className="text-[11px] font-semibold text-stone-500">기록 보기</span>
          </button>

          <button
            onClick={() => {
              localStorage.removeItem('savedLogId')
              router.push('/home')
            }}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-[0.96] active:brightness-95"
              style={{ background: 'hsla(0,0%,100%,.6)', border: '0.5px solid hsla(0,0%,100%,.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', boxShadow: '0 3px 12px -3px hsla(0,10%,15%,.12), 0 1px 3px -1px hsla(0,10%,15%,.08)' }}
            >
              <span className="material-symbols-outlined text-stone-600" style={{ fontSize: '22px' }}>home</span>
            </span>
            <span className="text-[11px] font-semibold text-stone-500">홈으로</span>
          </button>
        </div>
      </main>

      {/* 레벨업 보상 애니메이션 */}
      {pendingReward && <SteamCardReveal reward={pendingReward} onComplete={() => setPendingReward(null)} />}
    </div>
  )
}
