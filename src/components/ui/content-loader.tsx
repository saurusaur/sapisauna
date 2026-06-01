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
  // 웹폰트(Material Symbols)에 의존하지 않는 순수 CSS 스피너.
  // ligature 폰트가 로드되기 전 "progress_activity" 글자가 노출되는 FOUT를 원천 차단.
  const spinner = size === 'small' ? 'w-5 h-5 border-2' : 'w-8 h-8 border-[3px]'
  return (
    <div className={`flex justify-center ${padding} ${className}`} role="status" aria-label="로딩 중">
      <span className={`${spinner} rounded-full border-stone-200 border-t-stone-400 animate-spin`} />
    </div>
  )
}
