/**
 * Sentry 서버 설정
 * API Route, 서버 컴포넌트에서 실행
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  tracesSampleRate: 0,
  sampleRate: 1.0,
})
