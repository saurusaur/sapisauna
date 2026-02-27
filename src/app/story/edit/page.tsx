/**
 * 스토리 에디터 — 풀스크린 몰입형
 * /story/edit
 *
 * 모든 스티커는 라이브 React 컴포넌트로 렌더링
 * (내보내기는 /story 프리뷰에서 captureCard()로 처리 — html-to-image가 SVG 포함 DOM을 캡처)
 * 완료 → sessionStorage에 상태 저장 후 /story(프리뷰)로 복귀
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/user-context'
import type { LogData } from '@/components/story-editor/sticker-content'
import EditorCanvas from '@/components/story-editor/editor-canvas'
import type { BackgroundState } from '@/components/story-editor/editor-canvas'
import EditorToolbar from '@/components/story-editor/editor-toolbar'
import StickerDrawer from '@/components/story-editor/sticker-drawer'
import BackgroundPicker from '@/components/story-editor/background-picker'
import CropModal from '@/components/story-editor/crop-modal'
import type { Sticker, StickerType } from '@/lib/sticker-templates'
import { getDefaultStickers, generateStickerId, TRIBE_BG_MAP, TRIBE_TINT_MAP } from '@/lib/sticker-templates'
import { useRef } from 'react'

// sessionStorage 키
const EDITOR_STATE_KEY = 'story-editor-state'

export type EditorSessionState = {
  stickers: Sticker[]
  background: BackgroundState
  isDirty: boolean
}

export default function StoryEditor() {
  const router = useRouter()
  const { user } = useUser()

  const [log, setLog] = useState<LogData | null>(null)
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [background, setBackground] = useState<BackgroundState>({ type: 'solid', color: '#c25c4a' })
  const [isDragging, setIsDragging] = useState(false)
  const [showStickerDrawer, setShowStickerDrawer] = useState(false)
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false)
  const [cropImage, setCropImage] = useState<string | null>(null)

  // comment 편집 모달
  const [commentEditId, setCommentEditId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const commentInputRef = useRef<HTMLInputElement>(null)

  // ── 초기화: 로그 로드 + sessionStorage 복원 또는 새 스티커 생성 ──
  useEffect(() => {
    const logData = localStorage.getItem('currentLog')
    if (!logData) {
      router.push('/story')
      return
    }

    const parsed: LogData = JSON.parse(logData)
    setLog(parsed)

    // sessionStorage에 이전 에디터 상태가 있으면 복원
    const savedState = sessionStorage.getItem(EDITOR_STATE_KEY)
    if (savedState) {
      try {
        const state: EditorSessionState = JSON.parse(savedState)
        // imageUrl은 모두 클리어 — 라이브 컴포넌트로 최신 데이터 반영
        const refreshedStickers = state.stickers.map(s => ({ ...s, imageUrl: undefined }))
        setStickers(refreshedStickers)
        setBackground(state.background)
        return
      } catch {
        // 파싱 실패 → 새로 시작
      }
    }

    // 새 세션: 기본 스티커 + tribe 배경
    const tribeBg = TRIBE_BG_MAP[parsed.tribe_id] || '#c25c4a'
    setStickers(getDefaultStickers(parsed.tribe_id))
    setBackground({ type: 'solid', color: tribeBg })
  }, [router])

  // ── 스티커 조작 ──

  const handleStickerUpdate = useCallback((id: string, updates: Partial<Sticker>) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }, [])

  const handleStickerDelete = useCallback((id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id))
    if (selectedId === id) setSelectedId(null)
  }, [selectedId])

  const handleAddSticker = useCallback((type: StickerType, text?: string) => {
    const newSticker: Sticker = {
      id: generateStickerId(),
      type,
      x: 50, y: 50,
      scale: 1, rotation: 0,
      ...(text !== undefined ? { text } : {}),
    }
    setStickers(prev => [...prev, newSticker])
    setSelectedId(newSticker.id)
  }, [])

  const handleRotate = useCallback(() => {
    if (!selectedId) return
    setStickers(prev => prev.map(s => {
      if (s.id !== selectedId) return s
      const nextRotation = ((s.rotation + 90) % 360) as 0 | 90 | 180 | 270
      return { ...s, rotation: nextRotation }
    }))
  }, [selectedId])

  const handleDeleteSelected = useCallback(() => {
    if (selectedId) handleStickerDelete(selectedId)
  }, [selectedId, handleStickerDelete])

  // ── 배경 ──

  const handleBackgroundChange = useCallback((bg: BackgroundState) => {
    setBackground(bg)
  }, [])

  const handleCropConfirm = useCallback((croppedUrl: string) => {
    if (!log) return
    const tintHsl = TRIBE_TINT_MAP[log.tribe_id] || TRIBE_TINT_MAP.saunner
    // rawImageUrl 보존 (재크롭용)
    const rawUrl = cropImage || (background.type === 'image' ? background.rawImageUrl : undefined)
    setBackground({ type: 'image', imageUrl: croppedUrl, rawImageUrl: rawUrl || croppedUrl, tintHsl, saturation: 50 })
    setCropImage(null)
  }, [log, cropImage, background])

  // ── 완료 (Done) → sessionStorage 저장 후 /story로 복귀 ──

  const handleDone = useCallback(() => {
    const state: EditorSessionState = {
      stickers,
      background,
      isDirty: true,
    }
    sessionStorage.setItem(EDITOR_STATE_KEY, JSON.stringify(state))
    router.push('/story')
  }, [stickers, background, router])

  // ── 뒤로가기 ──

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  // ── comment 편집 ──

  const openCommentEdit = useCallback((id: string) => {
    const sticker = stickers.find(s => s.id === id)
    if (!sticker || sticker.type !== 'comment') return
    setCommentEditId(id)
    setCommentText(sticker.text || '')
    setTimeout(() => commentInputRef.current?.focus(), 100)
  }, [stickers])

  const confirmCommentEdit = useCallback(() => {
    if (!commentEditId) return
    handleStickerUpdate(commentEditId, { text: commentText })
    setCommentEditId(null)
    setCommentText('')
  }, [commentEditId, commentText, handleStickerUpdate])

  const handleStickerSelect = useCallback((id: string | null) => {
    if (id && id === selectedId) {
      const sticker = stickers.find(s => s.id === id)
      if (sticker?.type === 'comment') {
        openCommentEdit(id)
        return
      }
    }
    setSelectedId(id)
  }, [selectedId, stickers, openCommentEdit])

  // ── 렌더링 ──

  if (!log) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <p className="text-stone-400">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-stone-950 flex flex-col">
      {/* ── 플로팅 헤더 (뒤로 + 완료) ── */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4">
        <button
          onClick={handleBack}
          className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white/80 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <button
          onClick={handleDone}
          className="px-5 py-2 rounded-full font-semibold text-white text-sm transition-all hover:opacity-90
            bg-black/30 backdrop-blur-sm"
        >
          완료
        </button>
      </header>

      {/* ── 캔버스: 풀스크린 (9:16 비율, 뷰포트 내 최대 크기) ── */}
      <main className="flex-1 flex items-center justify-center overflow-hidden">
        <EditorCanvas
          log={log}
          nickname={user?.nickname}
          stickers={stickers}
          selectedId={selectedId}
          background={background}
          isDragging={isDragging}
          className="relative w-full mx-auto"
          onStickerSelect={handleStickerSelect}
          onStickerUpdate={handleStickerUpdate}
          onStickerDelete={handleStickerDelete}
          onDragStateChange={setIsDragging}
        />
      </main>

      {/* ── 하단 툴바 (프로스트 글래스) ── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-black/40 backdrop-blur-sm">
        <EditorToolbar
          selectedStickerId={selectedId}
          onOpenBackground={() => setShowBackgroundPicker(true)}
          onOpenStickers={() => setShowStickerDrawer(true)}
          onRotate={handleRotate}
          onDelete={handleDeleteSelected}
        />
      </div>

      {/* 스티커 드로어 */}
      <StickerDrawer
        isOpen={showStickerDrawer}
        onClose={() => setShowStickerDrawer(false)}
        onAdd={handleAddSticker}
        log={log}
        nickname={user?.nickname}
        existingStickers={stickers}
      />

      {/* 배경 피커 */}
      <BackgroundPicker
        isOpen={showBackgroundPicker}
        onClose={() => setShowBackgroundPicker(false)}
        background={background}
        onBackgroundChange={handleBackgroundChange}
        onCropRequest={(url) => setCropImage(url)}
        tribeId={log.tribe_id}
        tintHsl={TRIBE_TINT_MAP[log.tribe_id] || TRIBE_TINT_MAP.saunner}
      />

      {/* 크롭 모달 */}
      {cropImage && (
        <CropModal
          imageUrl={cropImage}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropImage(null)}
        />
      )}

      {/* comment 편집 모달 */}
      {commentEditId && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50" onClick={() => confirmCommentEdit()}>
          <div
            className="w-full max-w-md bg-stone-900 rounded-t-2xl p-4 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <input
                ref={commentInputRef}
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') confirmCommentEdit() }}
                placeholder="코멘트를 입력하세요"
                className="flex-1 bg-stone-800 text-white text-sm rounded-xl px-4 py-3
                  border border-stone-700 focus:border-stone-500 focus:outline-none"
                style={{ fontFamily: 'var(--font-serif)' }}
              />
              <button
                onClick={confirmCommentEdit}
                className="px-4 py-3 rounded-xl text-white text-sm font-medium"
                style={{ backgroundColor: 'var(--color-green)' }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
