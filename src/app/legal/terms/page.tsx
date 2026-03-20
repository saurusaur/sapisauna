'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TermsPage() {
  const router = useRouter()
  const [text, setText] = useState('')

  useEffect(() => {
    fetch('/legal/terms.md').then(r => r.text()).then(setText)
  }, [])

  return (
    <div className="min-h-dvh bath-tile-bg">
      <header className="p-5 pt-8 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 text-stone-500">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-stone-800">이용약관</h1>
      </header>
      <main className="px-5 pb-12">
        <div className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">{text}</div>
      </main>
    </div>
  )
}
