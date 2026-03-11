# Lovable 디자인 프롬프트 가이드

> 목적: Lovable에서 사우나 로그 앱의 디자인 시안을 생성하여 Claude Code 구현 시 시각 레퍼런스로 활용
> 생성일: 2026-03-08
> 주의: Lovable이 만든 **코드는 버리고, 디자인(스크린샷/컬러/레이아웃)만 참고**

---

## 공통 스타일 지시문 (모든 프롬프트 앞에 붙이기)

```
Design Style: Modern minimal with glassmorphism elements.
- Use frosted glass cards (backdrop-blur, semi-transparent white/dark backgrounds, subtle borders)
- Create depth with layered shadows (soft, multi-level drop shadows)
- Color palette: Deep charcoal base (#1a1a2e or similar dark), with a warm accent color (coral/amber) and a cool secondary (teal/sage green)
- Typography: Clean sans-serif for body (like Inter or DM Sans), elegant serif for titles/headings (like Cormorant Garamond or Playfair Display). Key page headings should be BOLD and high-contrast (font-weight 700-800), creating strong visual anchors. Use large size (24-32px) for primary headings to establish clear hierarchy.
- Spacing: Generous whitespace, 16-24px padding, 12-16px gaps
- Border radius: Consistent rounded corners (12-16px for cards, 8px for chips/buttons)
- Icons: Material Symbols Outlined style (thin, modern)
- Mobile-first: Max width 390px, standard mobile viewport
- Subtle gradients and glass reflections for premium feel
- Depth cues: Cards float above background with layered shadows, elements have clear z-axis hierarchy
- Reference apps: Strava (bold metrics display), Nike Run Club (dark minimal), Gentler Streak (warm wellness tone)
```

---

## 프롬프트 1: 홈 화면 (Home)

```
Create a mobile app home screen for "사-피" (SA-PI), a sauna logging & review app for Korean sauna enthusiasts.

[위 공통 스타일 지시문 붙이기]

## Screen: Home (Authenticated User)

### Layout (top to bottom):
1. **Header area**
   - Greeting: "HELLO SA-PIEN" in elegant serif font, left-aligned
   - Subtitle: User's nickname + today's date
   - Small profile avatar or icon (top-right)

2. **Calendar section** (glassmorphic card)
   - Compact monthly calendar grid (Mon-Sun)
   - Days with sauna visits marked with small colored dots:
     - Blue dot = 🛁 Bath type
     - Orange dot = 🔥 Sauna type
     - Green dot = 🥚 Jjimjil type
   - Today highlighted with a circle
   - Month/year header with left/right navigation arrows
   - "전체 보기" (View all) text link at bottom-right

3. **Today's record section** (below calendar)
   - If records exist: Horizontal scrollable cards (snap scroll, ~85% width each)
   - Each card is a glassmorphic card showing:
     - Place name (top-left, small)
     - Key metric in large bold number (e.g., "42°C" or "4.2")
     - Type emoji + category label
     - Revisit score (small, bottom-right, warm accent color)
   - If no record: Subtle empty state with "오늘의 기록을 남겨보세요" + soft CTA button

4. **Recommendation section** (placeholder)
   - "다음은 여기 어때요?" heading
   - 1-2 place suggestion cards (glass effect, horizontal scroll)

### Bottom Navigation Bar (fixed):
   - 5 items: 홈 | 사-리스트 | [RAISED CENTER BUTTON] | 탐색 | 마이
   - Center button: Large raised circular button with "+" icon, floating above the nav bar
   - "기록하기" label below the center button
   - Active tab indicated by accent color
   - Frosted glass background for the nav bar (backdrop-blur)
   - Optional: Speech bubble tooltip above center button: "오늘 사우나 어땠나요?"
```

---

## 프롬프트 2: 장소 선택 화면 (Place Selection)

```
Create a mobile app screen for selecting a sauna/bathhouse location.

[위 공통 스타일 지시문 붙이기]

## Screen: Place Selection

### Layout:
1. **Header**
   - Back arrow (left)
   - Title: "장소 선택" (center)

2. **Search bar** (glassmorphic, prominent)
   - Search icon + placeholder "사우나 검색..."
   - Frosted glass background
   - Rounded corners (full pill shape)

3. **Recent places section**
   - Section label: "최근 방문" with clock icon
   - 3 recent place items in a vertical list:
     - Each item: Location pin icon + Place name + Short address
     - Right arrow or chevron
     - Subtle glassmorphic card background
     - Tap → selects place

4. **Nearby places section**
   - Section label: "내 주변" with location icon
   - Vertical list of place cards, each containing:
     - Place name (bold) + "24시" badge (if 24h, small pill badge in accent color)
     - Address (gray, smaller text)
     - Facility chips row (horizontal scroll): Small rounded chips like "건식사우나", "냉탕", "외기욕" (max 5 visible + "+N" chip)
     - Bottom row: Average rating (star or score icon) + "N건의 기록" count
     - Glass card with subtle shadow

5. **Add place button** (bottom of list)
   - Dashed border card
   - "+" icon + "직접 장소 추가"
   - Subtle, secondary style
```

