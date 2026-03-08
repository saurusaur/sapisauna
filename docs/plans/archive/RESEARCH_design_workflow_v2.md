# Design Workflow v2 리서치 결과

> 조사일: 2026-03-08
> 목적: 사우나 로그 PWA 리디자인을 위한 도구·워크플로·레퍼런스 종합 리서치

---

## Topic 1: Google Antigravity → Figma/Lovable 파이프라인

### Google Antigravity란?
- Google의 **에이전트 기반 IDE** (VS Code 포크). 2025년 11월 출시, 2026년 1월 Public Preview (무료)
- Gemini 3 모델 기반 "Mission Control"로 자율 에이전트가 계획·코딩·브라우저 테스트까지 수행
- VS Code/Cursor 설정 import 지원

### Antigravity → Figma 연결 ✅ 가능
- **Figma MCP Server** 설치: 에디터 → 3 dots → MCP servers → Figma MCP 설치
- Figma MCP가 디자인 파일에서 데이터를 읽고 SVG/PNG/JPG 에셋 export 가능
- Figma Dev Mode MCP로 디자인 시스템 컨텍스트를 AI에 직접 전달

### Google Stitch + Antigravity 파이프라인 ✅ 추천 조합
- **Google Stitch**: AI UI 디자인 도구 (Google Labs, Gemini 2.5 Pro 기반, 무료 베타)
- 텍스트 프롬프트 → 완성된 UI 디자인 + production-ready HTML/CSS/React/Tailwind 코드
- **Stitch → Figma**: 원클릭 export. 레이어·컴포넌트·구조 유지
- **Stitch → Antigravity**: MCP 연결로 디자인을 가져와 기능 코드 자동 생성
- 워크플로: `Stitch에서 UI 생성 → Figma로 export(미세 조정) → Antigravity에서 기능 구현`

### Antigravity → Lovable ⚠️ 직접 연결 없음
- Lovable은 독립 AI 앱 빌더 (텍스트 → 풀스택 코드)
- Antigravity에서 생성한 코드를 수동으로 Lovable에 붙여넣기는 가능하지만 직접 파이프라인은 없음
- **우회법**: Antigravity 출력 코드 → GitHub → Lovable import 또는 수동 복사

### Export 포맷 정리

| 도구 | 출력 포맷 |
|------|----------|
| Antigravity | 코드 (React, HTML/CSS 등) + Artifacts (계획, 스크린샷) |
| Stitch | HTML/CSS, React/Tailwind 코드, Figma 원클릭 export |
| Figma MCP | SVG, PNG, JPG, 디자인 데이터 (JSON) |

### 워크어라운드 요약
1. **Stitch → Figma** (원클릭, 가장 매끄러움)
2. **스크린샷 → html.to.design → Figma** (기존 앱 캡처 → Figma 변환)
3. **코드 → Builder.io → 비주얼 에디터** (React 코드를 비주얼로 편집)
4. **Stitch → Antigravity MCP** (디자인 → 코드 자동화)

---

## Topic 2: Google 디자인/프로토타이핑 도구 총정리

### 1. Google Stitch ⭐
- **용도**: AI UI 디자인 생성기
- **특징**: 텍스트 → UI + 코드 (60초 이내), Figma export, Material Design 지원
- **가격**: 무료 (베타)
- **적합도**: ★★★★★ — 디자인 초보에게 최적

### 2. Google Antigravity
- **용도**: 에이전트 기반 코딩 IDE
- **특징**: Gemini 3 기반, MCP 확장, 브라우저 자동 테스트, Artifacts
- **가격**: 무료 (Public Preview)
- **적합도**: ★★★★ — 코딩에 강점, 디자인은 Stitch와 조합 필요

### 3. Firebase Studio (구 Project IDX)
- **용도**: 클라우드 기반 풀스택 개발 환경
- **특징**: VS Code 기반, Gemini AI 통합, App Prototyping Agent (코드 없이 앱 프로토타입)
- **가격**: 무료 (Preview)
- **적합도**: ★★★★ — 프로토타이핑 에이전트가 유용하지만 비주얼 편집은 제한적

