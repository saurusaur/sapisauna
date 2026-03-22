import type { Metadata, Viewport } from 'next'
import './globals.css'
import { APP } from '@/constants/content'
import { AuthProvider } from '@/contexts/auth-context'
import { UserProvider } from '@/contexts/user-context'

export const metadata: Metadata = {
  title: APP.NAME,
  description: APP.TAGLINE,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP.NAME,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        {/* Google Fonts - Oswald (헤딩) + Libre Franklin (영문 본문) + Noto Sans KR (한글) + Material Symbols */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* 텍스트 폰트 — swap: 폴백 폰트 먼저 표시 후 교체 */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;600;700;800&family=Oswald:wght@400;500;600;700&display=swap"
        />
        {/* 아이콘 폰트 — block: 로딩 전까지 리거처 텍스트 숨김 (FOUT 방지) */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=block"
        />
      </head>
      <body className="min-h-dvh" style={{ backgroundColor: '#f5f2ef' }}>
        <AuthProvider>
          <UserProvider>
            <main className="max-w-md mx-auto min-h-dvh bg-[#f5f2ef] md:shadow-[0_0_40px_rgba(0,0,0,0.06)]">
              {children}
            </main>
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
