import type { Metadata, Viewport } from 'next'
import { Oswald, Libre_Franklin, Noto_Sans_KR } from 'next/font/google'
import './globals.css'
import { APP } from '@/constants/content'
import { AuthProvider } from '@/contexts/auth-context'
import { UserProvider } from '@/contexts/user-context'
import { ToastProvider } from '@/contexts/toast-context'
import { SavePlaceProvider } from '@/contexts/save-place-context'
import { ToastContainer } from '@/components/ui/toast'

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-oswald',
})

const libreFranklin = Libre_Franklin({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-libre',
})

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-noto',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://sapisauna.vercel.app'),
  title: APP.NAME,
  description: APP.TAGLINE,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '사-피',
  },
  openGraph: {
    type: 'website',
    siteName: '사-피',
    title: '사-피',
    description: '사우나 신인류를 위한 기록, 공유, 발견',
    locale: 'ko_KR',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: '사-피 — 사우나 신인류를 위한 기록, 공유, 발견' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '사-피',
    description: '사우나 신인류를 위한 기록, 공유, 발견',
    images: ['/og-image.png'],
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
    <html lang="ko" className={`${oswald.variable} ${libreFranklin.variable} ${notoSansKR.variable}`}>
      <head>
        {/* Material Symbols — next/font 미지원이라 link 유지 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/*
          display=block: 폰트 로드 전 ligature 원본 글자("progress_activity" 등)가
          노출되는 FOUT를 차단 (아이콘은 잠깐 안 보이다가 글리프로 표시).
        */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=block"
        />
      </head>
      <body className="min-h-dvh" style={{ backgroundColor: '#f5f2ef' }}>
        <AuthProvider>
          <UserProvider>
            <ToastProvider>
              <SavePlaceProvider>
                <main className="max-w-md mx-auto min-h-dvh bg-[#f5f2ef] md:shadow-[0_0_40px_rgba(0,0,0,0.06)]">
                  {children}
                </main>
                <ToastContainer />
              </SavePlaceProvider>
            </ToastProvider>
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
