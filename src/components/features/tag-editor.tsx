/**
 * TagEditor — 태그 입력/삭제 공용 컴포넌트
 * sa-list 생성/편집에서 재사용
 */

'use client'

import { useState, useCallback, useRef } from 'react'

interface TagEditorProps {
  tags: string[]
  onChange: (tags: string[]) => void
  maxTags?: number
}

export default function TagEditor({ tags, onChange, maxTags = 5 }: TagEditorProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdd = useCallback(() => {
    const tag = input.trim().replace(/^#/, '')
    if (tag && !tags.includes(tag) && tags.length < maxTags) {
      onChange([...tags, tag])
    }
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [input, tags, maxTags, onChange])

  return (
    <div>
      <label className="text-xs text-stone-500 mb-1 block">태그 (최대 {maxTags}개)</label>
      <div className="flex gap-1.5 flex-wrap mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            #{tag}
            <button onClick={() => onChange(tags.filter((t) => t !== tag))} className="hover:opacity-70">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
            </button>
          </span>
        ))}
      </div>
      {tags.length < maxTags && (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 15))}
            placeholder="#노천탕, #겨울여행 ..."
            className="flex-1 glass-input px-3 py-2 text-xs text-stone-700 outline-none"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          />
          <button
            onClick={handleAdd}
            onMouseDown={(e) => e.preventDefault()}
            disabled={!input.trim()}
            className="px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            추가
          </button>
        </div>
      )}
    </div>
  )
}
