'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

/**
 * 전역 에러 바운더리 — root layout 레벨 에러 캐치
 * error.tsx는 page 레벨만 캐치하므로, layout.tsx 자체 에러는 여기서 처리
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '360px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#x26A0;&#xFE0F;</div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#44403c', marginBottom: '8px' }}>
              문제가 발생했습니다
            </h2>
            <p style={{ fontSize: '14px', color: '#78716c', marginBottom: '24px' }}>
              일시적인 오류입니다. 다시 시도해 주세요.
            </p>
            <button
              onClick={reset}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: '#78716c',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
