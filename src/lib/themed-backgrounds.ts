/**
 * 모듈식 테마 배경 설정
 * 시즌/한정판 배경을 이 배열에 추가하면 배경 피커에 자동 반영
 * 이미지는 /public/themes/ 에 배치
 * (미래: Supabase 테이블로 이동하여 배포 없이 관리)
 */

export type ThemedBackground = {
  id: string
  label: string           // 예: "봄 에디션"
  imageUrl: string        // /themes/xxx.jpg 또는 Supabase Storage URL
  availableFrom?: string  // ISO date (선택, 기간 한정)
  availableUntil?: string // ISO date (선택, 기간 한정)
}

// 이 배열을 편집하여 테마 배경 추가/제거
export const THEMED_BACKGROUNDS: ThemedBackground[] = [
  // 예시 (첫 테마 준비 전까지 비워둠):
  // { id: 'spring-2026', label: '봄', imageUrl: '/themes/spring-2026.jpg',
  //   availableFrom: '2026-03-01', availableUntil: '2026-04-30' },
]

/** 현재 활성 테마만 필터 */
export function getActiveThemes(): ThemedBackground[] {
  const d = new Date()
  const now = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return THEMED_BACKGROUNDS.filter(t => {
    if (t.availableFrom && now < t.availableFrom) return false
    if (t.availableUntil && now > t.availableUntil) return false
    return true
  })
}
