# 핸드오프: 스토리 Phase 9 + 온보딩/설정 텍스트 통일

> 작성: 2026-03-11
> 브랜치: main

## 완료 항목

### 1. `/settings/type` → 온보딩 Step 2 스타일 통일
- 카드: `border-3` 제거 → `glass-card-light` + 선택 시 `shadow-md scale-105`
- 순위 뱃지: `#{rank}` → `{rank}` (w-6 h-6 원형)
- 라벨: 한글만 → 영문 헤딩(BATHER/SAUNNER/JIMI) + 한글 서브라벨
- 선택 피드백: description 표시 추가
- 설명 텍스트 italic 제거, `text-sm text-stone-400/600` 통일

### 2. 온보딩/설정 텍스트 변경
- "닉네임을 입력해주세요" → "닉네임을 정해주세요"
- "좋아하는 순서대로 선택해주세요" → "나의 사우나 스타일은?" (subtitle)
- "탭하여 선택 · 순서 = 우선순위" → "좋아하는 순서대로 선택해주세요" (피드백)
- 닉네임 제목 폰트: `text-xl font-bold` → `text-sm text-stone-400` (설명 텍스트 통일)
- 헤더: "WELCOME SA-PIEN" → "WELCOME TO SA-PI" (SA-PI 레드)

### 3. 설정 페이지
- "나의 트라이브" → "MY TRIBE"
- 트라이브 persona 표시: `.toUpperCase()` 적용 (BATHER/SAUNNER/JIMI)

### 4. 스토리 페이지 (Phase 9) 디자인 오버홀
- 액션 버튼: `rounded-lg` 레드 배경 + 네비 바 스타일 통일, 라벨 레드 컬러
- "사진" 버튼 → "기록 보기" (→ `/history/[id]`)
- "지난 기록" → "추가 기록" (→ `/log`)
- 배경 변경 버튼: 프리뷰 우측 상단으로 이동, 배경/보더 없이 반투명 아이콘+문구
- "배경 변경" ↔ "배경 초기화" 토글

### 5. 폭죽 애니메이션
- `canvas-confetti` + `@types/canvas-confetti` 추가
- 새 기록 완료 시 story 진입 → 좌우 양쪽 폭죽 1회 발사 (300ms 딜레이)
- 편집 후 진입 시 미발동 (`localStorage.isNewLog` 플래그로 구분)

## 변경 파일
- `src/constants/content.ts` — 온보딩 텍스트 변경
- `src/app/onboarding/page.tsx` — 헤더/설명 폰트 통일, 피드백 텍스트 변경
- `src/app/settings/type/page.tsx` — 온보딩 Step 2 스타일 통일
- `src/app/settings/page.tsx` — MY TRIBE + persona uppercase
- `src/app/story/page.tsx` — Phase 9 디자인 오버홀 + confetti
- `src/app/log/page.tsx` — isNewLog 플래그 추가
- `src/app/log/deep/page.tsx` — isNewLog 플래그 추가
- `package.json` — canvas-confetti 의존성 추가

## Phase 11 스타일 감사 — 실행 완료

### Config 변경
- `tailwind.config.ts`: `fontFamily.heading` 추가, 레거시 green/orange alias 제거 → `icon-inactive` 추가
- `globals.css`: `--color-icon-inactive` CSS 변수 추가, `.btn-primary` 유틸리티 클래스 추가 (disabled=gray 포함)

### 일괄 수정
- **A1**: `place/page.tsx` — `focus:border-green` → `glass-input` 교체 + 헤더 UI 업데이트 ("SELECT PLACE" italic serif)
- **A2**: `place/page.tsx` — 검색 입력 `glass-input` 통일
- **B1**: `explore/[id]/page.tsx`, `place-card.tsx` — `#d6d3d1` → `var(--color-icon-inactive)`
- **B2**: 11파일 `rounded-2xl` → `rounded-xl` 통일 (모달 제외)
- **B3**: 12파일 37곳 `style={{ fontFamily }}` → `font-heading` Tailwind 클래스 교체
- **CTA 버튼**: 9파일 10개 버튼 → `.btn-primary` 클래스 통일 (disabled=gray)
- **타입 대문자**: `log/page.tsx` TRIBE_PERSONA_MAP `.toUpperCase()` 적용
- **스토리**: 배경 변경 버튼 소형화 + 반투명 버튼화, `overflow-hidden` 대화면 넘침 방지

### 변경 파일 (추가분)
- `tailwind.config.ts`, `globals.css`
- `place/page.tsx`, `place-card.tsx`
- `explore/[id]/page.tsx`
- `log/page.tsx`, `log/deep/page.tsx`
- `history/[id]/page.tsx`
- `onboarding/page.tsx`, `login/page.tsx`
- `settings/page.tsx`, `settings/nickname/page.tsx`, `settings/type/page.tsx`
- `home/page.tsx`, `explore/page.tsx`, `explore/type/[type]/page.tsx`
- `place/add/page.tsx`, `story/page.tsx`, `error.tsx`
- `add-record-card.tsx`
- `history/page.tsx`

### 스토리 배경 사진 UX 개선
- 배경 사진 블러 처리 (`filter: blur(3px)` + `scale(1.02)`)
- 배경 변경 버튼: pill 형태 (`rounded-full`, 고정 `88×30px`) + `backdrop-blur` 플로팅
- 루틴 숫자/단위에 `textShadow` 글로우 (배경 사진 있을 때만)
- 블랙 디퓨즈 글로우 삭제 → 그라데이션 조정으로 가독성 확보

### 기록 상세 — 세신/매점 표기 통일 + purposes 제거
- 세신/매점: `descriptor(text-xs) + 점수/5` 형태로 통일, 카드 내 `text-stone-700` 컬러
- `/5` 분모 `text-xs text-stone-400`으로 작게 처리
- 방문 목적(purposes) 완전 제거: types, deep/page.tsx, logs-service, content.ts, 001_schema.sql
- DB: `ALTER TABLE deep_logs DROP COLUMN purposes;` 프로덕션 실행 필요

## Next Steps
- Phase 11: 전체 앱 플로우 통과 테스트 + 미사용 CSS 정리
- DB 마이그레이션: `sweat_quality` 추가 + `purposes` 제거

## 참고 문서
- `docs/plans/PLAN_design_overhaul_implementation.md`
- `docs/plans/PLAN_phase11_style_audit.md`
