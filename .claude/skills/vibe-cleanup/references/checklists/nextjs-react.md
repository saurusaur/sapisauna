# Next.js/React 체크리스트

## 감지 조건

| 파일 | 감지 결과 |
|------|----------|
| `next.config.*` | Next.js |
| `package.json` 내 `react` 의존성 | React |

## 검사 항목

- [ ] 서버/클라이언트 컴포넌트 분리 적절성
- [ ] `'use client'` 불필요한 사용 여부
- [ ] key prop 누락 (리스트 렌더링)
- [ ] useEffect 의존성 배열 점검

## Sauna Log 예시 (App Router)

- [ ] 페이지는 `src/app/.../page.tsx`에 두고, `pages/` 라우터와 혼용하지 않았는지
- [ ] API는 `src/app/api/.../route.ts` 패턴인지 (레거시 `pages/api` 아님)
- [ ] 인증 보호는 `src/middleware.ts`와 공개 경로 정책과 충돌하지 않는지 (`/login`, `/explore`, `/api` 등)
- [ ] 데이터 패칭이 기존 `src/lib/*-service.ts` + `src/hooks/use-*.ts` 패턴과 어긋나지 않는지
- [ ] UI 텍스트/라벨이 `src/constants/content.ts` SSOT를 우회하지 않는지 (새 문자열 난립)
- [ ] 트라이브/이모지 규칙: `CLAUDE.md` — 이모지 허용 위치 외에 이모지 추가 없는지

## 검증 명령

| 도구 | 명령 |
|------|------|
| Lint | `npm run lint` |
| 빌드 | `npm run build` |
