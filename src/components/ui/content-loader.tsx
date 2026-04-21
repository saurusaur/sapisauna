/**
 * 공용 콘텐츠 로더 — 페이지 main 영역 또는 시트 내부 로딩 스피너
 * size prop 으로 padding/아이콘 크기 조절
 */

interface Props {
  size?: 'small' | 'default'
  className?: string
}

export default function ContentLoader({ size = 'default', className = '' }: Props) {
  const padding = size === 'small' ? 'py-6' : 'py-16'
  const iconSize = size === 'small' ? 'text-xl' : 'text-3xl'
  return (
    <div className={`flex justify-center ${padding} ${className}`} role="status" aria-label="로딩 중">
      <span className={`material-symbols-outlined ${iconSize} text-stone-300 animate-spin`}>
        progress_activity
      </span>
    </div>
  )
}
