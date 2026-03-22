# Sauna Log — Visual Identity System (VIS)

> 최종 업데이트: 2026-03-22 (SA-리스트 소셜 UI / Toast / PlaceCard collection variant 추가)
> 기준: 현재 코드베이스 실측 기반 (globals.css, tailwind.config.ts, components/)

---

## 1. 브랜드 톤 & 원칙

**무드**: 따뜻한 온기 + 프리미엄 웰니스 + 간결한 기능미

| 원칙 | 정의 |
|------|------|
| Warm Minimal | 베이지/스톤 기반의 따뜻한 톤. 화려함보다 편안함 우선 |
| Glass Depth | Frosted glass 레이어로 공간감 표현. 플랫보다 한 단계 깊은 UI |
| Tribe Identity | 트라이브별 색상으로 유저 정체성 표현. 단, UI의 주색은 Primary(레드) 고정 |
| 3-Click Rule | 모든 핵심 액션은 3탭 이내 완료. 복잡한 입력 UI도 단계 분리 |

---

## 2. 색상 시스템 (Color Tokens)

### 2-1. 브랜드 컬러

| Token | CSS 변수 | Hex | Tailwind | 용도 |
|-------|----------|-----|----------|------|
| Primary | `--color-primary` | `#cc1a1a` | `bg-primary` / `text-primary` | CTA 버튼, 아이콘 active, 강조 |
| Primary Light | `--color-primary-light` | `#fde8e8` | `bg-primary-light` | 배지 배경, hover tint |
| Accent | `--color-accent` | `#d44040` | `bg-accent` / `text-accent` | 점수 표시, 보조 강조 |

---

### 2-2. 트라이브 컬러

| Tribe | Token | Hex | Tailwind | Story BG |
|-------|-------|-----|----------|----------|
| 목욕파 (Bather) | `--color-bather` | `#3B82F6` | `bg-bather` / `text-bather` | `#4a8b9c` |
| 사우너파 (Saunner) | `--color-saunner` | `#F97316` | `bg-saunner` | `#c25c4a` |
| 찜질파 (Jimi) | `--color-jimi` | `#22C55E` | `bg-jimi` / `text-jimi` | `#61906d` |

---

### 2-3. 성별 배지 컬러

트라이브 컬러와 별도 관리. 남성 배지는 bather 블루보다 짙은 남색으로 구분.

| Token | CSS 변수 | Hex | 용도 |
|-------|----------|-----|------|
| Male | `--color-male` | `#1D4ED8` | 남성전용 배지 텍스트 |
| Male Light | `--color-male-light` | `#DBEAFE` | 남성전용 배지 배경 |
| Female | `--color-female` | `#EC4899` | 여성전용 배지 텍스트 |
| Female Light | `--color-female-light` | `#FCE7F3` | 여성전용 배지 배경 |

사용처: `place-card.tsx`, `explore/[id]/page.tsx`

---

### 2-4. UI 서포팅 컬러

| Token | CSS 변수 | Hex | 용도 |
|-------|----------|-----|------|
| Background | `--background-rgb` | `#f5f2ef` | 앱 전체 배경 |
| Foreground | `--foreground-rgb` | `#2a2222` | 기본 텍스트 |
| Card | `--color-card` | `#faf8f6` | 카드 배경 (베이스) |
| Border | `--color-border` | `#e2deda` | 경계선, 구분선 |
| Muted | `--color-muted` | `#e8e4e0` | 비활성 배경 |
| Muted FG | `--color-muted-fg` | `#726e6e` | 비활성/보조 텍스트 |
| Icon Inactive | `--color-icon-inactive` | `#d6d3d1` | 비활성 아이콘 |

---

### 2-5. 텍스트 컬러 계층 (Tailwind Stone Scale)

| Level | Tailwind | 용도 |
|-------|----------|------|
| Primary Text | `text-stone-700` | 카드 제목, 주 텍스트 |
| Secondary Text | `text-stone-500` | 보조 정보 |
| Tertiary Text | `text-stone-400` | 날짜, 주소, 힌트 |
| Disabled Text | `text-stone-300` | 구분자(·), 비활성 |
| Accent Text | `text-accent` | 점수, 강조 수치 |

---

## 3. 타이포그래피 (Typography)

### 3-1. 폰트 패밀리

