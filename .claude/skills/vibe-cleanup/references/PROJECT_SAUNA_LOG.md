# Sauna Log 프로젝트 컨텍스트 (vibe-cleanup 전용)

이 파일은 **이 레포에서만** 체크리스트 예시·경로를 구체화할 때 참조한다.
우선순위: 루트 `CLAUDE.md` > `.claude/rules/*` > 본 스킬 기본 규칙.

## 스택 (감지 결과 고정값)

- Next.js 14 App Router, TypeScript, Tailwind, React 18
- Supabase (Auth, DB, Storage)
- 검증(기본 엄격): `npm run lint` → `npm run build` 순으로 둘 다. 클린업은 가끔 하므로 빌드 생략은 예외(사용자 지정·환경 불가 시에만).

## 디렉터리 레퍼런스 (위반 탐지 시 경로 예시)

| 영역 | 경로 예시 |
|------|-----------|
| 페이지 | `src/app/**/page.tsx`, `src/app/**/layout.tsx` |
| API Route Handlers | `src/app/api/**/route.ts` |
| 인증/미들웨어 | `src/middleware.ts`, `src/app/auth/**` |
| 도메인 컴포넌트 | `src/components/features/**` |
| 공통 UI | `src/components/ui/**` |
| 컨텍스트 | `src/contexts/**` |
| 훅 | `src/hooks/use-*.ts` |
| 서비스 레이어 | `src/lib/*-service.ts`, `src/lib/utils.ts` |
| 콘텐츠 SSOT | `src/constants/content.ts` |
| 타입 | `src/types/index.ts` |
| DB 마이그레이션 | `supabase/migrations/*.sql` |

## AI 환각 시 자주 틀리는 지점 (이 프로젝트)

- 존재하지 않는 npm 패키지 import (실제 의존성은 `package.json`만)
- Supabase 테이블/컬럼명을 마음대로 추가 (스키마는 `supabase/migrations` + 타입과 대조)
- `src/app` 밖에 Pages Router 스타일 파일 생성 (`pages/` 혼용)
- API를 `pages/api`가 아닌 `src/app/api/.../route.ts`가 아닌 경로에 둠
- `LogWithPlace` 등 타입과 다른 필드명 사용

## UI/UX 규칙 (정리 시 위반 후보)

- 이모지: 트라이브 선택, 리스트 커버, 사-리스트 피드 필터 칩 **외** UI에 이모지 추가 → 프로젝트 규칙 위반 가능
- 아이콘: Google Material Symbols 사용 권장 (다른 아이콘 세트 난립 시 패턴 혼재)

## 서비스·데이터 흐름 패턴

- 클라이언트 데이터: `useUserLogs`, `usePlaces` 등 훅 → `src/lib/*-service.ts` → Supabase
- 새 “임시 fetch”를 페이지에 직접 쌓기보다 기존 서비스/훅 패턴과 일치하는지 확인

## 검증 명령 (7단계 스킬 본문과 동일 — 기본 엄격)

```bash
npm run lint
npm run build
```

순서 고정, 둘 다 기본 필수. 예외 시 스킬 본문의 "빠른 패스" 규칙 따름.

선택: 타입만 빠르게 볼 때 `npx tsc --noEmit` (프로젝트에 전용 스크립트 없음)