---

## 프롬프트 3: 퀵 로그 화면 (Quick Log)

```
Create a mobile app screen for logging a sauna visit (data entry form).

[위 공통 스타일 지시문 붙이기]

## Screen: Quick Log (사우너파/Sauna Type selected)

### Header:
- Back arrow (left)
- Place name centered (e.g., "스파랜드")
- "카드 생성" text button (right, accent color)

### Form content (single scrollable glassmorphic card):

1. **Visit info row**
   - Date picker: Calendar icon + "2026.03.08"
   - Time picker: "오후 3:00" dropdown
   - Compact horizontal layout

2. **Type selector**
   - Current: 🔥 사우너파 (with emoji, dropdown arrow)
   - Expandable dropdown with 3 options

3. **Main metrics section** (type-specific sliders)
   - Each metric in its own sub-section with:
     - Label (left) + Current value (right, large bold number in accent color)
     - Custom slider bar (glass track, accent-colored thumb)
     - Min/max labels below slider

   - **건식 사우나 온도**: 50°C — 130°C slider
   - **냉탕 온도**: 0°C — 30°C slider
   - **사우나 하이 (토토노이)**: 1 — 5 slider with emoji labels

4. **Routine section** (깔끔한 구분선 후)
   - Section header: "ROUTINE" in caps, small
   - 4 compact input rows:
     - 🔥 HEAT: ___분 (number input)
     - 🧊 ICE: ___분
     - 😮‍💨 PAUSE: ___분
     - 🔄 REPEAT: counter (- 3 +) with stepper buttons
   - Optional fields show placeholder, required fields show default

5. **Revisit score** (또 갈래요)
   - "또 갈래요" label
   - 1-5 slider with labels: 별로 / 무난 / 좋아 / 최고 / 인생
   - Current score displayed large in warm accent color

### Bottom: Fixed "저장" button (full width, accent gradient, glass effect)
```

---

## 프롬프트 4: 딥 로그 화면 (Deep Log)

```
Create a mobile app screen for detailed sauna visit logging (optional deep log).

[위 공통 스타일 지시문 붙이기]

## Screen: Deep Log (Detailed Record)

### Header:
- Back arrow + "Deep Log" title + "저장" button (right)

### Form content (scrollable, sections in glassmorphic cards):

1. **오늘의 경험 section** (glass card)
   - **탕 선택**: 4 chip buttons in a row (남탕/여탕/혼탕/개인탕), single select, glass chips with active state
   - **동행자**: 4 chip buttons (혼자/친구/가족/연인), single select
   - **방문 목적**: Multi-select chip grid (9 options like 휴식, 건강, 데이트, 해장, 운동 후 등)
     - Selected chips get accent color fill
   - **비용**: Currency selector (₩) + number input field
   - **혼잡도**: 4 chips (한산/보통/혼잡/만원)

2. **세신 section** (glass card, collapsible)
   - Toggle switch: "이용 함" (glassmorphic toggle)
   - If enabled: Satisfaction slider 1-5 appears with smooth animation
   - Left accent border (green/teal line) to indicate optional section

3. **매점 section** (glass card, collapsible)
   - Toggle switch: "이용 함"
   - If enabled:
     - Rating slider 1-5
     - Text input: "추천 메뉴 메모" placeholder
   - Left accent border

4. **메모 section** (glass card)
   - Textarea with 3 rows
   - Placeholder: "오늘의 사우나를 한 줄로..."
   - Character count indicator (optional)

### Visual notes:
- Each section card has subtle depth (layered shadows)
- Smooth expand/collapse animations for toggle sections
- Generous spacing between sections (16-20px)
```

---

## 프롬프트 5: 기록 상세 화면 (History Detail)

