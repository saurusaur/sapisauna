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
        {/* Google Fonts - Cormorant Garamond (타이틀) + DM Sans (숫자) + Material Symbols */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=DM+Sans:wght@400;500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
        />
        {/* Pretendard - 한글 폰트 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="min-h-screen" style={{ backgroundColor: '#fdfbf7' }}>
        <AuthProvider>
          <UserProvider>
            <main className="max-w-md mx-auto min-h-screen">
              {children}
            </main>
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
