/**
 * Sentry 클라이언트 설정
 * 브라우저에서 실행 — 유저의 JS 에러를 자동 캐치
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 개인정보 수집 안 함 (쿠키, IP, User-Agent 등)
  sendDefaultPii: false,

  // 성능 추적 비활성화 (에러만 수집)
  tracesSampleRate: 0,

  // 에러 100% 수집 (베타 소규모)
  sampleRate: 1.0,

  // 브라우저에서 흔히 발생하는 무의미한 에러 무시
  ignoreErrors: [
    'ResizeObserver loop',           // 레이아웃 리사이즈 (무해)
    'ChunkLoadError',                // 배포 후 캐시된 JS 로드 실패
    'Loading chunk',                 // 위와 동일
    'Network request failed',       // 일시적 네트워크 끊김
    'Load failed',                   // Safari fetch 실패
    'Failed to fetch',               // 일시적 네트워크
    'AbortError',                    // 유저가 페이지 이탈
    'NotAllowedError',               // 권한 거부 (카메라 등)
  ],

  // PII 스크러빙: 에러 메시지에서 UUID/이메일 제거
  beforeSend(event) {
    if (event.message) {
      event.message = scrubPii(event.message)
    }
    if (event.exception?.values) {
      for (const ex of event.exception.values) {
        if (ex.value) {
          ex.value = scrubPii(ex.value)
        }
      }
    }
    return event
  },
})

/** UUID와 이메일 패턴을 [REDACTED]로 치환 */
function scrubPii(text: string): string {
  return text
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[UUID]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
}
