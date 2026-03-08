# Design-to-Code / Code-to-Design 도구 비교 리서치

> 조사일: 2026-03-08 | 목적: Sauna Log PWA UX/UI 전면 리디자인을 위한 도구 선정

---

## 1. Figma Make + Dev Mode + Code Connect

| 항목 | 내용 |
|------|------|
| **기존 코드 임포트** | 직접 불가. Code Connect로 Figma 컴포넌트↔코드 컴포넌트 **링크**는 가능 (React 지원). Builder.io 플러그인을 쓰면 기존 웹사이트 → Figma 역변환 가능 |
| **기능 보존** | 디자인 도구이므로 로직 보존 개념 없음. 시각 레이어만 다루고 코드는 별도 구현 |
| **출력 형식** | Figma Make: React 코드 생성. MCP Server로 Claude/Cursor 등에 디자인 데이터 전달 가능 |
| **비용** | Starter 무료 (파일 3개), Pro $12/월/편집자, Org $45/월 |
| **성숙도** | ★★★★★ — 업계 표준. MCP Server는 2025 베타 |
| **최적 용도** | 디자인 시스템 구축 → 개발자 핸드오프. 디자이너가 있는 팀에 최적 |

### 핵심 포인트
- **Figma → Code**: Make로 React 코드 실시간 생성, Tailwind/shadcn 지원
- **Code → Figma**: 공식 기능 없음. Builder.io 또는 OpenAI Codex 파트너십으로 우회
- **MCP Server**: Figma 디자인 데이터를 AI 코딩 에이전트에 직접 전달 (변수, 토큰, 컴포넌트, Auto Layout 등)
- AI 활용 시 약 75% 수준 코드 생성, 나머지 개발자 정제 필요

---

## 2. Pencil.dev (MCP 서버 — 현재 환경에 설치됨)

| 항목 | 내용 |
|------|------|
| **기존 코드 임포트** | 직접 코드 임포트 기능 없음. AI 에이전트가 캔버스에 디자인 생성 → 코드 생성 방식 |
| **기능 보존** | 디자인 도구이므로 로직 보존 없음. 생성된 코드를 기존 프로젝트에 통합 필요 |
| **출력 형식** | .pen (순수 JSON) → AI가 파싱하여 React/Tailwind 코드 생성. Shadcn/UI 스타일가이드 내장 |
| **비용** | 무료 티어 있음 (레이트 제한), 유료 플랜 상세 비공개 |
| **성숙도** | ★★★☆☆ — 2025-2026 신생 도구. 복잡 레이아웃에서 4-8px 정렬 오차 발생 보고 |
| **최적 용도** | 개발자가 IDE 안에서 빠르게 UI 프로토타입 → 코드 전환. 1인 개발자에 적합 |

### 핵심 포인트
- Claude Code + Pencil MCP 연동으로 자연어 → 디자인 → 코드 워크플로우 가능
- .pen 파일이 JSON이라 AI 에이전트가 구조 파악·수정 용이
- 양방향 동기화: 시각 편집 ↔ 코드 반영
- **현재 환경에 이미 설치**되어 있어 즉시 사용 가능

---

## 3. Lovable (구 GPT Engineer)

| 항목 | 내용 |
|------|------|
| **기존 코드 임포트** | 공식 BYOR(Bring Your Own Repo) 미지원. GitHub 리포 스왑 우회법 존재하나 해키함 |
| **기능 보존** | 임포트 자체가 비공식이라 보존 보장 없음. 새 프로젝트 생성 중심 |
| **출력 형식** | React + Vite + Tailwind + Supabase. Next.js 직접 지원 아님 |
| **비용** | 무료 티어 → 유료 $20/월~ |
| **성숙도** | ★★★★☆ — $200M ARR, $6.6B 밸류에이션. 안정적이나 기존 앱 리디자인용은 아님 |
| **최적 용도** | 새 앱을 처음부터 빠르게 빌드. 기존 앱 리디자인에는 부적합 |

### 핵심 포인트
- 풀스택 앱 빌더 (프론트+백엔드+DB+인증)
- Supabase 네이티브 통합
- **기존 Next.js 앱 임포트 후 리디자인 시나리오에는 적합하지 않음**
- GitHub 동기화·배포 지원

---

## 4. Google Antigravity (사용자가 "antigravity client"로 언급한 도구)

