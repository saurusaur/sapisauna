/**
 * ListFormSheet — 리스트 생성/편집 공용 폼 컴포넌트
 * 순수 폼만 렌더링 (BottomSheet 포함 안 함)
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { usePlaceSearch } from '@/hooks/use-places'
import TagEditor from '@/components/features/tag-editor'

export interface SelectedPlace {
  id: string
  name: string
  address: string
  short_address?: string
  memo: string
}

/** 고정 팔레트 — 웜 스톤·슬레이트·테라코타·세이지·네이비 톤 (첫 색이 기본값) */
export const COVER_COLOR_PALETTE = [
  '#c4a574',
  '#5c5348',
  '#3d4a5c',
  '#2f3d4f',
  '#7a8f78',
  '#6e6246',
  '#b85c38',
  '#8f6b5a',
  '#7d6b5e',
] as const

export const DEFAULT_LIST_COVER_COLOR = COVER_COLOR_PALETTE[0]

/** 커버 이모지 후보 — 플레이리스트 커버에서만 사용 (트라이브 선택 UI와 별개) */
export const COVER_EMOJI_CHOICES = ['🔥', '♨️', '🧖', '🛁', '✨', '🌿', '💧', '🪨'] as const

interface ListFormSheetProps {
  mode: 'create' | 'edit'
  initialData?: {
    title: string
    tags: string[]
    description: string
    cover_color?: string | null
    cover_emoji?: string | null
  }
  onSubmit: (data: {
    title: string
    tags: string[]
    description: string
    cover_color: string
    cover_emoji: string | null
    places?: SelectedPlace[]
  }) => Promise<void>
  /** For unsaved changes detection — parent calls this to check */
  onDirtyChange?: (isDirty: boolean) => void
  submitLabel?: string
}

const MAX_TITLE_LENGTH = 20
const MAX_MEMO_LENGTH = 100
const MAX_DESC_LENGTH = 140

function effectiveInitialCoverColor(cover_color: string | null | undefined): string {
  if (cover_color == null || cover_color === '') return DEFAULT_LIST_COVER_COLOR
  return cover_color
}

const PALETTE_HEX = COVER_COLOR_PALETTE as readonly string[]

/** 밝은 스와치는 어두운 체크 아이콘 */
function checkIconClassForHex(hex: string): string {
  const h = hex.toLowerCase()
  const light = ['#c4a574', '#7a8f78', '#7d6b5e']
  return light.includes(h) ? 'text-stone-900' : 'text-white'
}