### 4. Material Design 도구들
- **Material Theme Builder**: 커스텀 Material 3 테마 생성
- **Material Web Components**: 웹 컴포넌트 라이브러리
- **적합도**: ★★★ — Tailwind 기반 프로젝트에서는 직접 사용보다 영감 참고용

### 5. Google AI Studio
- **용도**: Gemini 모델 실험·프롬프팅
- **적합도**: ★★ — 디자인 도구는 아니지만 Antigravity와 연동 가능

---

## Topic 3: "비주얼 디자인 + 실시간 코드" 최적 워크플로

### 방법 1: Pencil MCP + Claude Code ⭐⭐⭐⭐⭐
- **작동 방식**: Claude Code에서 자연어로 디자인 지시 → Pencil.dev 캔버스에 실시간 렌더링
- **장점**:
  - 완전 무료
  - Figma급 비주얼 캔버스 + AI 코드 생성 동시 진행
  - UI 킷, CSS 변수, JSON 테마 지원
  - Figma 디자인 import → production 코드 변환 가능
  - 이미 Claude Code에 MCP 설치되어 있으면 바로 사용
- **단점**: 아직 초기 단계, 복잡한 인터랙션 제한적
- **비용**: 무료

### 방법 2: v0.dev (Vercel) ⭐⭐⭐⭐
- **작동 방식**: 텍스트 프롬프트 → React/Next.js 컴포넌트 생성 + Design Mode로 비주얼 편집
- **장점**:
  - Tailwind CSS + shadcn/ui 기본 지원 (현 프로젝트와 호환)
  - Design Mode로 비주얼 편집 가능
  - 원클릭 Vercel 배포, GitHub 동기화
  - 풀스택 (DB, Auth, API 포함)
- **단점**: 무료 티어 제한 있음, 기존 프로젝트 코드 직접 편집은 제한적
- **비용**: 무료 티어 + 유료 ($20/월)

### 방법 3: Google Stitch + Antigravity ⭐⭐⭐⭐
- **작동 방식**: Stitch에서 UI 생성 → MCP로 Antigravity에서 코드 구현
- **장점**: 무료, Google 생태계 통합, 빠른 프로토타이핑
- **단점**: Next.js/Tailwind 직접 output이 아닐 수 있음, 기존 코드베이스 통합 수동 작업 필요

### 방법 4: Figma + Dev Mode MCP ⭐⭐⭐
- **작동 방식**: Figma에서 디자인 → MCP로 Claude/Cursor에서 코드 생성
- **장점**: 업계 표준, 팀 협업에 최적, 디자인 시스템 컨텍스트 전달
- **단점**: Figma 학습 곡선, 무료 티어 제한 (Dev Mode는 유료)
- **비용**: 무료 (개인) / $15/월 (Dev Mode)

### 방법 5: Framer ⭐⭐⭐
- **작동 방식**: 비주얼 빌더로 디자인 → 코드 export (플러그인 필요)
- **장점**: 아름다운 애니메이션, 반응형 디자인
- **단점**: 네이티브 코드 export 불가, React export는 서드파티 필요
- **비용**: 무료 티어 + 유료

### 방법 6: Builder.io ⭐⭐⭐
- **작동 방식**: 비주얼 에디터 → Next.js 드래그앤드롭 페이지 빌더
- **장점**: 기존 React 컴포넌트를 비주얼 에디터에서 사용 가능
- **단점**: CMS 중심 도구, 앱 전체 디자인보다 페이지 빌딩에 적합

### 방법 7: Windframe ⭐⭐⭐
- **작동 방식**: Tailwind CSS 전용 비주얼 빌더
- **장점**: Tailwind 코드 직접 생성, React/Next.js export
- **단점**: 컴포넌트 단위 편집, 전체 앱 플로우 디자인은 제한적
- **비용**: 무료 플랜 있음

---

## Topic 4: 레퍼런스 앱 UI/UX 분석

### 4-1. Strava