| 항목 | 내용 |
|------|------|
| **기존 코드 임포트** | 가능. 기존 프로젝트를 열고 에이전트가 분석·리팩토링·리디자인 수행 |
| **기능 보존** | 에이전트가 기존 패턴 분석 후 기능 유지하며 UI 리디자인 가능 (스크린샷 기반 리디자인 사례 있음) |
| **출력 형식** | 기존 프로젝트 코드 직접 수정. 프레임워크 제한 없음 |
| **비용** | 현재 퍼블릭 프리뷰 — **무료** (2026 중반 유료 전환 예정) |
| **성숙도** | ★★★☆☆ — 2026 초 공개. Gemini 3 Pro, Claude Sonnet 4.5, GPT-OSS 지원 |
| **최적 용도** | 기존 코드베이스의 자율적 리팩토링·리디자인. 멀티 에이전트 병렬 작업 |

### 핵심 포인트
- Agent-first IDE: 에이전트가 계획→실행→검증을 자율 수행
- Artifacts로 결과물 검증 (스크린샷, 브라우저 녹화)
- VS Code/Cursor 설정 임포트 가능
- 스크린샷만으로 기존 사이트를 새 디자인으로 리디자인한 사례 존재
- **가장 직접적으로 "기존 앱 리디자인" 시나리오에 적합**

---

## 5. v0.dev (Vercel)

| 항목 | 내용 |
|------|------|
| **기존 코드 임포트** | GitHub 리포 연결 후 기존 프로젝트에서 작업 가능. Figma 임포트도 지원 |
| **기능 보존** | 컴포넌트 단위 생성이라 기존 로직에 영향 최소 |
| **출력 형식** | React + Next.js + Tailwind + shadcn/ui. Shadcn CLI로 직접 통합 |
| **비용** | 무료 (제한적), Premium $20/월 |
| **성숙도** | ★★★★☆ — Vercel 공식. Next.js 생태계 최적화 |
| **최적 용도** | Next.js 프로젝트의 개별 컴포넌트/페이지 UI 재생성 |

### 핵심 포인트
- **Sauna Log 스택(Next.js + Tailwind)과 가장 호환**
- 컴포넌트 단위 접근 → 기존 로직 보존하면서 UI만 교체 가능
- 크레딧 기반 과금 (생성당 10크레딧)
- Supabase, Neon 등 DB 네이티브 통합
- 전체 앱 리디자인보다는 컴포넌트/페이지 단위 리디자인에 적합

---

## 6. 기타 도구

### Bolt.new
- **용도**: 전체 앱을 처음부터 생성. Claude Sonnet 4.0 + StackBlitz
- **기존 앱 리디자인**: 부적합 (새 앱 빌더)
- **비용**: 무료~$20/월

### Locofy
- **용도**: Figma/XD 디자인 → Next.js/React 코드 변환
- **방향**: Design → Code 단방향만. 코드 → 디자인 역변환 없음
- **비용**: 무료 티어 있음

### TeleportHQ
- **용도**: 비주얼 빌더 + Figma 임포트 → React/Next.js/Vue 코드
- **방향**: Design → Code 단방향
- **비용**: 무료~유료

### Builder.io
- **특별 기능**: 기존 웹사이트 → Figma 역변환 가능 (Code → Design)
- 코드베이스 패턴 학습 후 디자인 시스템 반영 코드 생성

---

## 비교 요약표

| 도구 | 기존 코드 임포트 | Next.js+Tailwind | 로직 보존 | 비용 | 적합도 |
|------|:---:|:---:|:---:|------|:---:|
| Figma + Make | △ (Builder.io 우회) | ○ | × | $0~12/월 | ★★★ |
| Pencil MCP | × | ○ | × | 무료~ | ★★★ |
| Lovable | △ (해키) | △ (Vite 기반) | × | $0~20/월 | ★☆☆ |
| Google Antigravity | ◎ | ○ | ◎ | 무료(프리뷰) | ★★★★ |
| v0.dev | ○ | ◎ | ○ | $0~20/월 | ★★★★ |
| Bolt.new | × | ○ | × | $0~20/월 | ★☆☆ |

---

## 워크플로우 추천

### 방법 A: Design-First (디자인 → 코드)
```
Figma에서 전체 리디자인 → Figma MCP Server → Claude Code로 코드 생성
```
- **장점**: 시각적 완성도 높음, 전체 UX 흐름 한눈에 파악
- **단점**: Figma 숙련 필요, 디자인↔코드 간극 존재
- **적합**: 디자이너와 협업하거나, 완전히 새로운 디자인 언어 도입 시

