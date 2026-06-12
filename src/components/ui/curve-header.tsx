/**
 * 곡선 헤더 — 평면 컬러 블록 + 하단 곡선 SVG.
 * 홈(레드)·사리스트 메인(레드)·리스트 디테일(cover_hue 파스텔)이 공유하는 시그니처 헤더.
 * 곡선 path는 홈 원본(home/page.tsx) 그대로, 블록과 8px 겹쳐 이음새를 없앤다.
 */
interface CurveHeaderProps {
  /** 블록+곡선 색. CSS 변수('var(--color-primary)')나 hex 모두 가능 */
  color: string
  /** 평면 블록 높이(px). 곡선은 height-8 위치에서 시작 */
  height: number
}

export default function CurveHeader({ color, height }: CurveHeaderProps) {
  return (
    <>
      <div
        className="absolute top-0 left-0 right-0 z-0"
        style={{ height: `${height}px`, backgroundColor: color }}
      />
      <div
        className="absolute left-0 right-0 z-0 leading-none"
        style={{ top: `${height - 8}px` }}
        aria-hidden
      >
        <svg viewBox="0 0 393 34" preserveAspectRatio="none" className="block w-full h-[34px]">
          <path d="M0,0 H393 V12 C300,30 110,30 0,16 Z" fill={color} />
        </svg>
      </div>
    </>
  )
}