| 항목 | 내용 |
|------|------|
| **컬러** | International Orange `#FC5200`, Grenadier `#CC4200`, White `#FFFFFF`, 다크 배경 |
| **타이포** | **Inter** (앱 UI — 깔끔, 기하학적, 가독성 우수), **Boathouse** (브랜딩 — Grilli Type 커스텀) |
| **내비게이션** | 하단 탭 5개: Home, Maps, Record, Groups, You |
| **핵심 UI 패턴** | 소셜 피드 (인스타 스타일), 액티비티 카드 (전폭 사진 + 인셋 지도), 큰 숫자 통계 |
| **프리미엄 느낌 요소** | 볼드 오렌지 액센트, 대형 타이포로 핵심 수치 강조, 풀스크린 사진, 세그먼트/리더보드 |

**사우나 앱에 차용할 점**:
- 액티비티 카드 레이아웃 (사진 + 핵심 데이터 오버레이)
- 소셜 피드 구조 (사우나 활동 타임라인)
- 큰 숫자로 핵심 통계 표시 (온도, 시간, 세트 수)
- 시그니처 컬러 하나로 브랜드 아이덴티티 확립

### 4-2. Nike Run Club (NRC)

| 항목 | 내용 |
|------|------|
| **컬러** | 기본: Black `#111111`, Mercury `#E5E5E5`, White `#FFFFFF` + 네온 그린 액센트 (CTA) |
| **타이포** | 가볍고 여백 충분, 러닝 타입별 차별화 (Tempo, Interval, Hill, Fartlek) |
| **핵심 UI 패턴** | 다크 모드 기본, 미니멀 레이아웃, 러닝 타입별 표현적 타이포, AGR 컬러코드 |
| **동기부여 UX** | 커뮤니티 통합, 챌린지, 코칭 플랜, 달리기 중 오디오 가이드 |
| **디자인 철학** | COLLINS 디자인 에이전시 협업, 3가지 러닝 타입(Everyday/Speed/Long) 프레임워크 |

**사우나 앱에 차용할 점**:
- 다크 모드 기본 (사우나 = 어두운 공간, 무드 매칭)
- 활동 타입별 시각적 차별화 (목욕파/사우너파/찜질파 각각 다른 비주얼)
- 네온 액센트 컬러로 CTA 강조
- 미니멀한 여백 활용

### 4-3. サウナイキタイ (Sauna Ikitai)

| 항목 | 내용 |
|------|------|
| **컬러** | 캐주얼 원색 — 파랑(수풍기) + 빨강(사우나), 팝한 느낌, 친근한 인상 |
| **레이아웃** | 홈: 세로 스크롤 콘텐츠 피드, 상단에 검색 버튼 2개 (텍스트/지도) |
| **핵심 기능** | 100+ 항목 상세 검색, サ活(활동 기록) 투고, 온도·혼잡도 리포트, 사진 10장 |
| **검색/발견** | 마니아급 필터링 (수풍 온도, 로률, 외기욕 등), 지도 기반 탐색 |
| **#1 이유** | 15,000+ 시설 데이터베이스, 커뮤니티 기반 리뷰, 이키타이(가고싶다) 저장, Google Play Best 2023 노미네이트 |

**사우나 앱에 차용할 점**:
- 상세 검색 필터 (사우나 마니아를 위한 세밀한 조건)
- サ活 로그 시스템 (사진 + 온도 + 코멘트 = 사우나 로그의 모범)
- 지도 기반 탐색 UI
- 커뮤니티 피드 (좋아요, 코멘트, 기프트)

---

### 4-4. 추가 레퍼런스 앱 5선

#### 1) Gentler Streak — 웰니스 피트니스 트래커
| 항목 | 내용 |
|------|------|
| **수상** | Apple Design Award 수상 |
| **컬러** | 따뜻한 톤, 소프트 그라데이션, 파스텔 계열 |
| **핵심 패턴** | 데이터를 숫자가 아닌 "말"로 번역 (오늘의 컨디션 상태를 문장으로), 휴식 강조 |
| **차용 포인트** | 사우나 후 컨디션을 숫자 대신 감성적 문장으로 표현, 따뜻한 컬러 톤 |

