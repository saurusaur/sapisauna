# TRIBE PICKS — 홈 인라인 카드 플랜

## Context
비로그인 홈 CTA 버튼 아래에 유저의 사우나 스타일 관심을 유도하는 인터랙티브 카드. 온보딩과 동일한 카드형 트라이브 선택 UI + 오토 스크롤 설명.

## 구현

### 신규 컴포넌트: `src/components/features/tribe-picks-card.tsx`

```
┌──────────────────────────────────────────┐
│  PICK YOUR TRIBE                         │
│                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐           │
│  │  🔥  │  │  🛁  │  │  🥚  │           │
│  │      │  │      │  │      │           │
│  └──────┘  └──────┘  └──────┘           │
│  SAUNNER    BATHER     JIMI              │
│  사우나파    목욕파     찜질파             │
│                                          │
│  "사우나, 냉탕, 휴식의 반복으로           │
│   완성하는 나의 루틴"                     │
│                          전체 보기 →      │
└──────────────────────────────────────────┘
```

**카드 스타일** (온보딩 `w-24 h-24 rounded-xl` 축소 버전):
- 카드 크기: `w-20 h-20 rounded-xl` (온보딩보다 약간 작게)
- 활성: 트라이브 컬러 배경 + `shadow-md scale-105` + 이모지
- 비활성: `glass-card-light text-stone-400`
- 카드 아래: PERSONA (영문 볼드 이탤릭) + name (한글 11px)

**오토 스크롤 로직**:
- `useState(activeIndex)` — 0(saunner) → 1(bather) → 2(jimi) → 0 순환
- `useEffect` + `setInterval(3500ms)` — 자동 하이라이트 전환
- description 영역: `min-h-[40px]` 고정, `transition-opacity` 페이드
- 유저가 카드 클릭 → 인터벌 clear + 해당 트라이브 `/explore/type/{id}` 이동

**데이터 소스**: `TRIBES` 상수 — id, name, emoji, persona, description, color 모두 존재

### 홈 배치: `src/app/home/page.tsx`
- `!authUser`일 때만 렌더
- 위치: CTA 버튼 아래
- 로그인 유저: 넣지 않음

## 수정 파일
| 파일 | 변경 |
|------|------|
| `src/components/features/tribe-picks-card.tsx` | 신규 |
| `src/app/home/page.tsx` | 비로그인 시 TribePicksCard 렌더 |

## 검증
- 빌드 성공
- 비로그인 홈에서 카드 노출 + 3.5초 오토 스크롤
- 카드 클릭 → `/explore/type/{tribe}` 이동
- 로그인 홈에서는 미노출
