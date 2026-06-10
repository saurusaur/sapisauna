/**
 * 스토리 카드 뷰어 페이지
 * /story
 *
 * DB 저장 완료 후 진입 — 순수 카드 프리뷰 + 공유/다운로드 도구
 * 프리뷰: 기존 JSX 렌더링 (빠르고 정확)
 * 내보내기: Canvas에서 직접 렌더링 → PNG (서버 왕복 없음)
 *
 * v3 에디토리얼 디자인 (2026-06-09 확정) + v3.1 결정 (2026-06-10):
 *  - 초대형 블리드 히어로(°반잘림, 180px 공통) + 우상 메트릭 라벨 + 좌중 사우나명
 *  - 세로 루틴 타임라인(활동 — 온도 — 시간) + 세트(×N, 높이정렬 보정)
 *  - 오로라 그라데이션 + 그레인(밴딩 방지) + 물결(steam) 워터마크 + 트라이브 점색
 *  - 요약 점수 = 블랙 점 5개(채움/빈 원), 칭호(일반)·닉네임(bold) 잉크 통일
 *  - 긴 루틴: ≤6줄 기본 / 7~8줄 압축 / 초과 시 beyond 제외 → 「+N 활동」 8줄 컷
 *  - 사진 배경: 사진(블러·저채도) 위에 오로라 유지, 흰 베이스만 반투명(.38→.46)
 *  - 목욕파 히어로: 온탕 우선, 루틴상 열탕 시간이 더 길면 열탕
 *  - 온도 미입력(폴백): 물결 마크를 히어로로
 *  - 설계: docs/po/스토리_프로토타입_v3_20260609.html · 결정 데모: docs/po/스토리_개선제안_데모_20260610.html
 *  ⚠️ Canvas 내보내기(image-export.ts)는 별도 미러링 필요 (TODO)
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

// 요일 약어
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

// ── v3 디자인 토큰 ──────────────────────────────────────
// 카드는 1080×1920 native, 프로토타입(300px)의 3.6배 → px() 헬퍼로 변환
const S = 3.6
const px = (n: number) => Math.round(n * S)

const INK = '#1c1917'
const INK_D = 'rgba(28,25,23,0.55)'
const INK_M = 'rgba(28,25,23,0.38)'

const STEAM_MARK = '/logo/sauna-steam-mark.svg'

// 트라이브별 오로라 그라데이션 (밝은 배경 + 다크 잉크)
const AURORA: Record<StoryTribeId, string> = {
  saunner:
    'radial-gradient(120% 85% at 80% 26%, rgba(249,115,22,.82) 0%, rgba(251,146,60,.45) 30%, rgba(255,255,255,0) 62%),' +
    'radial-gradient(90% 70% at 10% 64%, rgba(244,114,182,.42) 0%, rgba(255,255,255,0) 55%),' +
    'linear-gradient(135deg,#fdf6f0 0%, #fff 100%)',
  bather:
    'radial-gradient(120% 85% at 80% 26%, rgba(40,120,160,.8) 0%, rgba(96,165,210,.42) 32%, rgba(255,255,255,0) 64%),' +
    'radial-gradient(90% 70% at 10% 64%, rgba(125,211,222,.45) 0%, rgba(255,255,255,0) 55%),' +
    'linear-gradient(135deg,#eef6fa 0%, #fff 100%)',
  jimi:
    'radial-gradient(120% 85% at 80% 26%, rgba(34,170,90,.78) 0%, rgba(110,200,130,.4) 32%, rgba(255,255,255,0) 64%),' +
    'radial-gradient(90% 70% at 10% 64%, rgba(190,220,140,.45) 0%, rgba(255,255,255,0) 55%),' +
    'linear-gradient(135deg,#f0f8f2 0%, #fff 100%)',
}
// 사진 모드 오버레이: 라디얼 강화 + 흰 베이스만 반투명(.38→.46) — "원래 배경 뒤에 사진이 비치는" 구조 (2026-06-10 확정)
const AURORA_PHOTO: Record<StoryTribeId, string> = {
  saunner:
    'radial-gradient(120% 85% at 80% 26%, rgba(249,115,22,.88) 0%, rgba(251,146,60,.52) 30%, rgba(255,255,255,0) 62%),' +
    'radial-gradient(90% 70% at 10% 64%, rgba(244,114,182,.48) 0%, rgba(255,255,255,0) 55%),' +
    'linear-gradient(135deg,rgba(253,246,240,.38) 0%, rgba(255,255,255,.46) 100%)',
  bather:
    'radial-gradient(120% 85% at 80% 26%, rgba(40,120,160,.86) 0%, rgba(96,165,210,.49) 32%, rgba(255,255,255,0) 64%),' +
    'radial-gradient(90% 70% at 10% 64%, rgba(125,211,222,.52) 0%, rgba(255,255,255,0) 55%),' +
    'linear-gradient(135deg,rgba(238,246,250,.38) 0%, rgba(255,255,255,.46) 100%)',
  jimi:
    'radial-gradient(120% 85% at 80% 26%, rgba(34,170,90,.84) 0%, rgba(110,200,130,.47) 32%, rgba(255,255,255,0) 64%),' +
    'radial-gradient(90% 70% at 10% 64%, rgba(190,220,140,.52) 0%, rgba(255,255,255,0) 55%),' +
    'linear-gradient(135deg,rgba(240,248,242,.38) 0%, rgba(255,255,255,.46) 100%)',
}

// 그레인 노이즈 타일 (그라데이션 밴딩 방지) — SVG feTurbulence
const GRAIN_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"

// 실제 앱 트라이브 컬러 토큰 (점색)
const DOT_COLOR: Record<StoryTribeId, string> = { saunner: '#F97316', bather: '#3B82F6', jimi: '#22C55E' }
const TRIBE_EN: Record<StoryTribeId, string> = { saunner: 'SAUNNER', bather: 'BATHER', jimi: 'JIMI' }
const METRIC_LABEL: Record<StoryTribeId, string> = { saunner: 'TEMP DELTA', bather: 'BATH TEMP', jimi: 'JJIMJIL TEMP' }
const SCORE_LABEL: Record<StoryTribeId, string> = { saunner: 'TOTONOU', bather: 'WATER', jimi: 'SWEAT' }

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

  // Canvas 기반 내보내기 (서버 호출 없음)
  // ⚠️ renderCard(Canvas)는 아직 구버전 레이아웃 — v3 미러링 TODO
  const handleExport = async (mode: 'download' | 'share') => {
    if (!log) return
    setIsExporting(true)
    try {
      const blob = await renderCard({
        tribeId: log.tribe_id as StoryTribeId,
        placeName: log.place_name,
        date: log.date,
        bgPhoto,
        saunaTemp: log.dry_sauna_temp ?? log.sauna_temp,
        steamSaunaTemp: log.steam_sauna_temp,
        primarySaunaKind: log.primary_sauna_kind,
        coldBathTemp: log.cold_bath_temp,
        hotBathTemp: log.hot_bath_temp,
        jjimTemp: getJimiHeadlineTemp(log) ?? undefined,
        totono_score: log.totono_score,
        waterQuality: log.water_quality,
        sweatQuality: log.sweat_quality,
        heatTime: log.heat_time,
        iceTime: log.ice_time,
        pauseTime: log.rest_time,
        repeat: log.repeat,
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

  const formatTopDate = () => {
    if (!log) return ''
    const d = new Date(log.date)
    const dateStr = log.date.slice(0, 10).replace(/-/g, '.')
    return `${dateStr} ${DAY_NAMES[d.getDay()]}`
  }

  if (isLoading || !log) {
    return (
      <div className="min-h-dvh bath-tile-bg flex items-center justify-center">
        <ContentLoader />
      </div>
    )
  }

  const tribe = (log.tribe_id as StoryTribeId) in AURORA ? (log.tribe_id as StoryTribeId) : 'saunner'

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
    return getJimiHeadlineTemp(log)
  })()

  // 요약줄 점수 (트라이브 시그니처 품질)
  const nowScoreVal = tribe === 'saunner' ? log.totono_score : tribe === 'bather' ? log.water_quality : log.sweat_quality

  // 루틴 타임라인 (블록 seq 순) + 오버플로 규칙 (2026-06-10 확정)
  // 줄 수(활동+세트) 기준: ≤6 기본 / 7~8 압축(11.5px·행간 1.58) / >8 beyond 제외 → 그래도 넘으면 활동 + 「+N 활동」 + 세트 = 8줄 컷
  const repeat = log.repeat ?? 0
  const setLine = repeat > 1 ? 1 : 0
  const allLines = (log.blocks ?? []).slice().sort((a, b) => a.seq - b.seq).map(blockLine)
  let routineLines = allLines
  let hiddenCount = 0
  if (routineLines.length + setLine > 8) {
    routineLines = allLines.filter((ln) => !ln.beyond) // beyond(세신/매점 등) 우선 제외
    if (routineLines.length + setLine > 8) {
      const visible = 8 - setLine - 1 // 「+N 활동」 줄 포함 총 8줄
      hiddenCount = allLines.length - visible // 숨김 = 전체 - 표시 (beyond 포함)
      routineLines = routineLines.slice(0, visible)
    }
  }
  // 압축 모드: 표시 줄 수(활동 + +N + 세트)가 7줄 이상일 때
  const dense = routineLines.length + (hiddenCount > 0 ? 1 : 0) + setLine > 6

  const fallbackHero = heroTemp == null

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
              width: 1080,
              height: 1920,
              transform: `scale(${cardScale})`,
              transformOrigin: 'top center',
              borderRadius: px(26),
              boxShadow: '0 24px 80px rgba(0,0,0,0.35), 0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.06)',
              background: bgPhoto ? undefined : AURORA[tribe],
            }}
          >
            {/* 사진 모드: 사진(블러·저채도 .55) 뒤 + 오로라 오버레이(흰 베이스만 반투명) */}
            {bgPhoto && (
              <>
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${bgPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center',
                    filter: 'blur(7px) saturate(0.55)', transform: 'scale(1.04)',
                  }}
                />
                <div style={{ position: 'absolute', inset: 0, background: AURORA_PHOTO[tribe] }} />
              </>
            )}
            {/* 그레인 (그라데이션 밴딩 방지) */}
            <div
              style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.07, mixBlendMode: 'multiply',
                backgroundImage: `url("${GRAIN_URI}")`, backgroundSize: `${px(240)}px ${px(240)}px`,
              }}
            />

            {/* 상단: 좌=날짜 / 우=메트릭 라벨 */}
            <div style={{ position: 'absolute', left: px(26), right: px(26), top: px(28), display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: px(11), fontWeight: 700, letterSpacing: '0.08em', color: INK }}>{formatTopDate()}</span>
              <span style={{ fontSize: px(11), fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', textAlign: 'right', color: INK, maxWidth: px(130) }}>
                {fallbackHero ? '' : METRIC_LABEL[tribe]}
              </span>
            </div>

            {/* 히어로: 온도 대형(°반잘림) 또는 물결 마크 폴백 */}
            {fallbackHero ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={STEAM_MARK} alt="" style={{ position: 'absolute', right: px(8), top: px(46), width: px(150), opacity: 0.88 }} />
            ) : (
              <div
                className="font-heading"
                style={{
                  position: 'absolute', right: px(-6), top: px(46), fontWeight: 700, fontSize: px(180),
                  lineHeight: 0.84, letterSpacing: '-0.03em',
                  backgroundImage: 'linear-gradient(160deg,#3a3330 0%, #1c1917 55%)',
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                }}
              >
                {heroTemp}
                <span style={{ fontSize: px(49), verticalAlign: 'top', marginLeft: px(2) }}>°</span>
              </div>
            )}

            {/* 좌중: 사우나명 */}
            <div style={{ position: 'absolute', left: px(26), top: px(214), fontWeight: 700, fontSize: px(12.5), lineHeight: 1, letterSpacing: '0.01em', color: INK, maxWidth: px(200) }}>
              {log.place_name}
            </div>

            {/* 루틴 타임라인 + (+N 활동) + 세트 + 요약 점수(블랙 점 5개) */}
            <div style={{ position: 'absolute', left: px(26), top: px(240), right: px(26) }}>
              {routineLines.map((ln, i) => (
                <div key={i} style={{ fontSize: px(dense ? 11.5 : 12.5), lineHeight: dense ? 1.58 : 1.9, letterSpacing: '0.01em', color: INK }}>
                  <span style={{ fontWeight: 700 }}>{ln.name}</span>
                  {ln.parts.map((p, j) => (
                    <span key={j}>
                      <span style={{ margin: `0 ${px(6)}px`, color: INK_M }}>—</span>
                      {p}
                    </span>
                  ))}
                </div>
              ))}
              {hiddenCount > 0 && (
                <div style={{ fontSize: px(11.5), lineHeight: 1.58, color: INK }}>+ {hiddenCount} 활동</div>
              )}
              {repeat > 1 && (
                <div style={{ fontSize: px(dense ? 11.5 : 12.5), lineHeight: dense ? 1.58 : 1.9, letterSpacing: '0.01em', color: INK }}>
                  <span style={{ fontWeight: 700 }}>세트</span>
                  {/* ×는 살짝 내려 숫자와 높이 정렬 */}
                  <span style={{ margin: `0 ${px(6)}px`, color: INK_M, fontWeight: 300, fontSize: px(15), verticalAlign: px(-1) }}>×</span>
                  {repeat}
                </div>
              )}
              {nowScoreVal != null && (
                <div style={{ display: 'flex', alignItems: 'center', fontSize: px(12), fontWeight: 700, marginTop: px(dense ? 9 : 12), color: INK }}>
                  {SCORE_LABEL[tribe]}
                  <span style={{ display: 'inline-flex', marginLeft: px(8), gap: px(4) }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        style={{
                          width: px(7), height: px(7), borderRadius: '50%',
                          ...(n <= nowScoreVal ? { background: INK } : { border: `2px solid ${INK}` }),
                        }}
                      />
                    ))}
                  </span>
                </div>
              )}
            </div>

            {/* 워터마크: 물결 마크 (연하게) — 폴백(히어로 물결)일 땐 생략 */}
            {!fallbackHero && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={STEAM_MARK} alt="" style={{ position: 'absolute', right: px(12), bottom: px(44), width: px(40), opacity: 0.11 }} />
            )}

            {/* 하단: 트라이브명 + 점·SA-PI / 닉네임 */}
            <div style={{ position: 'absolute', left: px(26), right: px(26), bottom: px(26) }}>
              <div className="font-heading" style={{ fontSize: px(32), fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.01em', color: INK }}>
                {TRIBE_EN[tribe]}
              </div>
              {/* SA-PI·칭호·닉네임 잉크 통일 — 칭호=일반(400), 닉네임=bold(700) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: px(11), fontWeight: 700, letterSpacing: '0.06em', marginTop: px(7) }}>
                <span style={{ color: INK }}>
                  <span style={{ display: 'inline-block', width: px(11), height: px(11), borderRadius: '50%', background: DOT_COLOR[tribe], marginRight: px(7), verticalAlign: 'middle' }} />
                  SA-PI
                </span>
                <span style={{ color: INK }}>
                  {log.user_title && <span style={{ fontWeight: 400 }}>{log.user_title} · </span>}
                  <span style={{ fontWeight: 700 }}>{log.user_nickname || 'SA-PIEN'}</span>
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
            <button onClick={() => handleExport('download')} disabled={isExporting} className="flex flex-col items-center gap-1.5 disabled:opacity-50">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white transition-all hover:scale-105 active:scale-[0.96] active:brightness-90"
                style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 4px 16px rgba(204,26,26,0.35), 0 2px 6px rgba(0,0,0,0.15)' }}>
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
            <button onClick={() => handleExport('share')} disabled={isExporting} className="flex flex-col items-center gap-1.5 disabled:opacity-50">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white transition-all hover:scale-105 active:scale-[0.96] active:brightness-90"
                style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 4px 16px rgba(204,26,26,0.35), 0 2px 6px rgba(0,0,0,0.15)' }}>
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
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white transition-all hover:scale-105 active:scale-[0.96] active:brightness-90"
              style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 4px 16px rgba(204,26,26,0.35), 0 2px 6px rgba(0,0,0,0.15)' }}>
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
      {pendingReward && <SteamCardReveal reward={pendingReward} onComplete={() => setPendingReward(null)} />}
    </div>
  )
}