| Role | Font | 클래스 |
|------|------|--------|
| Heading / Display | Oswald | `font-heading` |
| Body (영문) | Libre Franklin | `font-sans` (기본) |
| Body (한글) | Noto Sans KR | `font-sans` (기본, 자동 fallback) |
| Icons | Material Symbols Outlined | `.material-symbols-outlined` |

### 3-2. 타입 스케일

| Level | Size | Weight | Font | 사용처 |
|-------|------|--------|------|--------|
| Page Title | text-2xl (24px) | 700 | Oswald | "HELLO SA-PIEN", "EXPLORE" |
| Section Title | text-base (16px) | 700 | sans | 섹션 헤더 |
| Card Title | text-sm (14px) | 500 | sans | 카드 장소명 |
| Body | text-xs (12px) | 500 | sans | 카드 상세 텍스트 |
| Caption | text-xs (12px) | 400 | sans | 날짜, 주소, 힌트 |
| Micro | 10px | 500 | sans | 배지, 칩(sm), 탭 라벨 |
| Score | text-xs (12px) | 700 | sans | 평점 수치 |

### 3-3. 아이콘 크기 시스템

| 클래스 | 크기 | 용도 |
|--------|------|------|
| `.icon-xsm` | 10px | 배지 내 소형 아이콘 |
| `.icon-sm` | 18px | 보조 아이콘 |
| `.icon-md` | 24px | 기본 아이콘 (네비, 버튼) |
| `.icon-lg` | 32px | 대형 아이콘 (온보딩 등) |

> 컴포넌트 내부에서 12px·14px·16px 인라인 사용 존재. 신규 개발 시 위 4단계 중 가장 가까운 것 사용 권장.

---

## 4. 공간 시스템 (Spacing & Layout)

### 4-1. 레이아웃 컨테이너

```
max-w-md (448px) — 앱 전체 컨테이너
pb-24             — BottomNav 높이 보정 (페이지 하단 패딩)
px-4 (16px)       — 페이지 좌우 여백 (표준)
```

### 4-2. 컴포넌트 내부 패딩

| 컴포넌트 | Padding |
|----------|---------|
| PlaceCard / RecordCard | `p-3` (12px) |
| BottomCTA 버튼 내부 | `py-4` (16px) |
| Chip (md) | `px-2.5 py-1` |
| Chip (sm) | `px-2 py-0.5` |
| SelectButton | `px-3 py-1.5` |
| BottomNav | `py-2.5 pb-3` |

### 4-3. 섹션 간격

| 용도 | Gap |
|------|-----|
| 섹션 간 | `mb-6` (24px) |
| 카드 리스트 | `gap-2` (8px) |
| 칩 그룹 | `gap-1` (4px) |
| 인라인 요소 | `gap-1` (4px) |

---

## 5. 이펙트 시스템 (Effects)

### 5-1. Glass 레이어 3종

| 클래스 | 배경 opacity | blur | border | 용도 |
|--------|-------------|------|--------|------|
| `.glass-card-light` | 55% white | 12px | 0.5px white/65% | 카드, 폼 섹션, 인터랙티브 패널 전반 |
| `.glass-input` | 65% white | 8px | 0.5px white/80% | 입력 필드, 검색바 |
| `.glass-chip` | 30% white | — | 1px border | 칩 미선택 상태 |

> 앱 전체 `glass-card-light` 단일 클래스로 통일. `glass-card`는 제거됨.

### 5-2. 그림자 시스템

| 토큰 | 값 | 용도 |
|------|-----|------|
| `shadow-glass` | `var(--glass-shadow)` | 헤더, floating 요소 |
| 카드 기본 | 3px 12px, opacity 0.10 | glass-card 계열 |
| CTA 버튼 | `0 8px 30px -4px rgba(204,26,26,0.4)` | `.btn-primary` |
| BottomNav FAB | `0 4px 16px rgba(204,26,26,0.35)` | 중앙 + 버튼 |
| BottomNav 바 | `0 -4px 16px rgba(0,0,0,0.06)` | 네비게이션 바 |

### 5-3. Border Radius

| 토큰 | 값 | Tailwind | 용도 |
|------|-----|----------|------|
| `--radius` | 0.75rem (12px) | `rounded-glass` / `rounded-xl` | 카드, 모달, 버튼 |
| Pill | 9999px | `rounded-full` | 칩, 배지, FAB |
| 소형 | 0.5rem (8px) | `rounded-lg` | 툴팁, 소형 패널 |

---

## 6. 컴포넌트 시스템 (Component Library)

