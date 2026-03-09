# Lovable 디자인 분석 & 적용 가이드

> 분석일: 2026-03-09
> 키워드: glassmorphic, steamy, clean, minimal, modern
> 원칙: 기존 로직/기능 100% 보존, 스타일만 교체

---

## 1. 디자인 토큰 (CSS Variables from Lovable)

### 컬러 시스템

```css
:root {
  /* 배경/전경 */
  --background: 30 25% 95%;        /* #f5f2ef — 따뜻한 베이지 (현재 #faf9f7보다 살짝 따뜻함) */
  --foreground: 0 10% 15%;         /* #2a2222 — 다크 브라운 (현재 #444440보다 어두움) */

  /* 카드/팝오버 */
  --card: 30 20% 98%;              /* #faf8f6 — 거의 흰색, 따뜻한 톤 */
  --card-foreground: 0 10% 15%;    /* #2a2222 */

  /* Primary = 레드 (현재 그린에서 변경!) */
  --primary: 0 80% 45%;            /* ~#cc1a1a — 딥 레드 */
  --primary-foreground: 0 0% 100%; /* 흰색 */

  /* Secondary = 틸/세이지 그린 (현재 오렌지에서 변경!) */
  --secondary: 165 30% 42%;        /* ~#4b8a7a — 세이지 그린 */
  --secondary-foreground: 0 0% 100%;

  /* Muted */
  --muted: 30 15% 90%;             /* #e8e4e0 */
  --muted-foreground: 0 5% 45%;    /* #726e6e */

  /* Accent = 레드 계열 */
  --accent: 0 65% 52%;             /* ~#d44040 — 밝은 레드 */
  --accent-foreground: 0 0% 100%;

  /* Border/Input */
  --border: 30 12% 87%;            /* #e2deda */
  --input: 30 12% 87%;

  /* 글래스모픽 전용 */
  --glass: 0 0% 100% / .35;               /* 반투명 흰색 */
  --glass-border: 0 0% 100% / .45;        /* 글래스 보더 */
  --glass-highlight: 0 0% 100% / .2;      /* 하이라이트 */
  --glass-shadow: 0 12px 40px -8px hsl(0 10% 15% / .1),
                  0 4px 16px -4px hsl(0 10% 15% / .08),
                  0 0 0 .5px hsl(0 0% 100% / .3);  /* 다층 섀도우 */

  --radius: .75rem;                /* 12px 기본 라운딩 */
}
```

### 컬러 비교 (현재 vs Lovable)

| 역할 | 현재 | Lovable | 변경 |
|------|------|---------|------|
| **배경** | `#faf9f7` (쿨 화이트) | `#f5f2ef` (따뜻한 베이지) | 약간 따뜻하게 |
| **전경 텍스트** | `#444440` (미디엄 그레이) | `#2a2222` (다크 브라운) | 더 진하게 |
| **Primary** | `#2d8a6e` (그린) | `#cc1a1a` (딥 레드) | ⚠️ 대폭 변경 |
| **Secondary** | `#e07b3c` (오렌지) | `#4b8a7a` (세이지 그린) | ⚠️ 대폭 변경 |
| **카드 배경** | 흰색 `#fff` | `#faf8f6` (웜 화이트) | 미세 변경 |
| **보더** | `#e5e7eb` (쿨 그레이) | `#e2deda` (웜 베이지) | 톤 변경 |

### 폰트 시스템

| 역할 | 현재 | Lovable |
|------|------|---------|
| **본문 (한글)** | Pretendard Variable | DM Sans + Noto Sans KR |
| **영문/숫자** | DM Sans | DM Sans (동일) |
| **타이틀** | Cormorant Garamond (serif) | 이탤릭 세리프 (HELLO SA-PIEN, EXPLORE, SETTINGS 등) |
| **본문 weight** | 400 | 500 |
| **헤딩 weight** | 600-700 | 700-800 (더 볼드) |

---

## 2. 화면별 분석 & 불일치 사항

### ✅ 적용할 Lovable 레이아웃 (코드에 반영)

#### 2-1. 홈 화면 (Home.png)
- **헤더**: "HELLO SA-PIEN" 이탤릭 볼드 세리프 (빨간색 포인트)
- **달력**: 글래스 카드 안에 주간 뷰, "오늘" 버튼 빨간색
- **오늘 선택 날짜**: 빨간 배경 + 흰 텍스트 (현재: 다크 배경)
- **빈 상태**: "기록이 없습니다" + "기록 시작하기" 아웃라인 버튼
- **추천 섹션**: "다음은 여기 어때요?" + 가로 스크롤 카드 (별점 빨간별)
- **네비바**: 흰 배경, 빨간 중앙 + 버튼, "기록하기" 라벨

**⚠️ 불일치 - 확인 필요:**
- 현재 Primary가 그린 → Lovable은 레드. **Primary 컬러를 레드로 변경할지?**
- 달력이 현재 월간 뷰 → Lovable은 주간 뷰. **주간/월간 어떤 것을 유지?**
- 현재 "전체 보기" 링크 그린 → Lovable은 빨간색