### 방법 B: Code-First (코드에서 직접 리디자인)
```
Claude Code + v0.dev 컴포넌트 생성 → 기존 코드에 통합
```
- **장점**: 기존 로직 100% 보존, 즉시 실행 가능
- **단점**: 전체 UX 흐름을 시각적으로 보기 어려움
- **적합**: 1인 개발자, 기능은 유지하고 UI만 교체

### 방법 C: Hybrid (추천)
```
1. Pencil MCP로 주요 화면 와이어프레임/목업 생성 (이미 설치됨)
2. v0.dev로 핵심 컴포넌트 프로토타입 생성 (Next.js+Tailwind 네이티브)
3. Claude Code로 기존 코드에 통합·로직 보존
4. (선택) Google Antigravity로 자율 리팩토링 보조
```
- **장점**: 시각 확인 + 코드 보존 + AI 활용 극대화
- **단점**: 도구 간 전환 비용
- **적합**: Sauna Log 같은 기존 앱의 전면 UX 오버홀

### 방법 D: Antigravity 올인
```
Google Antigravity에 기존 코드베이스 열기 → 스크린샷/디자인 참조로 리디자인 지시
```
- **장점**: 기존 코드 분석·기능 보존·UI 리디자인 원스톱
- **단점**: 신생 도구(프리뷰), 미세 제어 어려울 수 있음
- **적합**: 대담한 얼리어답터, 빠른 프로토타이핑

---

## Sauna Log 프로젝트 최종 권고

**1순위: 방법 C (Hybrid)** — Pencil MCP(설치됨) + v0.dev + Claude Code
- Pencil로 전체 화면 레이아웃 시각화
- v0.dev로 Next.js+Tailwind 컴포넌트 생성
- Claude Code로 기존 로직과 통합
- 비용: 최소 $0 ~ $20/월

**2순위: 방법 D (Antigravity)** — 무료 프리뷰 기간 활용
- 기존 코드베이스를 직접 열고 에이전트에 리디자인 지시
- 비용: 현재 무료

**비추천**: Lovable, Bolt.new — 기존 코드 임포트가 사실상 불가, 새 앱 빌더 성격

---

## Sources
- [Figma Dev Mode](https://www.figma.com/dev-mode/)
- [Figma MCP Server Blog](https://www.figma.com/blog/introducing-figma-mcp-server/)
- [Figma Code Connect](https://help.figma.com/hc/en-us/articles/23920389749655-Code-Connect)
- [Figma Pricing](https://www.figma.com/pricing/)
- [Figma to Code AI Workflows 2026](https://www.sixtythirtyten.co/blog/from-figma-to-code-ai-design-to-dev-workflows-in-2026)
- [Figma MCP Server Tested 2026](https://research.aimultiple.com/figma-to-code/)
- [Pencil.dev](https://www.pencil.dev/)
- [Pencil AI Integration Docs](https://docs.pencil.dev/getting-started/ai-integration)
- [Pencil + Claude Code Workflow](https://atalupadhyay.wordpress.com/2026/02/25/pencil-dev-claude-code-workflow-from-design-to-production-code-in-minutes/)
- [Pencil DevelopersIO Review](https://dev.classmethod.jp/en/articles/claude-code-pencil-mcp-web-design/)
- [Lovable](https://lovable.dev/)
- [Lovable GitHub Import Guide](https://digimoor.com/how-to-import-a-github-repository-into-lovable-dev-projects-a-comprehensive-guide/)
- [Google Antigravity](https://antigravity.google/)
- [Google Antigravity Developers Blog](https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/)
- [Antigravity vs Cursor Comparison](https://altersquare.io/google-antigravity-vs-cursor-agent-first-ide-legacy-codebases/)
- [v0.dev](https://v0.dev/)
- [v0 Pricing](https://v0.app/pricing)
- [v0 vs Bolt Comparison](https://www.index.dev/blog/v0-vs-bolt-ai-app-builder-review)
- [Builder.io Figma Integration](https://www.builder.io/blog/figma-to-code-ai)
- [OpenAI + Figma Partnership](https://openai.com/index/figma-partnership/)
- [App Redesign Guide](https://volpis.com/blog/comprehensive-guide-to-app-redesign/)
