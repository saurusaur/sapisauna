'use client'

interface BottomCTAProps {
  onClick: () => void
  disabled?: boolean
  className?: string // 버튼 추가 클래스 (flex, gap 등)
  children: React.ReactNode
}

// 하단 고정 플로팅 CTA 버튼 — 앱 전체 공통 패턴
export default function BottomCTA({ onClick, disabled = false, className = '', children }: BottomCTAProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 pb-6 z-20 pointer-events-none">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`btn-primary ${className}`}
      >
        {children}
      </button>
    </div>
  )
}
