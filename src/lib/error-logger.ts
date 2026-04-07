/**
 * 에러 로깅 래퍼 — 앱 전체의 에러 수집 단일 진입점
 *
 * 왜 래퍼를 쓰나?
 * console.error를 직접 쓰면 에러 수집 도구를 바꿀 때 모든 파일을 수정해야 한다.
 * 이 파일 하나만 수정하면 Sentry → 다른 도구로 교체 가능.
 *
 * 사용법:
 *   import { captureError } from '@/lib/error-logger'
 *   captureError(error, { label: '프로필 로드 실패' })
 */

import * as Sentry from '@sentry/nextjs'

/**
 * 에러를 Sentry로 전송 + 콘솔에도 출력
 *
 * @param error - 캐치된 에러 객체 (Error, Supabase 에러, unknown 등)
 * @param context - 에러 발생 위치와 추가 정보
 *   - label: 어디서 발생했는지 (예: '프로필 로드 실패', 'Place search error')
 *   - extra: 추가 메타데이터 (예: { source: 'naver', query: '사우나' })
 */
export function captureError(
  error: unknown,
  context?: { label?: string; extra?: Record<string, string> }
) {
  const label = context?.label ?? 'Error'

  // 1. 콘솔 출력 (개발 중 + Vercel Function Log)
  console.error(`[${label}]`, error)

  // 2. Sentry 전송
  Sentry.withScope((scope) => {
    if (context?.label) {
      scope.setTag('label', context.label)
    }
    if (context?.extra) {
      for (const [key, value] of Object.entries(context.extra)) {
        scope.setExtra(key, value)
      }
    }

    if (error instanceof Error) {
      Sentry.captureException(error)
    } else {
      // Supabase 에러 등 Error 인스턴스가 아닌 경우
      Sentry.captureException(new Error(String(error)), {
        extra: { originalError: error },
      })
    }
  })
}
