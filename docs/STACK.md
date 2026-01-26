# Sauna Log - 기술 스택

## 개발 방식
**PWA (Progressive Web App)** - 웹으로 만들어서 앱처럼 사용

```
웹 개발 → 모바일 브라우저 테스트 → 앱 스토어 등록 (선택)
```

---

## 기술 스택 요약

| 영역 | 기술 | 버전 | 용도 |
|------|------|------|------|
| 프레임워크 | Next.js | 14+ | React 기반 풀스택 프레임워크 |
| 언어 | TypeScript | 5+ | 타입 안정성 |
| 스타일링 | Tailwind CSS | 3+ | 유틸리티 기반 CSS |
| 데이터베이스 | Supabase | - | PostgreSQL + 인증 + 스토리지 |
| 배포 | Vercel | - | 자동 배포, CDN |
| 앱화 | Capacitor | 5+ | 웹 → 네이티브 앱 변환 |

---

## 상세 설명

### 1. Next.js (프론트엔드 + 백엔드)
- **공식 사이트**: https://nextjs.org
- **왜 선택?**
  - React 기반으로 자료가 많음
  - 파일 기반 라우팅 (폴더 = URL)
  - API 라우트로 백엔드 로직도 처리 가능
  - Vercel과 완벽 호환

```bash
# 프로젝트 생성
npx create-next-app@latest sauna-log
```

### 2. TypeScript
- **왜 선택?**
  - 오타/타입 에러를 미리 잡아줌
  - 자동완성이 잘 됨
  - 초보자에게 오히려 도움 (에러 메시지가 친절)

### 3. Tailwind CSS (스타일링)
- **공식 사이트**: https://tailwindcss.com
- **왜 선택?**
  - CSS 파일 따로 안 만들어도 됨
  - 클래스명만 붙이면 스타일 완성
  - 반응형(모바일/PC) 쉽게 처리

```jsx
// 예시: 버튼 스타일링
<button className="bg-blue-500 text-white px-4 py-2 rounded-lg">
  저장
</button>
```

### 4. Supabase (데이터베이스 + 인증)
- **공식 사이트**: https://supabase.com
- **왜 선택?**
  - Firebase 대안, 무료 티어 넉넉함
  - PostgreSQL 기반 (표준 SQL)
  - 인증(로그인), 스토리지(이미지) 내장
  - 한글 자료 많음

```
무료 플랜 포함:
- 500MB 데이터베이스
- 1GB 스토리지
- 월 50,000 활성 사용자
```

### 5. Vercel (배포)
- **공식 사이트**: https://vercel.com
- **왜 선택?**
  - GitHub 연결하면 자동 배포
  - Next.js 만든 회사라 호환 완벽
  - 무료 플랜으로 충분
  - HTTPS 자동 적용

```
배포 과정:
GitHub에 Push → Vercel이 자동 감지 → 빌드 → 배포 완료
```

### 6. Capacitor (앱화) - 나중에
- **공식 사이트**: https://capacitorjs.com
- **왜 선택?**
  - 웹 코드 그대로 iOS/Android 앱으로
  - 카메라, GPS 등 네이티브 기능 사용 가능
  - React/Next.js와 잘 맞음

```bash
# 나중에 앱화할 때
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap add android
```

---

## 아이콘 사용 규칙

### 사용 원칙
| 용도 | 아이콘 종류 | 예시 |
|------|------------|------|
| **기능적 UI** | Google Material Symbols | 메뉴, 버튼, 네비게이션, 액션 |
| **감성적 요소** | Emoji | 먹거리, 상태, 평가, 포인트 |

### Google Material Symbols
- **공식 사이트**: https://fonts.google.com/icons
- **설정**: layout.tsx에서 Google Fonts로 로드
- **사용법**: `<span className="material-symbols-outlined">home</span>`

```tsx
// 예시: 네비게이션 아이콘
<span className="material-symbols-outlined">home</span>      // 홈
<span className="material-symbols-outlined">history</span>   // 기록
<span className="material-symbols-outlined">settings</span>  // 설정
```

### Emoji 사용
- 감성적인 요소에만 사용 (컬러감 살리기)
- content.ts에서 관리

```tsx
// 예시: 감성적 요소
🛁 목욕파  🔥 사우너파  💆 찜질파
🥛 식혜  🥚 계란  🍺 맥주
😐 별로  😊 좋아  😍 최고
```

---

## 추가 라이브러리 (필요시)

| 용도 | 라이브러리 | 설명 |
|------|-----------|------|
| 상태관리 | Zustand | 가볍고 쉬운 상태 관리 |
| 이미지 생성 | html-to-image | 스토리 이미지 생성용 |
| 날짜 | date-fns | 날짜 포맷팅 |
| 지도 | Naver Maps API | 장소 검색 |
| 폼 | React Hook Form | 입력 폼 관리 |
| 토스트 | Sonner | 알림 메시지 |

---

## 폴더 구조 (예정)

```
sauna-log/
├── app/                    # 페이지들
│   ├── page.tsx           # 홈
│   ├── onboarding/        # 온보딩
│   ├── log/               # 기록하기
│   └── story/             # 스토리 만들기
├── components/            # 재사용 컴포넌트
│   ├── ui/               # 버튼, 슬라이더 등
│   └── features/         # 기능별 컴포넌트
├── lib/                   # 유틸리티
│   ├── supabase.ts       # DB 연결
│   └── utils.ts          # 헬퍼 함수
├── public/               # 정적 파일 (이미지 등)
└── styles/               # 글로벌 스타일
```

---

## 개발 환경 요구사항

- **Node.js**: 18.17 이상
- **npm** 또는 **pnpm**
- **Git**
- **VS Code** (추천 에디터)

### VS Code 추천 확장
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Importer

---

## 참고 자료

### 공식 문서
- Next.js: https://nextjs.org/docs
- Tailwind: https://tailwindcss.com/docs
- Supabase: https://supabase.com/docs

### 한글 자료
- Next.js 한글 튜토리얼: https://nextjs.org/learn
- Supabase 한글 문서: https://supabase.com/docs (번역 지원)

---

## 로드맵 연동

| Phase | 관련 기술 |
|-------|----------|
| MVP (Quick Log) | Next.js + Tailwind + Supabase |
| 스토리 공유 | html-to-image + Share API |
| 앱화 | Capacitor |
| 추천 시스템 | Supabase Edge Functions |
