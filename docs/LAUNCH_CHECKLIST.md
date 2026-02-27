# Launch Checklist

프로덕션 배포 전 변경/수정이 필요한 항목 정리.

---

## 1. Supabase 통합

- [ ] `logs` 테이블 생성 (QuickLogData + DeepLogData + 메타데이터)
- [ ] `localStorage.savedLogs` → Supabase `logs` 테이블 insert/select 로 전환
- [ ] `src/lib/storage.ts`의 `saveLogToHistory()` / `getSavedLogs()` → Supabase 클라이언트 호출로 교체
- [ ] Row-Level Security(RLS) 정책 설정 — 유저 본인 데이터만 읽기/쓰기

## 2. 유저 인증 & 영속성

- [ ] 온보딩 TODO 완료: 유저 정보 Supabase `users` 테이블에 저장
- [ ] `localStorage.user` → Supabase Auth 세션으로 전환
- [ ] 로그인/로그아웃 플로우 구현 (소셜 OAuth or 매직링크)
- [ ] UserContext를 Supabase Auth 상태와 연동

## 3. 히스토리 페이지 마이그레이션

- [ ] `DUMMY_LOGS` 제거, Supabase `logs` 쿼리로 전환
- [ ] 페이지네이션 또는 무한스크롤 구현
- [ ] 필터/정렬이 DB 쿼리 기반으로 동작하도록 변경

## 4. 이미지 스토리지

- [ ] 스토리 카드 이미지 → Supabase Storage 업로드
- [ ] 공유용 퍼블릭 URL 생성 (링크 공유 지원)
- [ ] 스토리지 버킷 정책 설정 (유저별 폴더 격리)

## 5. 테마 배경 관리

- [ ] `THEMED_BACKGROUNDS` 배열 → Supabase 테이블로 이동
- [ ] 관리자가 배포 없이 테마 추가/제거 가능하도록
- [ ] 테마 이미지 → Supabase Storage에 업로드

## 6. PWA 설정

- [ ] `manifest.json` — 앱 이름, 아이콘, 테마 색상 설정
- [ ] Service Worker 등록 (next-pwa 또는 커스텀)
- [ ] 오프라인 기본 페이지 설정
- [ ] 앱 아이콘 에셋 생성 (192×192, 512×512)
- [ ] 스플래시 스크린 설정

## 7. Vercel 배포

- [ ] 환경 변수 설정: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] 커스텀 도메인 연결
- [ ] 빌드 설정 확인 (Next.js 14+)
- [ ] Preview & Production 환경 분리

## 8. 데이터 정리

- [ ] `DUMMY_LOGS` 완전 삭제
- [ ] localStorage 폴백 코드 제거
- [ ] 하드코딩된 테스트 데이터 제거
- [ ] 개발용 console.log 정리

## 9. 보안

- [ ] API 키가 클라이언트에 노출되지 않도록 확인 (anon key만 허용)
- [ ] RLS 정책이 모든 테이블에 적용되었는지 검증
- [ ] 유저 입력 값 검증 (시스템 경계에서)
- [ ] XSS 방지 — 사용자 입력이 dangerouslySetInnerHTML 없이 렌더되는지 확인

## 10. 성능

- [ ] 이미지 최적화 (next/image 활용, WebP 변환)
- [ ] 컴포넌트 레이지 로딩 (특히 크롭 모달, 그래프)
- [ ] 번들 사이즈 분석 (`next build --analyze`)
- [ ] Lighthouse 점수 체크 (PWA, Performance, Accessibility)

---

> 이 문서는 현재 localStorage 기반 MVP에서 프로덕션으로 전환할 때 참고용입니다.
> 각 항목은 독립적으로 진행 가능하며, Supabase 통합(1번)이 가장 우선순위가 높습니다.