### 6-1. 인터랙티브 요소 계층

```
Primary Action   → .btn-primary (전체 너비 CTA, BottomCTA)
Secondary Action → SelectButton (옵션 선택) / Chip interactive (필터/태그)
Tertiary Action  → 아이콘 버튼 (즐겨찾기, X 닫기 등)
Navigation       → BottomNav 탭, FAB
```

### 6-2. 버튼 Active State 표준

**Primary 버튼 (배경색 있는 버튼 전체):**
```
hover:  brightness(1.08)               — 살짝 밝아짐
active: scale(0.96) + brightness(0.9)  — 눌려 들어가는 물리적 느낌
```
- Tailwind: `active:scale-[0.96] active:brightness-90`
- globals.css `.btn-primary`: `transform: scale(0.96); filter: brightness(0.9);`

**탭 가능 아이템 (버튼이 아닌 리스트/카드 아이템):**
```
active: scale(0.95) — brightness 없음 (profile-card 기준)
```

**적용 범위:**

| 위치 | 클래스 |
|------|--------|
| `.btn-primary` (globals.css) | transform + filter (CSS) |
| BottomNav FAB | `active:scale-[0.96] active:brightness-90` |
| ConfirmModal 확인 버튼 | `active:scale-[0.96] active:brightness-90` |
| log/page 버튼 | `active:scale-[0.96] active:brightness-90` |
| error.tsx 버튼 | `active:scale-[0.96] active:brightness-90` |
| story/page 버튼 3곳 | `active:scale-[0.96] active:brightness-90` |

**Chip vs SelectButton 구분 기준**

| | Chip | SelectButton |
|--|------|--------------|
| 패딩 | `px-2.5 py-1` (촘촘) | `px-3 py-1.5` (여유) |
| 아이콘 | 14px | 16px |
| 비선택 BG | `glass-chip` (30% white) | `glass-input` (65% white + shadow) |
| 용도 | 필터 태그, 정적 태그 | 옵션 선택 (동행자, 목적 등) |

---

### 6-2. 컴포넌트 카탈로그

#### Chip (`ui/chip.tsx`)
```
Props: label, icon?, selected?, onClick?, size('sm'|'md'), color?
States: static | interactive-unselected | interactive-selected
Size sm: text-[10px] px-2 py-0.5, icon 12px
Size md: text-xs px-2.5 py-1, icon 14px
Selected BG: color prop (기본 var(--color-primary))
```

#### SelectButton (`ui/select-button.tsx`)
```
Props: label, icon?, selected?, onClick, color?
States: unselected | selected
Size: text-xs px-3 py-1.5, icon 16px
Selected BG: color prop
Unselected BG: glass-input 스타일 (인라인)
```

#### BottomCTA (`ui/bottom-cta.tsx`)
```
Props: onClick, disabled?, className?, children
Style: .btn-primary (100% width, py-4)
위치: 하단 고정
```

#### Toggle Switch (`ui/toggle-switch.tsx`)
```
States: on | off
On: primary color BG + circle right
Off: stone BG + circle left
크기: w-11 h-6
```

#### PlaceCard (`features/place-card.tsx`)
```
Props: place, onClick, variant('default'|'minimal'|'collection'), isFavorited?, onToggleFavorite?,
       collectionMemo?: string  ← collection variant 전용
Variants:
  default:    장소명 + 주소 + 시설칩(max 3) + ScoreBadge
  minimal:    장소명 + 주소 + ScoreBadge
  collection: default + 하단 메모 블록 (리스트 생성자 코멘트)
Glass: glass-card-light
Score: <ScoreBadge> 컴포넌트 사용

[collection variant 메모 블록]
  위치: facilityChips 아래, scoreDisplay 위
  스타일: text-xs text-stone-500, 좌측 2px primary 보더 (인용 느낌), px-2 py-1
  줄수: 최대 2줄 (line-clamp-2)
```

#### RecordCard (`features/record-card.tsx`)
```
Props: log(LogWithPlace), onClick
Row1: 장소명 | deeplog아이콘 + tribe이모지
Row2: 상세텍스트 (getDetailText)
Row3: ScoreBadge | 닉네임·날짜
Glass: glass-card-light
```

#### ScoreBadge (`features/score-badge.tsx`)
```
Props: score, count?, descriptor?, showMax?(기본 true), className?
Icon: 'move' (Material Symbols), accent color, 14px
Format: "{score}/5 · {descriptor} · {count}건의 기록"
사용처: RecordCard, PlaceCard (공통)
```