```
Create a mobile app screen showing a detailed view of a past sauna visit record.

[위 공통 스타일 지시문 붙이기]

## Screen: Record Detail View

### Header:
- Back arrow (left)
- Edit (pencil icon) + Delete (trash icon, subtle red) buttons (right)

### Content:

1. **Place header card** (prominent glassmorphic card, centered)
   - Place name (large, serif font, tappable → place detail)
   - Address below (smaller, gray)
   - Full date + time: "2026년 3월 8일 (토) 오후 3:00"
   - Subtle location pin icon

2. **Quick Log data card** (glass card)
   - Section header with type emoji: "🔥 사우너파"
   - Key-value grid layout (2 columns):
     - 건식 사우나: 95°C (large number, accent color)
     - 냉탕: 15°C
     - 토토노이: 4/5 (with filled dots or bar)
   - Routine summary row:
     - 🔥12분 → 🧊3분 → 😮‍💨5분 × 3세트
     - Compact, icon-based, horizontal
   - 또 갈래요 score: Large "4.0" in warm accent with label "최고"

3. **Deep Log data card** (glass card, if exists)
   - Section header: "Deep Log" with expand icon
   - Compact info rows:
     - 동행: 친구 | 목적: 휴식, 건강
     - 비용: ₩15,000 | 혼잡도: 보통
     - 세신: 만족 4/5 (if used)
     - 매점: 3/5 "식혜 추천" (if used)
     - 메모: "오늘 사우나 최고였다..." (if exists)

4. **Same place history** (glass card, if other records exist)
   - Header: "📍 스파랜드에서의 기록"
   - 2 compact record items:
     - Type emoji + category + date + key metric + revisit score
   - "더보기 (N개 더)" expandable link

5. **Action button** (bottom, fixed or inline)
   - "스토리 만들기" (full width, warm accent/gradient, glass effect)

### Visual emphasis:
- Key metrics (temperatures, scores) displayed in LARGE bold numbers
- Clear visual hierarchy: Place → Metrics → Details → History
- Depth: Cards layered with different shadow levels
```

---

## 프롬프트 6: 탐색 화면 (Explore)

```
Create a mobile app screen for discovering and browsing sauna/bathhouse places.

[위 공통 스타일 지시문 붙이기]

## Screen: Explore / Discovery

### Header:
- Title: "탐색" (left-aligned, large)

### Content:

1. **Search bar** (glassmorphic, full width)
   - Search icon + "장소명 또는 주소로 검색"
   - Pill shape, frosted glass

2. **Filter row** (below search)
   - "필터" toggle button (shows/hides filter panel)
   - "24시 영업" toggle chip
   - "정렬" dropdown: 추천순 / 인기순
   - Glass chip style for all filter controls

3. **Tribe Picks section** (recommendation)
   - Header: "TRIBE PICKS" with emoji indicators 🛁🔥🥚
   - Collapsible section (chevron icon)
   - **Type tab row**: 3 pill buttons (Bather/Saunner/Jimi)
     - Active tab: Filled with tribe color (blue/orange/green)
     - Inactive: Glass outline
   - **Top 3 recommended places** for selected tribe:
     - Horizontal scrollable cards OR vertical compact list
     - Each card: Place name + address + key stat + glass card style
     - "전체 보기 →" link at bottom

4. **All places section**
   - Header: "전체 장소"
   - Vertical list of place cards:
     - Place name (bold) + 24h badge (pill)
     - Address (gray)
     - Facility chips (horizontal, max 5)
     - Rating + record count
     - Glass card with depth shadow
   - "검색으로 더 찾아보세요" prompt at bottom

### Bottom Navigation: Same as home screen

### Visual notes:
- Tribe color coding should be consistent and recognizable
- Cards should feel "elevated" with layered shadows
- Search → results transition should feel smooth
```

---

## 프롬프트 7: 기록 히스토리 화면 (History)

