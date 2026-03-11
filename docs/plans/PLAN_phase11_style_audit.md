# Phase 11: 최종 검증 + 스타일 감사

> 작성: 2026-03-11
> 상태: ✅ 스타일 감사 실행 완료 (2026-03-11)

## Phase 11 기존 계획

| # | 항목 | 설명 |
|---|------|------|
| 1 | 전체 앱 플로우 통과 | 온보딩→로그인→홈→기록→스토리→히스토리→탐색→설정 1회 통과 |
| 2 | 글래스 효과 일관성 | glass-card / glass-card-light 사용 일관성 |
| 3 | 미사용 CSS 정리 | 불필요한 클래스/변수 제거 |
| 4 | 빌드 테스트 | `npm run build` 통과 확인 |

## 추가: 스타일 감사 결과

### A. 수정 필요 (HIGH)

#### A1. 레거시 `focus:border-green` 잔존
- **파일**: `place/page.tsx:55`
- **문제**: 디자인 토큰 교체(Phase 0)에서 누락. `--color-green` 삭제됨에도 Tailwind `focus:border-green` 클래스 사용
- **제안**: `focus:border-stone-400` 또는 `focus:border-[var(--color-primary-light)]`로 교체
- **이유**: 현재 Tailwind 기본 green이 적용되어 앱 컬러 시스템과 불일치

#### A2. 검색 입력 필드 — `glass-input` 미사용
- **파일**: `place/page.tsx:55`
- **문제**: `bg-white border-2 border-stone-200 rounded-xl` 인라인 조합 사용. 동일 역할의 입력 필드가 온보딩/설정에서는 `glass-input` 사용
- **제안**: `glass-input` 클래스로 통일
- **이유**: 스타일 변경 시 한 곳만 수정하면 전체 반영. 현재는 개별 수정 필요

---

### B. 개선 권장 (MEDIUM)

#### B1. 하드코딩 비활성 아이콘 컬러 `#d6d3d1`
- **파일**: `explore/[id]/page.tsx:119`, `place-card.tsx:68`
- **문제**: 즐겨찾기 하트 비활성 색상이 CSS 변수 없이 하드코딩
- **제안**: `--color-icon-inactive` CSS 변수 추가 후 참조
- **이유**: 테마 변경 시 누락 위험. stone-300(`#d6d3d1`)과 동일값이나 명시적 변수가 관리에 유리

#### B2. 카드 border-radius 불일치
- **현황**:
  - `glass-card` / `glass-card-light` CSS 정의: `border-radius: var(--radius)` = `0.75rem` (≈ `rounded-xl`)
  - 일부 페이지에서 `rounded-2xl` 오버라이드: `log/page.tsx:451`, `login/page.tsx`
- **분석**: `rounded-2xl`(1rem)과 `rounded-xl`(0.75rem) 혼용. 의도적 차이인지 불명확
- **제안**: 2가지 옵션
  1. `--radius`를 `1rem`으로 올리고 오버라이드 제거 (카드가 더 둥글어짐)
  2. 현행 유지 + 폼 카드만 `rounded-2xl` 허용하는 규칙 명시
- **이유**: 시각적 차이 미미하나, 규칙이 없으면 점점 발산

#### B3. `fontFamily: var(--font-heading)` 인라인 반복
- **현황**: 모든 헤딩에서 `style={{ fontFamily: 'var(--font-heading)' }}` 인라인 사용 (약 20곳)
- **제안**: Tailwind 커스텀 유틸리티 `font-heading` 클래스를 tailwind.config.ts에 등록
  ```js
  fontFamily: { heading: ['Oswald', 'var(--font-heading)'] }
  ```
  → `className="font-heading"` 으로 단순화
- **이유**: 인라인 style 반복 제거, className만으로 완결. 변경 시 config 한 곳만 수정

---

### C. 선택적 개선 (LOW)

#### C1. 아이콘 fontSize 인라인 산재
- **현황**: `style={{ fontSize: '14px' }}`, `'18px'`, `'20px'`, `'22px'` 등 개별 지정 (~30곳)
- **globals.css에 정의된 유틸리티**: `.icon-xsm`(14px), `.icon-sm`(18px), `.icon-md`(22px), `.icon-lg`(28px)
- **제안**: 인라인 fontSize → `.icon-*` 클래스로 점진 교체
- **이유**: 이미 정의된 유틸리티가 사용되지 않고 있음. 우선순위 낮으나 정리 시 일관성 향상

#### C2. `style={{ color: 'var(--color-primary)' }}` 반복
- **현황**: 약 15곳에서 인라인으로 primary 컬러 지정
- **제안**: Tailwind config에 `text-primary` 컬러 유틸리티 등록 여부 확인 후, 가능하면 `className="text-primary"` 사용
- **이유**: 이미 tailwind.config.ts에 primary 토큰이 매핑되어 있다면 인라인 불필요

---

### D. 검증 완료 (이상 없음)

| 항목 | 상태 |
|------|------|
| 페이지 헤더 폰트 패턴 (메인 3xl / 서브 2xl, italic extrabold) | ✅ 전체 통일 |
| 섹션 라벨 (`text-sm font-semibold text-stone-500`) | ✅ 전체 통일 |
| 설명 텍스트 (`text-sm text-stone-400`) | ✅ 전체 통일 |
| Primary CTA 버튼 스타일 | ✅ 전체 통일 |
| CSS 변수 컬러 시스템 (primary/accent/tribe colors) | ✅ 체계적 |
| glass-card / glass-card-light 구분 사용 | ✅ 적절 |
| 트라이브 컬러 일관성 | ✅ 전체 통일 |

---

## 작업 우선순위 제안

| 순서 | 항목 | 예상 영향 범위 |
|------|------|---------------|
| 1 | A1: focus:border-green 교체 | 1파일 |
| 2 | A2: place 검색 → glass-input 통일 | 1-2파일 |
| 3 | B3: font-heading Tailwind 유틸리티 등록 | config + ~20파일 |
| 4 | B1: --color-icon-inactive 변수 추가 | globals.css + 2파일 |
| 5 | B2: border-radius 규칙 결정 | 규칙 문서화 or 2-3파일 |
| 6 | C1-C2: 인라인 스타일 → 유틸리티 교체 | 점진적 |

## 판단 필요 사항

- **B2 border-radius**: 폼 카드(로그 입력, 로그인)만 `rounded-2xl`로 약간 더 둥근 것이 의도적 차별인지? → 사용자 결정 필요
- **B3 실행 범위**: font-heading 유틸리티화 시 ~20파일 일괄 수정 → 확인 필수 항목