#### DataState (`ui/data-state.tsx`)
```
States: loading | error | empty
Loading: progress_activity icon (회전)
Error: error icon (빨간)
Empty: 아이콘 + 메시지 (stone-300)
```

#### ConfirmModal (`ui/confirm-modal.tsx`)
```
Layout: fixed overlay (z-50) + centered card
BG: black/40
Card: white, rounded-2xl
Buttons: 취소(회색) + 확인(primary)
```

#### TypeTab (`ui/type-tab.tsx`)
```
Tabs: bather | saunner | jimi
Active: tribe color BG + white text + shadow
Inactive: glass-card-light + stone text
```

#### BottomNav (`bottom-nav.tsx`)
```
Structure: 좌2탭 [내기록, 탐색] + FAB 홈(중앙) + 우2탭 [사-리스트, 마이]
FAB (홈):
  - 항상 primary color BG, w-14 h-14, rounded-full, raised (-top-5)
  - Active: 아이콘 FILL=1 (채워진 home 아이콘)
  - Inactive: 아이콘 FILL=0 (아웃라인 home 아이콘)
  - 링/shadow 변화 없음 — 아이콘 fill만으로 상태 표현
일반 탭 (내기록/탐색/마이):
  - Active: primary color 텍스트+아이콘
  - Inactive: stone-400
Disabled tab: opacity-20 (사-리스트 — 미출시)
Glass BG: hsl(var(--glass)) + backdrop-blur-xl
```

#### Badge24h (`features/place-card.tsx` — named export)
```
Style: text-[10px] px-1.5 py-0.5 rounded-full
Color: primary-light BG + primary text
사용처: PlaceCard 내 자동 표시, explore/[id] 직접 import
```

---

## 7. 슬라이더 & 입력 컴포넌트 (`slider.tsx`)

| Variant | 용도 | 형태 |
|---------|------|------|
| `default` (Slider) | 온도, 점수 가로 슬라이더 | range input |
| `chip` | 1-5점 원형 칩 선택 | 원형 버튼 5개 |
| RoutineCounter | 시간/분 증감 | -/값/+ 컨트롤 |
| Counter | 세트 수 카운터 | -/값/+ + 단위 |

비활성 상태: opacity + pointer-events-none → 탭하면 예시값으로 활성화

---

## 8. 애니메이션 시스템

| 이름 | 설정 | 용도 |
|------|------|------|
| `animate-fade-in` | 0.3s ease-out, translateY(4px→0) | 콘텐츠 마운트 |
| `animate-intro-up` | 0.7s cubic-bezier, translateY(16px→0) + scale | 페이지 진입 |
| `animate-intro-up-slow` | 1.4s (동일 easing) | 온보딩 등 느린 진입 |
| `animate-steam-float` | 4s ease-out forwards | 증기 연출 |
| `animate-card-flip` | 1.4s ease-in-out, rotateY | 카드 뒤집기 |

---

## 9. SA-리스트 소셜 UI 패턴 (미구현 — 설계 기준)

### 9-1. SA-리스트 화면 2레이어 구조

```
[SA-리스트 피드]          →  커버카드 목록
      ↓ 탭
[리스트 상세 페이지]       →  PlaceCard (collection variant) 목록
```

### 9-2. 커버카드 레이아웃

타인/내 리스트 최대한 동일. **차이는 헤더 배지와 하트 탭 가능 여부 두 가지만.**

```
┌─────────────────────────────────┐
│  리스트 제목       [공개]* [···] │  *내 리스트만. 타인 리스트 없음
│  @username · 장소 N개            │
│  "리스트 전체 설명 메모..."       │  (없으면 행 생략)
│  [사우나A] [사우나B] [사우나C]+N │  ← 장소명 칩 (정적, 탭 불가)
├─────────────────────────────────┤
│  [♡ 구독  24명]          공유↗  │
└─────────────────────────────────┘
```

**칩**: 장소명(사우나명) — PlaceCard의 시설유형 칩과 다름. 리스트에 포함된 장소 미리보기.

**타인 vs 내 리스트 차이:**

| | 타인 리스트 | 내 리스트 |
|--|------------|----------|
| 헤더 배지 | 없음 | `[공개]` / `[비공개]` 토글 배지 |
| 구독 버튼 | 탭 가능 | 읽기전용 (카운트만 표시) |
| 3-dot 메뉴 | 신고 | 편집 / 삭제 |