```
Create a mobile app screen showing a user's sauna visit history with list and calendar views.

[위 공통 스타일 지시문 붙이기]

## Screen: History / My Records

### Header:
- Back arrow (left)
- View toggle: List icon / Calendar icon (right, glassmorphic toggle)

### Filter row (persistent):
- Type filter tabs: "전체" + 🛁 + 🔥 + 🥚
- Active tab: Filled with color, others glass outline
- Horizontal, compact

### VIEW 1: List Mode
- **Search bar** (optional, glassmorphic)
- **Grouped by month**: "2026년 3월" section headers
- **Record cards** in each group:
  - Compact glassmorphic cards
  - Left: Type emoji + category badge
  - Center: Place name + key detail text (e.g., "건식 95°C · 냉탕 15°C")
  - Right: Revisit score in accent color (e.g., "4.0")
  - Date below place name (small, gray)
  - Tap → detail page

### VIEW 2: Calendar Mode
- **Month navigation**: ← 2026년 3월 →
- **Month summary bar**: "3월 · 8회 방문 · 🛁3 🔥4 🥚1"
- **Calendar grid** (glassmorphic card):
  - 7 columns (월-일)
  - Date cells with:
    - Day number
    - Colored dots below (tribe colors, multiple if multiple visits)
  - Today: Circle highlight
  - Selected date: Accent background
- **Selected date detail** (below calendar):
  - Shows record cards for selected date
  - Same card style as list mode
  - "더보기" if multiple records

### Bottom Navigation: Same as home screen
```

---

## 프롬프트 8: 장소 상세 화면 (Place Detail)

```
Create a mobile app screen showing detailed information about a sauna/bathhouse place.

[위 공통 스타일 지시문 붙이기]

## Screen: Place Detail

### Header:
- Back arrow (left)
- Favorite heart icon (right, toggle filled/outline, accent when active)
- Place name (center or below)

### Content:

1. **Place info hero card** (large glassmorphic card)
   - Place name (large, bold)
   - "24시" badge (if applicable, pill shape, accent color)
   - Address with subtle map pin icon
   - **Map links row**:
     - "네이버 지도" button (glass chip)
     - "구글 지도" button (glass chip)
     - External link icons

2. **Facilities section** (glass card)
   - Grouped by category with subtle section dividers:
     - 🔥 HEAT: Chips (건식사우나, 습식사우나, 불가마...)
     - 🧊 ICE: Chips (냉탕, 얼음탕, 아이스룸)
     - 😮‍💨 PAUSE: Chips (노천, 실내휴게)
     - ✨ BEYOND: Chips (노천탕, 미온탕, 찜질방...)
   - Each chip in glass style with category-matching subtle tint

3. **Amenities section** (glass card)
   - Chip grid: 드라이어무료, 수건, 샴푸, 충전, 워크스페이스...
   - Neutral glass chips

4. **Rating card** (prominent, glass)
   - "또 갈래요" large score: "4.2" in accent color
   - "N건의 기록" subtitle
   - Visual indicator (progress bar or radial gauge)
   - OR "아직 기록이 없어요" empty state

5. **Records at this place** (glass card)
   - Header: "이 장소의 기록"
   - 3 most recent record cards (compact)
   - "더보기 (N개 더)" expandable
   - Each: emoji + type + date + key metric + score

### Fixed bottom CTA:
- "이 장소에서 기록하기" (full width, accent gradient, glass, prominent shadow)
```

---

## 프롬프트 9: 설정 화면 (Settings/My Page)

```
Create a mobile app screen for user settings and profile management.

[위 공통 스타일 지시문 붙이기]

## Screen: Settings (마이페이지)

### Header:
- Title: "마이" (left-aligned, large)

### Content:

1. **Profile section** (glassmorphic card)
   - **Nickname row**:
     - Person icon + "닉네임" label
     - Current nickname value (right, gray) + chevron
     - Tap → edit nickname
   - **Divider** (subtle, 1px)
   - **Style row**:
     - Emoji icon + "나의 스타일" label
     - Current primary type displayed (e.g., "🔥 사우너파") + chevron
     - Tap → edit type preferences

2. **App settings section** (glassmorphic card)
   - Section title: "앱 설정" (small, above card)
   - **Notification row**:
     - Bell icon + "리마인더 알림" label
     - Toggle switch (right, glassmorphic toggle with accent color when on)

3. **App info section** (glassmorphic card)
   - Section title: "앱 정보" (small, above card)
   - Version: "v0.1.0" (non-clickable, gray)
   - 이용약관 (with chevron, tappable)
   - 개인정보처리방침 (with chevron, tappable)

4. **Logout button** (standalone, bottom)
   - "로그아웃" in red/coral text
   - Glass card style, full width
   - Tap → confirmation modal

### Visual notes:
- Clean, spacious settings layout
- Each section card clearly separated with generous gaps
- Settings rows have consistent height and padding
- Subtle hover/tap states on interactive rows

### Bottom Navigation: Same as home screen
```

---

## 프롬프트 10: 온보딩 화면 (Onboarding)