#### 2-2. 장소 선택 (place search.png)
- **검색바**: 글래스 카드 스타일, 라운드 코너
- **최근 방문**: 핑크빨간 위치 핀 아이콘, 화살표 chevron
- **내 주변**: 글래스 카드, "24시" 빨간 배지, 시설 칩 (회색 아웃라인), 빨간별 평점
- **직접 장소 추가**: 하단 빨간 텍스트 링크

**⚠️ 불일치:**
- 현재 시설 칩이 컬러풀 → Lovable은 모노크롬 회색 아웃라인 칩
- 현재 "직접 장소 추가"가 dashed 박스 → Lovable은 텍스트 링크

#### 2-3. 퀵 로그 (Screenshot + quick log2.png)
- **헤더**: 장소명 볼드, "카드 생성" 빨간 텍스트
- **날짜/시간**: 아이콘 + 텍스트 인라인, 각자 텍스트 클릭시 날짜/시간 변경 가능한 창이 드롭다운 됨
- **타입 선택**: 🔥 사우너파 드롭다운
- **슬라이더**: 빨간 thumb, 회색 트랙, 큰 온도 숫자 (빨간색, 볼드)
- **토토노이/또갈래요**: 원형 넘버 칩 (1-5), 선택 시 빨간 배경
- **루틴**: 글래스 카드 안에 HEAT/ICE/PAUSE/REPEAT 행
- **저장 버튼**: 풀 와이드, 빨간 배경, 라운드

**⚠️ 불일치:**
- 현재 슬라이더 thumb 오렌지 → Lovable은 빨간색
- 현재 점수 칩이 없음 (슬라이더) → Lovable은 1-5 원형 칩 UI. **슬라이더를 칩으로 변경할지?**
- 현재 저장 버튼 그린 → Lovable은 빨간

#### 2-4. 딥 로그 (deep log1.png, deep log2.png)
- **칩 선택**: 회색 아웃라인 칩, 선택 시 진한 배경
- **토글**: "이용"/"이용 함" 텍스트 버튼 (빨간 배경 when active)
- **매점 만족도**: 원형 넘버 칩 (퀵로그와 동일 패턴)
- **비용 입력**: 글래스 인풋 필드

**⚠️ 불일치:**
- 현재 세신/매점 토글이 초록 왼쪽 보더 → Lovable은 "이용 함" 칩 버튼(빨간)
- 딥로그 라벨 스타일 다름 (현재: 볼드, Lovable: 볼드 + 간격 더 넓음)

#### 2-5. 탐색 (Explore.png)
- **헤더**: "EXPLORE" 이탤릭 볼드 세리프 (홈과 동일 스타일)
- **검색바**: 글래스 필
- **필터**: "필터" 칩 + "추천순" 드롭다운
- **TRIBE PICKS**: 이모지 + 탭 버튼 (선택 시 연한 배경 + 테두리)
- **장소 카드**: 글래스 카드, "24H" 빨간 배지, 빨간별 평점
- **전체 보기**: 빨간 텍스트 링크

**⚠️ 불일치:**
- 현재 Tribe 탭이 컬러풀 (파/주/초) → Lovable은 모노크롬(선택 시만 연한 배경)
- 현재 "전체 보기" 그린 → Lovable은 빨간

#### 2-6. 장소 상세 (place details1.png, place details 2.png)
- ❌ **유저 지시: 현재 코드의 레이아웃 유지** (Lovable 무시)
- 단, 컬러/폰트/글래스 효과는 Lovable 스타일 적용

#### 2-7. 스토리 프리뷰 (Story preview.png)
- 다크 배경, 카드 중앙 배치
- "TEMP DELTA" 라벨 + 큰 숫자 (85°C)
- 루틴 요약 (10, 2, 5, 3 원형 배지)
- 하단 버튼 3개 (사진 업로드, 공유, 저장)
- **전반적 구조는 현재와 유사**

**⚠️ 불일치:**
- Lovable 카드 디자인이 더 세련됨 (이미지 배경 + 오버레이)
- 하단 버튼 아이콘/라벨 다름

#### 2-8. 기록 완료 (Log Complete.png)
- 큰 🔥 이모지 중앙
- "기록 완료!" 볼드 헤딩
- 장소명 + 날짜 서브텍스트
- 3단 버튼: 빨간 "내 기록 보기" → 아웃라인 "한 번 더" → 텍스트 "홈으로"

**⚠️ 불일치:**
- 현재 primary 버튼 그린 → Lovable 빨간

#### 2-9. 온보딩 (onboarding1.png, onboarding 2.png)
- **Step 1**: 로고 중앙 + 닉네임 입력 + "중복 확인" + 프로그래스 dots
- **Step 2**: "나의 사우나 라이프 스타일은?" 볼드 헤딩, 3개 타입 카드 (가로 배열)
- 선택 시 빨간 뱃지 (순위 번호)
- "시작하기" 빨간 버튼