#### 2) Untappd — 맥주 로깅/리뷰 커뮤니티
| 항목 | 내용 |
|------|------|
| **컬러** | 다크 테마 + 옐로/앰버 액센트 (맥주 색) |
| **핵심 패턴** | 체크인 (= 로깅), 배지/업적 시스템 (12,000+ 배지), 카메라 스캔, 별점 리뷰 |
| **차용 포인트** | 배지/업적 시스템 (사우나 N회 방문 등), 간단한 체크인 UX, 니치 커뮤니티의 성공 모델 |

#### 3) Vivino — 와인 스캔/리뷰
| 항목 | 내용 |
|------|------|
| **컬러** | 딥 레드 (와인색) + 화이트, 클린한 레이아웃 |
| **핵심 패턴** | 카메라 스캔 → 즉시 정보 표시, 온보딩 카드 스와이프, 방대한 콘텐츠의 소화 가능한 포맷 |
| **차용 포인트** | 온보딩 플로우, 시설 정보의 소화 가능한 카드 포맷, 스캔 기반 빠른 입력 |

#### 4) Komoot — 하이킹/사이클링 경로 탐색
| 항목 | 내용 |
|------|------|
| **컬러** | 그린 계열 + 화이트, 자연 친화적 |
| **핵심 패턴** | Discover 피드 (소셜 + 루트 하이라이트), 지도 중심 UI, 모험 공유 |
| **차용 포인트** | Discover 탭의 소셜 피드 + 추천 조합, 지도 기반 시설 탐색 |

#### 5) Finch — 셀프케어 습관 트래커
| 항목 | 내용 |
|------|------|
| **컬러** | 파스텔, 코지(아늑한) 무드, 소프트 일러스트레이션 |
| **핵심 패턴** | 가상 펫 성장 (게이미피케이션), 습관 체크리스트, 뉴로다이버전트 친화적 |
| **차용 포인트** | 게이미피케이션 (사우나 캐릭터 성장?), 부드러운 격려 톤, 습관 형성 UX |

---

## 최종 추천: 1인 개발자를 위한 최적 워크플로

### 프로필 요약
- Figma 초보, 비주얼 편집 + 실시간 프리뷰 원함
- Next.js + Tailwind CSS + Supabase PWA (기존 스택)
- 무료 도구 선호, 높은 디자인 퀄리티 목표

### 추천 워크플로: **3단계 하이브리드** ⭐

```
[1단계: 디자인 생성]          [2단계: 비주얼 미세조정]       [3단계: 코드 구현]
Google Stitch (무료)    →    Pencil MCP + Claude Code   →   기존 코드베이스에 적용
  - 텍스트로 UI 생성           - 실시간 비주얼 편집            - Tailwind 클래스 직접 생성
  - 레퍼런스 이미지 입력         - 캔버스에서 조정              - 컴포넌트 단위 교체
  - Figma export (백업)       - 컬러/스페이싱/타이포 수정       - git commit per component
```

### 왜 이 조합인가?

| 기준 | 평가 |
|------|------|
| **비용** | 전부 무료 (Stitch 베타, Pencil 무료, Claude Code 기존 사용) |
| **학습 곡선** | 낮음 — 전부 텍스트 프롬프트 기반, Figma 숙련 불필요 |
| **디자인 퀄리티** | 높음 — Stitch의 AI 생성 + Pencil의 비주얼 미세조정 |
| **기존 스택 호환** | 완벽 — Tailwind/React/Next.js 직접 출력 |
| **실시간 프리뷰** | Pencil MCP 캔버스에서 즉시 확인 |
| **구현 난이도** | 낮음 — Claude Code가 코드 생성까지 담당 |

### 대안 조합 (상황별)

| 상황 | 추천 |
|------|------|
| 컴포넌트 단위 빠른 생성 | **v0.dev** Design Mode ($20/월이면 가치 있음) |
| 전체 앱 플로우 프로토타입 | **Firebase Studio** App Prototyping Agent |
| 디자인 시스템 체계적 구축 | **Figma** + Dev Mode MCP (장기적으로 투자 가치) |
| Google 생태계 올인 | **Stitch → Antigravity** MCP 파이프라인 |