export default function ListFormSheet({
  mode,
  initialData,
  onSubmit,
  onDirtyChange,
  submitLabel,
}: ListFormSheetProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [desc, setDesc] = useState(initialData?.description || '')
  const [coverColor, setCoverColor] = useState(() => effectiveInitialCoverColor(initialData?.cover_color))
  const baselineEmoji = mode === 'edit' ? (initialData?.cover_emoji ?? null) : null
  const [coverEmoji, setCoverEmoji] = useState<string | null>(() => baselineEmoji)
  const [submitting, setSubmitting] = useState(false)

  // Create mode only
  const [selectedPlaces, setSelectedPlaces] = useState<SelectedPlace[]>([])
  const [placeQuery, setPlaceQuery] = useState('')
  const { results: placeResults, loading: placeSearchLoading, search: searchPlace } = usePlaceSearch()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const baselineCover = effectiveInitialCoverColor(initialData?.cover_color)

  // Dirty detection
  useEffect(() => {
    const emojiDirty = (coverEmoji ?? null) !== baselineEmoji
    const isDirty = title !== (initialData?.title || '')
      || JSON.stringify(tags) !== JSON.stringify(initialData?.tags || [])
      || desc !== (initialData?.description || '')
      || coverColor !== baselineCover
      || emojiDirty
      || selectedPlaces.length > 0
    onDirtyChange?.(isDirty)
  }, [title, tags, desc, coverColor, baselineCover, coverEmoji, baselineEmoji, selectedPlaces, initialData, onDirtyChange])

  // Place search with debounce (create mode only)
  useEffect(() => {
    if (mode !== 'create' || !placeQuery || placeQuery.length < 2) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchPlace(placeQuery), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [placeQuery, mode, searchPlace])

  const selectedIds = new Set(selectedPlaces.map((p) => p.id))
  const filteredPlaceResults = placeResults.filter((p) => !selectedIds.has(p.id)).slice(0, 8)

  // Submit handler
  const handleSubmit = useCallback(async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return
    setSubmitting(true)
    try {
      await onSubmit({
        title: trimmedTitle,
        tags,
        description: desc.trim(),
        cover_color: coverColor,
        cover_emoji: coverEmoji,
        places: mode === 'create' && selectedPlaces.length > 0 ? selectedPlaces : undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }, [title, tags, desc, coverColor, coverEmoji, selectedPlaces, mode, onSubmit])

  // Dynamic submit label
  const getButtonLabel = () => {
    if (submitting) return mode === 'create' ? '만드는 중...' : '저장 중...'
    if (submitLabel && submitLabel === '만들기' && selectedPlaces.length > 0) {
      return `${selectedPlaces.length}곳과 함께 만들기`
    }
    return submitLabel || (mode === 'create' ? '만들기' : '저장')
  }

  return (
    <div className="space-y-3">
      {/* 1. 이름 */}
      <div>
        <label className="text-xs text-stone-500 mb-1 block">이름 *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
          placeholder="리스트 이름 (최대 20자)"
          autoFocus={mode === 'create'}
          className="w-full glass-input px-4 py-2.5 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-stone-200"
        />
        <p className="text-right text-[10px] text-stone-400 mt-1">
          {title.length}/{MAX_TITLE_LENGTH}
        </p>
      </div>

      {/* 2. 커버 색 */}
      <div>
        <label className="text-xs text-stone-500 mb-1.5 block">커버 색</label>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5 scrollbar-hide">
          {initialData?.cover_color
            && !PALETTE_HEX.includes(initialData.cover_color) && (
            <button
              type="button"
              onClick={() => setCoverColor(initialData.cover_color!)}
              className={`flex-shrink-0 w-9 h-9 rounded-full border-2 transition-shadow flex items-center justify-center ${
                coverColor === initialData.cover_color
                  ? 'border-stone-700 ring-2 ring-stone-300 ring-offset-2 ring-offset-white'
                  : 'border-stone-200'
              }`}
              style={{ backgroundColor: initialData.cover_color }}
              title="현재 저장된 색"
            >
              {coverColor === initialData.cover_color && (
                <span className={`material-symbols-outlined drop-shadow-sm ${checkIconClassForHex(initialData.cover_color)}`} style={{ fontSize: '18px' }}>
                  check
                </span>
              )}
            </button>
          )}
          {COVER_COLOR_PALETTE.map((hex) => {
            const selected = coverColor === hex
            return (
              <button
                key={hex}
                type="button"
                onClick={() => setCoverColor(hex)}
                className={`flex-shrink-0 w-9 h-9 rounded-full border-2 transition-shadow flex items-center justify-center ${
                  selected
                    ? 'border-stone-700 ring-2 ring-stone-300 ring-offset-2 ring-offset-white'
                    : 'border-stone-200'
                }`}
                style={{ backgroundColor: hex }}
                aria-label={`커버 색 ${hex}`}
              >
                {selected && (
                  <span className={`material-symbols-outlined drop-shadow-sm ${checkIconClassForHex(hex)}`} style={{ fontSize: '18px' }}>
                    check
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 2b. 커버 이모지 (선택) — 플리 커버용으로만 사용 */}
      <div>
        <label className="text-xs text-stone-500 mb-1.5 block">커버 이모지 (선택)</label>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={() => setCoverEmoji(null)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
              coverEmoji === null
                ? 'border-stone-700 bg-stone-100 text-stone-800'
                : 'border-stone-200 text-stone-500 hover:border-stone-300'
            }`}
          >
            없음
          </button>
          {COVER_EMOJI_CHOICES.map((emo) => (
            <button
              key={emo}
              type="button"
              onClick={() => setCoverEmoji(emo)}
              className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-shadow ${
                coverEmoji === emo
                  ? 'border-stone-700 ring-2 ring-stone-300 ring-offset-1 ring-offset-white'
                  : 'border-stone-200 hover:border-stone-300 bg-white'
              }`}
              aria-label={`이모지 ${emo}`}
            >
              {emo}
            </button>
          ))}
        </div>
      </div>

      {/* 3. 태그 */}
      <TagEditor tags={tags} onChange={setTags} />

      {/* 4. 설명 */}
      <div>
        <label className="text-xs text-stone-500 mb-1 block">설명</label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value.slice(0, MAX_DESC_LENGTH))}
          rows={2}
          className="w-full glass-input px-4 py-2.5 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-stone-200 resize-none"
          placeholder="리스트에 대한 설명 (선택)"
        />
        <p className="text-right text-[10px] text-stone-400 mt-1">
          {desc.length}/{MAX_DESC_LENGTH}
        </p>
      </div>

      {/* 5. 장소 추가 — create mode only */}
      {mode === 'create' && (
        <div>
          <label className="text-xs text-stone-500 mb-1 block">장소 추가 (선택)</label>

          {/* 선택된 장소 미니카드 */}
          {selectedPlaces.length > 0 && (
            <div className="space-y-2 mb-3">
              {selectedPlaces.map((place) => (
                <div key={place.id} className="glass-card-light p-3 rounded-xl">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-stone-700 truncate">{place.name}</p>
                      <p className="text-[10px] text-stone-400 truncate">{place.short_address || place.address}</p>
                    </div>
                    <button
                      onClick={() => setSelectedPlaces((prev) => prev.filter((p) => p.id !== place.id))}
                      className="text-stone-400 hover:text-stone-600 flex-shrink-0"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={place.memo}
                    onChange={(e) => {
                      const val = e.target.value.slice(0, MAX_MEMO_LENGTH)
                      setSelectedPlaces((prev) =>
                        prev.map((p) => p.id === place.id ? { ...p, memo: val } : p)
                      )
                    }}
                    placeholder="메모 (선택, 최대 100자)"
                    className="mt-2 w-full glass-input px-3 py-2 text-xs text-stone-700 outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {/* 검색 입력 */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-base">search</span>
            <input
              type="text"
              value={placeQuery}
              onChange={(e) => setPlaceQuery(e.target.value)}
              placeholder="장소명 또는 주소 검색"
              className="w-full pl-9 pr-4 py-2.5 glass-input text-xs text-stone-700 outline-none"
            />
          </div>

          {/* 검색 결과 */}
          {placeQuery.length >= 2 && (
            <div className="mt-1.5 space-y-0.5 max-h-[25vh] overflow-y-auto">
              {placeSearchLoading ? (
                <p className="py-3 text-center text-stone-400 text-xs">검색 중...</p>
              ) : filteredPlaceResults.length === 0 ? (
                <p className="py-3 text-center text-stone-400 text-xs">검색 결과가 없어요</p>
              ) : (
                filteredPlaceResults.map((place) => (
                  <button
                    key={place.id}
                    onClick={() => {
                      setSelectedPlaces((prev) => [...prev, {
                        id: place.id,
                        name: place.name,
                        address: place.address,
                        short_address: place.short_address,
                        memo: '',
                      }])
                      setPlaceQuery('')
                    }}
                    className="w-full flex items-center gap-2 py-2.5 px-1 rounded-lg hover:bg-stone-50 text-left transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-700 truncate">{place.name}</p>
                      <p className="text-xs text-stone-400 truncate">{place.short_address || place.address}</p>
                    </div>
                    <span className="material-symbols-outlined text-sm flex-shrink-0" style={{ color: 'var(--color-primary)' }}>add_circle</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!title.trim() || submitting}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {getButtonLabel()}
      </button>
    </div>
  )
}