**⚠️ 불일치:**
- 현재 타입 카드 세로 배열 → Lovable 가로 배열. **배열 방향 변경할지?**
- 현재 선택 배경이 타입별 컬러 → Lovable은 선택 시 연한 배경 + 빨간 뱃지

#### 2-10. 설정 (Settings.png)
- **헤더**: "SETTINGS" 이탤릭 볼드 세리프
- 글래스 카드로 섹션 구분
- 토글 스위치: 빨간/오렌지 계열
- "로그아웃" 빨간 텍스트

**⚠️ 불일치:**
- 현재 "마이" 헤딩 → Lovable "SETTINGS"

---

## 3. 주요 불일치 목록 (사용자 결정 필요)

### A. 컬러 시스템 변경 (가장 큰 결정)

| # | 항목 | 현재 | Lovable | 질문 |
|---|------|------|---------|------|
| A1 | **Primary 컬러** | 그린 `#2d8a6e` | 레드 `#cc1a1a` | Primary를 레드로 전면 변경? |
| A2 | **CTA 버튼** | 그린 배경 | 레드 배경 | 저장/기록 버튼 모두 레드로? |
| A3 | **점수/메트릭** | 오렌지 `#e07b3c` | 빨간별 + 빨간 숫자 | 점수 표시도 레드로? |
| A4 | **타입별 컬러** | 파/주/초 (bather/saunner/jimi) | Lovable은 모노크롬 | 타입 컬러 유지 or 모노크롬? |

### B. UI 패턴 변경

| # | 항목 | 현재 | Lovable | 질문 |
|---|------|------|---------|------|
| B1 | **토토노이/또갈래요** | 슬라이더 | 원형 넘버 칩 (1-5) | 칩 UI로 변경? |
| B2 | **온보딩 타입 카드** | 세로 3개 | 가로 3개 | 가로 배열로 변경? |
| B3 | **달력 뷰** | 월간 그리드 | 주간 1줄 (접기 가능) | 유지 or 변경? |
| B4 | **시설 칩** | 컬러풀 배경 | 회색 아웃라인 | 모노크롬으로? |
| B5 | **세신/매점 토글** | 초록 좌측 보더 + 토글 | "이용 함" 빨간 칩 | 스타일 변경? |

### C. 타이포그래피

| # | 항목 | 현재 | Lovable | 질문 |
|---|------|------|---------|------|
| C1 | **한글 폰트** | Pretendard Variable | DM Sans + Noto Sans KR | 폰트 변경? |
| C2 | **페이지 헤딩** | 일반 볼드 한글 | 영문 이탤릭 세리프 (EXPLORE, SETTINGS 등) | 영문 세리프 헤딩? |
| C3 | **본문 weight** | 400 | 500 | 전체 약간 볼드하게? |

### D. 유지할 현재 레이아웃 (유저 지시)

| 화면 | 유지 이유 |
|------|----------|
| **장소 상세 (place details)** | 유저 지시: 현재 코드 레이아웃 유지 |
| **로그 프리뷰 (log preview)** | 유저 지시: 현재 코드 레이아웃 유지 |

위 화면들은 컬러/폰트/글래스 효과만 Lovable 스타일로 적용, 레이아웃 구조는 현재 유지.

---

## 4. 글래스모픽 효과 적용 가이드

### 새로 추가할 CSS 유틸리티

```css
/* 글래스 카드 */
.glass-card {
  background: hsl(var(--glass));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 0.5px solid hsl(var(--glass-border));
  box-shadow: var(--glass-shadow);
  border-radius: var(--radius);
}

/* 글래스 인풋 */
.glass-input {
  background: hsl(0 0% 100% / .5);
  backdrop-filter: blur(8px);
  border: 1px solid hsl(var(--glass-border));
  border-radius: var(--radius);
}

/* 글래스 칩 */
.glass-chip {
  background: hsl(0 0% 100% / .3);
  border: 1px solid hsl(var(--border));
  border-radius: 9999px;
}
```

### Tailwind 확장 (tailwind.config.ts)

```ts
// 추가할 커스텀 유틸리티
extend: {
  colors: {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    muted: 'hsl(var(--muted))',
    accent: 'hsl(var(--accent))',
    border: 'hsl(var(--border))',
    card: 'hsl(var(--card))',
  },
  boxShadow: {
    glass: 'var(--glass-shadow)',
  },
  backdropBlur: {
    glass: '12px',
  },
}
```

---

## 5. 적용 순서 (제안)

1. **디자인 토큰** — globals.css + tailwind.config.ts (모든 화면에 영향)
2. **글래스 유틸리티** — 공통 CSS 클래스 추가
3. **화면별 적용** — 홈 → 퀵로그 → 탐색 → 딥로그 → 설정 → 온보딩 → 완료 순
4. **제외 화면** — 장소 상세, 로그 프리뷰는 컬러만 적용

---

## 6. 출처 파일

- 스크린샷: `docs/plans/LOVABLE_Screenshots/` (15개 파일)
- CSS 토큰: `docs/plans/LOVABLE_design_info.md`
- 프롬프트 원본: `docs/plans/LOVABLE_design_prompts.md`
