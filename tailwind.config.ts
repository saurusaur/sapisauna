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
      colors: {
        // 브랜드 컬러 - CSS 변수 참조
        green: 'var(--color-green)',
        'green-light': 'var(--color-green-light)',
        orange: 'var(--color-orange)',
        'orange-light': 'var(--color-orange-light)',
        bather: 'var(--color-bather)',
        sauner: 'var(--color-sauner)',
        jimi: 'var(--color-jimi)',
      },
      borderWidth: {
        '3': '3px',
      },
      ringWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}

export default config
