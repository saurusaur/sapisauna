/**
 * Next.js Instrumentation — Sentry 서버 SDK 초기화 진입점
 * Next.js가 서버 시작 시 자동으로 이 파일을 실행한다.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

export { captureRequestError as onRequestError } from '@sentry/nextjs'
