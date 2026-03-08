/**
 * 장소 병합 확인 모달
 * 50m 이내 기존 장소가 있을 때, 유저에게 같은 장소인지 확인
 */
'use client'

import { useState } from 'react'
import type { Place } from '@/types'

interface PlaceMergeModalProps {
  candidates: Place[]
  newPlaceName: string
  onMerge: (placeId: string) => void
  onNewPlace: () => void
  onCancel: () => void
}

export default function PlaceMergeModal({
  candidates,
  newPlaceName,
  onMerge,
  onNewPlace,
  onCancel,
}: PlaceMergeModalProps) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const selected = candidates[selectedIdx]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      {/* 모달 본체 */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[320px] p-6">
        <p className="text-sm font-semibold text-stone-700 text-center mb-1">
          근처에 등록된 장소가 있어요
        </p>
        <p className="text-xs text-stone-400 text-center mb-4">
          &ldquo;{newPlaceName}&rdquo;과(와) 같은 장소인가요?
        </p>

        {/* 후보 목록 */}
        <div className="space-y-2 mb-5">
          {candidates.map((candidate, idx) => (
            <button
              key={candidate.id}
              onClick={() => setSelectedIdx(idx)}
              className={`
                w-full p-3 rounded-xl text-left transition-all border-2
                ${idx === selectedIdx
                  ? 'border-green bg-green-light'
                  : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                }
              `}
              style={idx === selectedIdx ? { borderColor: 'var(--color-green)' } : {}}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className="material-symbols-outlined text-lg mt-0.5"
                  style={{ color: idx === selectedIdx ? 'var(--color-green)' : undefined }}
                >
                  {idx === selectedIdx ? 'check_circle' : 'location_on'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-700 text-sm truncate">
                    {candidate.name}
                  </p>
                  <p className="text-xs text-stone-400 truncate mt-0.5">
                    {candidate.short_address || candidate.address}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onNewPlace}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-stone-500 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            아니요, 새 장소
          </button>
          <button
            onClick={() => onMerge(selected.id)}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--color-green)' }}
          >
            네, 같은 장소
          </button>
        </div>
      </div>
    </div>
  )
}