```
Create a mobile app onboarding flow with 2 steps for a sauna logging app.

[위 공통 스타일 지시문 붙이기]

## Screen: Onboarding (2 Steps)

### Step 1: Nickname Input
- App logo: "사-피" in elegant serif (large, centered)
- Tagline: "사-피엔스의 사우나 기록" (below logo, smaller)
- Large vertical spacing
- Heading: "닉네임을 입력해주세요"
- **Input field** (glassmorphic, large, centered)
  - Placeholder: "2-10자"
  - Glass background with subtle border
- **"중복 확인" button** (below input, secondary glass style)
- Status message area (green checkmark "사용 가능" or red "중복")
- **"다음" button** (bottom, full width, accent color, disabled state = glass only)
- Progress dots: ● ○ (2 total)

### Step 2: Type Selection
- Heading: "나의 사우나 라이프 스타일은?"
- Subtext: "탭하여 선택 (순서 = 우선순위)"

- **3 large selection cards** (vertical stack, glassmorphic):
  - 🛁 목욕파 (Bather) — Blue tint when selected
  - 🔥 사우너파 (Saunner) — Orange tint when selected
  - 🥚 찜질파 (Jjimjilpah) — Green tint when selected
  - Each card:
    - Large emoji (centered)
    - Type name below
    - Glass background, colored fill when selected
    - Rank badge (#1, #2, #3) appears on selection order
    - Smooth selection animation

- **Type quote** (below cards):
  - Changes based on selected type
  - Italic, smaller text, in a glass bubble

- **"시작하기" button** (bottom, full width, accent, disabled until ≥1 selected)
- Progress dots: ○ ● (2 total)
```

---

## 프롬프트 11: 스토리 프리뷰 & 완료 화면

```
Create 2 mobile app screens: story card preview and record completion.

[위 공통 스타일 지시문 붙이기]

## Screen A: Story Preview

### Header:
- Back arrow + "취소" (left)
- "기록 저장" button (right, accent)

### Content:
- **Story card preview** (centered, 9:16 aspect ratio, ~280px width)
  - Glassmorphic card frame
  - Inside the card:
    - Place name badge (top, glass pill)
    - Date in italic serif (top-right area)
    - Large key metric number (centered, very bold, 48-64px)
    - Unit label below number
    - Small graph/visualization element
    - Type name in italic (bottom-left)
    - App watermark "사-피" (bottom-right, subtle)
  - Card has prominent shadow for depth

- **Action buttons** (below card, horizontal row):
  - "커스텀 카드" (edit icon, accent outline glass button)
  - "공유" (share icon, glass button)
  - "저장" (download icon, glass button)

- **"상세 기록 추가" button** (full width, glass outline, secondary)

---

## Screen B: Record Complete

### Layout: Centered, celebratory

- **Large emoji** (type-specific, 64px+, subtle animation/glow)
- **"기록 완료!" heading** (large, serif, with subtle confetti or sparkle)
- **Place name + date** (smaller, gray)
- **Deep log badge** (if deep log saved): "상세 기록도 함께 저장됐어요" in glass pill

- **3 action buttons** (vertical stack):
  - "내 기록 보기" (primary, accent filled, glass)
  - "한 번 더 기록하기" (secondary, glass outline)
  - "홈으로 돌아가기" (text link, subtle)

### Visual notes:
- Completion screen should feel rewarding and warm
- Subtle depth effects: glowing emoji, floating card
- Generous spacing, celebratory but minimal
```

---

## 사용 방법

### Lovable에서 시안 생성 순서 (추천):
1. **홈 화면** (프롬프트 1) — 전체 톤&매너 기준점
2. **퀵 로그** (프롬프트 3) — 핵심 기능 화면
3. **기록 상세** (프롬프트 5) — 데이터 표시 패턴
4. **탐색** (프롬프트 6) — 카드/리스트 패턴
5. 나머지 화면은 위 4개에서 확립된 스타일로

### Claude Code에 전달할 것:
1. 각 화면 **스크린샷** (전체 + 주요 컴포넌트 부분 캡처)
2. Lovable이 사용한 **컬러 코드** (DevTools → Computed Styles에서 확인)
3. **폰트 정보** (font-family, size, weight)
4. **간격/라운딩** 수치 (padding, gap, border-radius)
5. 마음에 드는 **글래스모픽 효과** CSS (backdrop-filter, opacity, border 값)

### 주의사항:
- Lovable의 **코드(React/Vite)는 사용하지 않음** → 디자인 참고만
- 기능/로직은 기존 Next.js 코드를 100% 유지
- Claude Code가 Tailwind 클래스만 교체하는 방식으로 적용
