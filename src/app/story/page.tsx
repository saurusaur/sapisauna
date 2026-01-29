'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { STORY_TEMPLATES, MESSAGES } from '@/constants/content'

export default function StoryTemplateSelect() {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState('minimal')

  const templates = Object.values(STORY_TEMPLATES)

  const handleNext = () => {
    localStorage.setItem('selectedTemplate', selectedTemplate)
    router.push('/story/edit')
  }

  return (
    <div className="min-h-screen bath-tile-bg">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 text-stone-500 hover:text-stone-700 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-stone-700">스토리 만들기</h1>
      </header>

      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-stone-700 mb-1">{MESSAGES.STORY.SELECT_TEMPLATE}</h2>
          <p className="text-sm text-stone-400">마지막 사용 템플릿이 기본 선택</p>
        </div>

        {/* 템플릿 그리드 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`
                relative p-4 rounded-2xl text-center transition-all
                ${selectedTemplate === template.id
                  ? 'ring-3 ring-green scale-[1.02]'
                  : 'bg-white shadow-sm hover:shadow-md'
                }
              `}
              style={{
                backgroundColor: template.id === 'dark' ? '#1f1f1f' :
                                 template.id === 'gradient' ? '#e0f2fe' :
                                 template.id === 'retro' ? '#fef3c7' : '#ffffff',
              }}
            >
              {/* 템플릿 미리보기 */}
              <div
                className="h-24 mb-3 rounded-lg flex items-center justify-center text-2xl font-bold"
                style={{
                  color: template.id === 'dark' ? '#ffffff' :
                         template.id === 'gradient' ? '#0369a1' :
                         template.id === 'retro' ? '#92400e' : '#374151',
                }}
              >
                {template.nameKo}
              </div>

              <span
                className={`text-sm font-medium ${template.id === 'dark' ? 'text-gray-300' : 'text-stone-500'}`}
              >
                {template.name}
              </span>

              {/* 선택 표시 */}
              {selectedTemplate === template.id && (
                <div
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-green)' }}
                >
                  <span className="material-symbols-outlined text-white text-sm">check</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* 다음 버튼 */}
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all"
          style={{ backgroundColor: 'var(--color-green)' }}
        >
          다음
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </main>
    </div>
  )
}