### 즉시 실행 가능한 액션 플랜

1. **오늘**: Google Stitch에서 레퍼런스 앱 (Strava/NRC) 스타일로 홈 화면 UI 3-5개 생성
2. **내일**: 마음에 드는 디자인을 Pencil MCP로 가져와서 사우나 앱 컬러/콘텐츠로 커스터마이징
3. **이후**: 컴포넌트별로 Claude Code에서 Tailwind 코드 생성 → 기존 코드베이스에 통합

---

## 출처

### Topic 1 (Antigravity/Stitch/Figma)
- [Figma MCP Server for Antigravity](https://forum.figma.com/ask-the-community-7/connecting-figma-mcp-server-with-google-antigravity-48325)
- [Antigravity + Figma MCP Setup](https://marcelomiyake.com.br/posts/figma-mcp-antigravity/)
- [Google Stitch → Figma](https://html.to.design/blog/from-google-stitch-to-figma/)
- [Google Stitch Official Blog](https://developers.googleblog.com/stitch-a-new-way-to-design-uis/)
- [Stitch to Figma Plugin](https://www.figma.com/community/plugin/1577379704241183556/stitch-to-figma)
- [Stitch + Antigravity Workflow](https://medium.com/activated-thinker/google-stitch-antigravity-the-design-first-ai-workflow-for-2026-f5bf070f26a6)
- [Antigravity + Stitch Setup Guide](https://saascity.io/blog/how-to-connect-google-antigravity-google-stitch)

### Topic 2 (Google 도구)
- [Firebase Studio Docs](https://firebase.google.com/docs/studio)
- [IDX → Firebase Studio](https://firebase.google.com/docs/studio/idx-is-firebase-studio)
- [Antigravity Official](https://antigravity.codes)
- [Antigravity Review 2026](https://leaveit2ai.com/ai-tools/code-development/antigravity)

### Topic 3 (비주얼 디자인 도구)
- [Pencil.dev + Claude Code Workflow](https://atalupadhyay.wordpress.com/2026/02/25/pencil-dev-claude-code-workflow-from-design-to-production-code-in-minutes/)
- [Pencil MCP Web Design](https://dev.classmethod.jp/en/articles/claude-code-pencil-mcp-web-design/)
- [Pencil.dev Docs](https://docs.pencil.dev/getting-started/ai-integration)
- [v0.dev Docs](https://v0.app/docs)
- [v0.dev 2026 Guide](https://textify.ai/v0-dev-guide-2026/)
- [Figma MCP Server Blog](https://www.figma.com/blog/introducing-figma-mcp-server/)
- [Figma MCP Guide](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server)
- [Windframe Tailwind Builder](https://windframe.dev/)
- [Framer React Export](https://www.framer.com/marketplace/plugins/react-export/)
- [Builder.io Next.js](https://www.builder.io/m/nextjs)

### Topic 4 (레퍼런스 앱)
- [Strava Brand Colors](https://mobbin.com/colors/brand/strava)
- [Strava Typography 2026](https://sensatype.com/what-font-does-strava-use-in-2026)
- [Strava Design Critique](https://ixd.prattsi.org/2026/02/design-critique-strava-ios-app-3/)
- [Strava Navigation Update](https://www.cyclingweekly.com/news/product-news/a-new-look-for-strava-app-with-updates-to-the-navigation-bar-498270)
- [NRC + COLLINS Redesign](https://www.printmag.com/branding-identity-design/nike-run-club-app-improves-user-experience-with-help-from-collins/)
- [Nike Brand Colors](https://mobbin.com/colors/brand/nike)
- [サウナイキタイ App Store](https://apps.apple.com/jp/app/サウナイキタイ-サウナ検索アプリ/id1617092382)
- [サウナイキタイ Home Renewal 2025](https://sauna-ikitai.com/news/app-home-renewal-2025)
- [Gentler Streak + Apple](https://developer.apple.com/news/?id=3m0ht22s)
- [Gentler Streak Design](https://www.sketch.com/blog/gentler-streak/)
- [Vivino Design](https://www.designrush.com/best-designs/apps/vivino)
