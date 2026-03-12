import type { Config } from 'tailwindcss'

/**
 * Tailwind CSS 설정
 *
 * 색상 관리:
 * - 브랜드 컬러는 globals.css의 CSS 변수에서 정의
 * - Tailwind에서는 extend.colors로 CSS 변수를 참조
 * - 사용법: text-green, bg-orange 등
 */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Oswald', 'var(--font-heading)', 'sans-serif'],
      },
      colors: {
        // 브랜드 컬러 - CSS 변수 참조
        primary: 'var(--color-primary)',
        'primary-light': 'var(--color-primary-light)',
        accent: 'var(--color-accent)',
        'accent-light': 'var(--color-accent-light)',
        // 비활성 아이콘
        'icon-inactive': 'var(--color-icon-inactive)',
        // 타입별 컬러
        bather: 'var(--color-bather)',
        sauner: 'var(--color-sauner)',
        jimi: 'var(--color-jimi)',
        // UI 컬러
        card: 'var(--color-card)',
        border: 'var(--color-border)',
        muted: 'var(--color-muted)',
        'muted-fg': 'var(--color-muted-fg)',
      },
      borderWidth: {
        '3': '3px',
      },
      ringWidth: {
        '3': '3px',
      },
      borderRadius: {
        glass: 'var(--radius)',
      },
      boxShadow: {
        glass: 'var(--glass-shadow)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'intro-up': {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'intro-up': 'intro-up 0.7s cubic-bezier(0.25,0.46,0.45,0.94) both',
        'intro-up-slow': 'intro-up 1.4s cubic-bezier(0.25,0.46,0.45,0.94) both',
      },
    },
  },
  plugins: [],
}

export default config