### 9-3. 구독 버튼 (하트 + 레이블 통합)

구독 카운터는 하트로 통합. 레이블 "구독"은 유지하여 액션 의도를 명확히.

```
미구독: [ ♡  구독  24명 ]   → glass-input 스타일 (SelectButton 비선택)
구독중: [ ♥  구독중 24명 ]  → primary color BG + white text (SelectButton 선택)
```

- 상태 변경 = 버튼 시각 변경으로 충분 → **토스트 불필요**
- 구독 취소 시만: `toast.undo("구독 취소 · 되돌리기")`

### 9-4. 리스트 상세 페이지 내 PlaceCard

PlaceCard `collection` variant 사용. 장소별 코멘트(place-level memo)는 커버카드 메모(list-level memo)와 별개.

```
PlaceCard (collection variant)
┌─────────────────────────────────┐
│  사우나명                  ···   │
│  주소                            │
│  [시설칩] [시설칩]               │
│  ┊ "여기 세신사 실력이 진짜 최고" │  ← 장소별 코멘트 (좌측 2px primary 보더)
│  ♡ 3.8  ·  12건의 기록          │
└─────────────────────────────────┘
```

### 9-5. 공개/비공개 배지 (내 리스트)

```
[공개]   → primary-light BG + primary text  (24H 배지와 동일 스타일)
[비공개] → stone-100 BG + stone-500 text
```
- 탭하면 즉시 토글 → 배지 상태 변경 → 토스트 불필요
- 공개/비공개 2단. 비공개 리스트도 공유 버튼으로 링크 공유 가능 → 별도 "일부공개" 불필요

### 9-6. 공유 바텀시트

공개/비공개와 독립 (비공개 리스트도 공유 가능)

```
┌──────────────────────┐
│  이 리스트 공유하기   │
│  ─────────────────   │
│  🔗  링크 복사        │
│  📸  인스타 스토리     │  ← 기존 /story 연동
│  💬  카카오톡         │
└──────────────────────┘
```

### 9-7. Toast 시스템 (전역)

**사용 케이스 2가지만:**

| 타입 | 트리거 | 스타일 | 지속 |
|------|--------|--------|------|
| `error` | 네트워크 실패, 저장 실패 | primary-light BG + primary text | 4초 자동 소멸 |
| `undo` | 구독 취소, 좋아요 취소 | stone-800 BG + white text + "되돌리기" 버튼 | 5초 |

**위치:** 화면 하단, BottomNav 바로 위 (bottom: 80px)
**애니메이션:** animate-intro-up 재사용
**정상 작동 (좋아요 ON/OFF, 공개↔비공개):** 토스트 없음 — 버튼 상태 변경으로 충분

---

## 10. 신규 개발 체크리스트

새 화면/컴포넌트 개발 전 확인:

- [ ] 배경: `bath-tile-bg` 또는 `bg-[var(--background-rgb)]`
- [ ] 카드: `.glass-card-light` (신규 개발 기준)
- [ ] CTA: `.btn-primary` 또는 `<BottomCTA>`
- [ ] 알약형 태그: `<Chip>` (필터/태그) / `<SelectButton>` (옵션 선택)
- [ ] 색상: CSS 변수 우선, 직접 hex 금지
- [ ] 성별 배지: `--color-male` / `--color-female` 변수 사용
- [ ] 점수 표시: `<ScoreBadge>` 컴포넌트 사용
- [ ] 상태: Empty / Loading / Error / Partial / Ideal 5종
- [ ] 터치 영역: `min-w-[44px]` / `min-h-[44px]`
- [ ] 소셜 액션 피드백: 정상 작동은 버튼 상태 변경으로 처리, 에러/undo만 Toast
- [ ] 공개/비공개: 2단 배지 토글. 공유는 항상 별도 버튼

---

## 10. 파일 위치 레퍼런스

| 역할 | 경로 |
|------|------|
| CSS 변수 / 글로벌 스타일 | `src/app/globals.css` |
| Tailwind 설정 | `tailwind.config.ts` |
| 폰트 / 루트 레이아웃 | `src/app/layout.tsx` |
| 콘텐츠 상수 (아이콘, 트라이브) | `src/constants/content.ts` |
| UI 원자 컴포넌트 | `src/components/ui/` |
| 기능 컴포넌트 | `src/components/features/` |
| 그래프 SVG | `src/components/svg/` |
