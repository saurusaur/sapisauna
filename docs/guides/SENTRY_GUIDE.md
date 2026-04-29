# Sentry 에러 로깅 가이드

> Sauna Log 프로젝트의 에러 모니터링 시스템 사용법

## 목차
1. [Sentry가 뭔지](#1-sentry가-뭔지)
2. [우리 앱에서 어떻게 동작하는지](#2-우리-앱에서-어떻게-동작하는지)
3. [초기 셋업 (한 번만)](#3-초기-셋업-한-번만)
4. [에러가 발생하면 나한테 어떻게 오는지](#4-에러가-발생하면-나한테-어떻게-오는지)
5. [Sentry 대시보드 사용법](#5-sentry-대시보드-사용법)
6. [래퍼 패턴이 뭐고 왜 쓰는지](#6-래퍼-패턴이-뭐고-왜-쓰는지)
7. [새 코드에서 에러 로깅하기](#7-새-코드에서-에러-로깅하기)
8. [개인정보 보호](#8-개인정보-보호)
9. [비용과 한도](#9-비용과-한도)
10. [FAQ](#10-faq)

---

## 1. Sentry가 뭔지

Sentry는 "앱에서 에러가 터지면 나한테 알려주는 서비스"야.

지금까지는 유저 앱에서 에러가 나면:
- 유저는 "문제가 발생했습니다" 화면을 보고
- 개발자(나)는 **아무것도 모름** — 유저가 직접 말해줘야 알 수 있었음

Sentry를 쓰면:
- 에러가 나는 순간 자동으로 Sentry 서버에 기록됨
- 나는 이메일/슬랙으로 알림을 받음
- "어떤 에러가, 어떤 페이지에서, 몇 번 발생했는지" 대시보드에서 바로 확인

**한마디로: 유저가 말 안 해도 내가 알 수 있게 해주는 도구.**

---

## 2. 우리 앱에서 어떻게 동작하는지

```
유저가 앱 사용 중 에러 발생
        │
        ├─ 클라이언트 에러 (브라우저)
        │   예: 로그 저장 실패, 사진 처리 실패
        │   → Sentry 클라이언트 SDK가 자동 캐치
        │   → 에러 정보 + 스택트레이스 + 브라우저 정보 수집
        │   → Sentry 서버로 전송
        │
        └─ 서버 에러 (Vercel)
            예: API 검색 실패, OAuth 에러
            → Sentry 서버 SDK가 캐치
            → 함수명 + 요청 경로 + 에러 메시지 수집
            → Sentry 서버로 전송
                │
                ▼
        Sentry 대시보드 (sentry.io)
        ├─ 에러 목록 (Issues)
        ├─ 각 에러의 발생 횟수, 영향 유저 수
        ├─ 스택트레이스 (어떤 코드 라인에서 터졌는지)
        └─ 알림 → 이메일로 받음
```

### 파일 구조

```
프로젝트 루트/
├── instrumentation-client.ts ← 브라우저 SDK 설정
├── sentry.server.config.ts   ← 서버 SDK 설정
├── sentry.edge.config.ts     ← Middleware SDK 설정
├── next.config.js             ← withSentryConfig() 래핑
├── src/
│   ├── instrumentation.ts     ← 서버 시작 시 Sentry 초기화
│   ├── lib/
│   │   └── error-logger.ts    ← 래퍼 (모든 에러가 여기를 거쳐 Sentry로 감)
│   └── app/
│       ├── error.tsx          ← 페이지 에러 바운더리 (Sentry 연동)
│       └── global-error.tsx   ← 레이아웃 에러 바운더리 (Sentry 연동)
```

---

## 3. 초기 셋업 (한 번만)

### Step 1: Sentry 계정 + 프로젝트 생성

1. [sentry.io](https://sentry.io) 가입 (GitHub 로그인 가능)
2. 새 프로젝트 생성:
   - Platform: **Next.js**
   - Project name: `sauna-log`
3. DSN 복사 (Settings → Client Keys → DSN)
   - `https://xxxxx@o12345.ingest.sentry.io/67890` 형태

### Step 2: 환경변수 설정

**로컬 (.env.local)**:
```env
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@o12345.ingest.sentry.io/67890
```

**Vercel**:
```
Vercel Dashboard → Settings → Environment Variables
→ NEXT_PUBLIC_SENTRY_DSN = 위 DSN 값
```

### Step 3: 소스맵 업로드 (선택, 나중에 해도 됨)

소스맵을 업로드하면 Sentry에서 에러의 **원본 코드 라인**을 볼 수 있어.
안 하면 빌드된 코드(읽기 어려운 코드)로 보임.

```
Sentry → Settings → Auth Tokens → 토큰 생성
Vercel에 추가:
  SENTRY_AUTH_TOKEN = sntrys_xxx...
  SENTRY_ORG = 너의-조직명
  SENTRY_PROJECT = sauna-log
```

### Step 4: 배포

Vercel에 push하면 끝. Sentry가 자동으로 에러를 수집하기 시작함.

---

## 4. 에러가 발생하면 나한테 어떻게 오는지

### 기본: 이메일

Sentry 가입할 때 쓴 이메일로 자동 알림이 옴.
새로운 종류의 에러가 처음 발생할 때 이메일이 옴.

### 선택: 슬랙 연동

Sentry → Settings → Integrations → Slack
원하는 채널에 알림 연결 가능.

### 알림 커스터마이징 (추천)

Sentry → Alerts → 규칙 수정:
- **Critical/Error만 알림** (Warning은 무시)
- **같은 에러 반복 시 1회만 알림** (폭주 방지)

---

## 5. Sentry 대시보드 사용법

### Issues 탭 (가장 많이 볼 화면)

에러 목록이 보임. 각 에러 행에 표시되는 정보:
- **제목**: 에러 메시지 (예: "인증 필요", "Network request failed")
- **횟수**: 이 에러가 총 몇 번 발생했는지
- **유저 수**: 몇 명의 유저에게 영향을 줬는지
- **최근 발생**: 마지막으로 언제 발생했는지

### 에러 상세 페이지 (에러 클릭 시)

- **스택트레이스**: 에러가 발생한 코드 라인 (소스맵 업로드 시 원본 코드)
- **Breadcrumbs**: 에러 발생 직전에 유저가 뭘 했는지 (페이지 이동, 클릭 등)
- **Tags**: 브라우저, OS, 디바이스 정보
- **label 태그**: 우리가 `captureError()`에서 넣은 라벨 (예: "로그 저장 실패")

### 에러 상태 관리

각 에러에 상태를 지정할 수 있어:
- **Unresolved**: 아직 안 봄/처리 안 됨
- **Resolved**: 수정 완료 (다시 발생하면 재오픈됨)
- **Ignored**: 무시 (알려진 이슈거나 고칠 필요 없을 때)

### 유용한 필터

- `is:unresolved` — 아직 처리 안 한 에러만
- `label:로그 저장 실패` — 특정 라벨의 에러만
- `browser:Safari` — Safari에서만 발생하는 에러

---

## 6. 래퍼 패턴이 뭐고 왜 쓰는지

### 래퍼 없이 하면 (나쁜 예)

모든 파일에서 Sentry를 직접 호출:
```ts
// user-context.tsx
import * as Sentry from '@sentry/nextjs'
Sentry.captureException(error)

// log/page.tsx
import * as Sentry from '@sentry/nextjs'
Sentry.captureException(error)

// story/page.tsx
import * as Sentry from '@sentry/nextjs'
Sentry.captureException(error)

// ... 9개 파일 전부에 Sentry 직접 import
```

**문제**: 나중에 Sentry를 다른 도구로 바꾸려면? → **9개 파일 전부 수정해야 함.**

### 래퍼 패턴 (우리가 쓰는 방식)

`error-logger.ts` 하나만 Sentry를 알고, 나머지는 래퍼만 호출:
```ts
// error-logger.ts (이 파일만 Sentry를 안다)
import * as Sentry from '@sentry/nextjs'
export function captureError(error, context) {
  Sentry.captureException(error)  // ← Sentry 호출은 여기서만
}

// user-context.tsx
import { captureError } from '@/lib/error-logger'
captureError(error, { label: '프로필 로드 실패' })

// log/page.tsx
import { captureError } from '@/lib/error-logger'
captureError(error, { label: '로그 저장 실패' })
```

**장점:**
1. **도구 교체 시 파일 1개만 수정** — Sentry → 다른 도구로 바꿔도 `error-logger.ts`만 수정
2. **일관된 라벨링** — 모든 에러에 `label` 태그가 붙어서 Sentry에서 필터링 쉬움
3. **PII 스크러빙 한 곳에서** — 개인정보 필터링 로직을 한 곳에서 관리
4. **console.error도 같이** — 래퍼가 Sentry 전송 + 콘솔 출력을 동시에 해줌

**요약: 래퍼 = 중간 번역가. 앱 코드와 외부 도구 사이에 끼어서, 한쪽이 바뀌어도 다른 쪽에 영향이 없게 해주는 패턴.**

---

## 7. 새 코드에서 에러 로깅하기

### 기본 사용

```ts
import { captureError } from '@/lib/error-logger'

try {
  await someOperation()
} catch (err) {
  captureError(err, { label: '작업 이름' })
}
```

### 추가 정보 포함

```ts
captureError(err, {
  label: 'Place search',
  extra: { source: 'naver', query: '강남 사우나' }
})
```
→ Sentry 대시보드에서 source, query 값을 같이 볼 수 있음.

### 자동 캐치 (직접 안 써도 되는 경우)

이건 Sentry가 알아서 잡아주므로 `captureError` 안 써도 됨:
- `error.tsx` / `global-error.tsx`에서 잡히는 React 렌더링 에러
- 브라우저의 잡히지 않은 예외 (window.onerror)
- 잡히지 않은 Promise rejection

---

## 8. 개인정보 보호

### 자동 보호 (설정 완료)

1. **`sendDefaultPii: false`** — 쿠키, IP, User-Agent 자동 수집 안 함
2. **PII 스크러빙** — 에러 메시지에 UUID나 이메일이 포함되면 `[UUID]`, `[EMAIL]`로 치환
3. **소스맵 숨김** — `hideSourceMaps: true` → 유저 브라우저에서 원본 코드 안 보임

### 주의할 점

`captureError`의 `extra`에 유저 개인정보를 직접 넣지 말 것:
```ts
// ❌ 이렇게 하지 말 것
captureError(err, { extra: { email: user.email } })

// ✅ 이렇게
captureError(err, { extra: { source: 'naver' } })
```

---

## 9. 비용과 한도

### 무료 티어 (Developer Plan)

- **5,000 에러/월**
- 1명 사용자
- 30일 데이터 보존
- 이메일 알림 포함

### 우리 앱에서의 예상 사용량

- 유저 수십명 × 일반 사용 = **월 100~500 이벤트**
- 5,000 한도의 10% 수준 → 한참 여유 있음

### 한도 초과 방지

`instrumentation-client.ts`의 `ignoreErrors`에 무의미한 에러 패턴이 등록되어 있어서, ResizeObserver나 ChunkLoadError 같은 노이즈는 카운트 안 됨.

---

## 10. FAQ

### Q: DSN이 뭐야?
Data Source Name. Sentry 프로젝트의 주소야. "이 에러를 어디로 보낼지"를 지정하는 URL.
`NEXT_PUBLIC_`으로 시작하므로 클라이언트에 노출되지만, DSN만으로는 데이터를 읽을 수 없어서 보안 문제 없음 (Sentry 공식 입장).

### Q: 에러가 너무 많이 오면?
1. Sentry → Alerts에서 알림 빈도 조절 (예: 같은 에러 1시간에 1번만)
2. `ignoreErrors`에 노이즈 패턴 추가
3. 해당 에러를 "Ignored" 처리

### Q: 로컬 개발 중에도 에러가 Sentry에 가?
`.env.local`에 `NEXT_PUBLIC_SENTRY_DSN`을 넣으면 감. 안 넣으면 안 감.
개발 중에는 안 넣는 게 좋음 (노이즈 방지).

### Q: Sentry 빼고 싶으면?
1. `error-logger.ts`에서 Sentry import와 호출 제거
2. `error.tsx`, `global-error.tsx`에서 Sentry import 제거
3. `next.config.js`에서 `withSentryConfig` 래핑 제거
4. `npm uninstall @sentry/nextjs`
5. config 3파일 + `instrumentation.ts` 삭제
