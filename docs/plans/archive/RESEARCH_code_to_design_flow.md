# Code → Design → Code 라운드트립 워크플로우 리서치

> 작성일: 2026-03-08
> 목적: 기존 Next.js + Tailwind CSS PWA 코드베이스를 편집 가능한 디자인으로 변환하고, 리디자인 후 코드로 되돌리는 실용적 워크플로우 조사

---

## 목차
1. [Figma Code to Canvas (Anthropic 파트너십)](#1-figma-code-to-canvas)
2. [html.to.design 플러그인](#2-htmltodesign-플러그인)
3. [Google Antigravity + Stitch](#3-google-antigravity--stitch)
4. [Piny (VS Code 비주얼 에디터)](#4-piny-vs-code-비주얼-에디터)
5. [Tail Lens (크롬 확장)](#5-tail-lens-크롬-확장)
6. [Vercel v0](#6-vercel-v0)
7. [Builder.io](#7-builderio)
8. [Pinegrow](#8-pinegrow)
9. [Google Stitch 단독](#9-google-stitch-단독)
10. [워크플로우 비교 및 추천](#10-워크플로우-비교-및-추천)

---

## 1. Figma Code to Canvas

### 개요
2026년 2월 17일 발표. Figma와 Anthropic 파트너십으로 탄생한 **"Code to Canvas"** 기능.
Claude Code에서 만든(또는 기존) UI를 브라우저에서 캡처 → Figma 캔버스에 편집 가능한 프레임으로 변환.

### 작동 방식
- Figma Dev Mode MCP 서버를 통해 **라이브 브라우저 상태를 캡처**
- 캡처된 화면이 Figma에 **편집 가능한 레이어**로 변환
- Code Connect로 Figma 컴포넌트 ↔ 코드 컴포넌트 매핑 가능

### 설치 및 설정
```bash
# 1. Figma Desktop App → Preferences → Dev Mode MCP Server 활성화
# 2. Claude Code에 MCP 서버 추가
claude mcp add --transport sse figma-dev-mode-mcp-server http://127.0.0.1:3845/sse
```

### 워크플로우 (기존 코드베이스 기준)
1. `npm run dev`로 앱 실행
2. Claude Code에서 "현재 브라우저 화면을 Figma로 캡처해줘" 요청
3. Figma 캔버스에 편집 가능한 프레임 생성
4. Figma에서 시각적 리디자인
5. 수정된 디자인을 Claude Code가 읽고 코드 업데이트

### 요구사항
- Figma Pro 이상 플랜 (Starter는 MCP 호출 6회/월 제한)
- Figma Desktop App (웹 버전 불가)
- Claude Code (npm 설치)
- Full 또는 Dev seat

### 제한사항
- 캡처는 **시각적 스냅샷** 수준 — 컴포넌트 구조 완벽 보존 아님
- Code Connect 설정 없이는 AI가 컴포넌트를 추론해야 함
- Pro 플랜 일일 MCP 호출 제한 존재 (Enterprise는 600/일)

### 평가
| 항목 | 평가 |
|------|------|
| 코드→디자인 | ★★★★☆ (라이브 캡처, 편집 가능) |
| 디자인→코드 | ★★★★☆ (Claude Code + MCP) |
| 라운드트립 | ★★★★☆ (현재 가장 완성도 높은 양방향) |
| 난이도 | 중간 (MCP 설정 필요) |
| 비용 | Figma Pro + Claude Code 구독 |

---

## 2. html.to.design 플러그인

### 개요
divRIOTS 제작. 웹사이트 URL 또는 브라우저 확장으로 **실행 중인 웹앱을 Figma 디자인으로 변환**.

### 작동 방식
- URL 입력 또는 Chrome 확장으로 캡처
- HTML/CSS를 파싱하여 Figma 레이어로 변환
- 텍스트, 컬러, 스페이싱 등 CSS 스타일 보존
- 로컬 스타일(색상, 텍스트)을 Figma 로컬 스타일로 자동 생성

### 설치 및 설정
```
1. Figma → Community → "html.to.design" 검색 → 플러그인 설치
2. Chrome Web Store → "html.to.design" 확장 설치 (로컬/비공개 페이지 캡처용)
```

### 워크플로우
1. `npm run dev`로 Next.js 앱 실행 (localhost:3000)
2. Chrome 확장으로 각 페이지 캡처 (로컬호스트 접근 가능)
3. Figma에서 편집 가능한 디자인으로 변환
4. 데스크톱/태블릿/모바일 다중 뷰포트 캡처 가능
5. Figma에서 리디자인
6. 리디자인된 Figma → 코드 변환은 별도 도구 필요 (Builder.io, Locofy 등)

### 제한사항
- **단방향** (코드→디자인만). 디자인→코드는 별도 파이프라인
- 복잡한 인터랙션/상태는 캡처 불가 (정적 스냅샷)
- Tailwind 클래스가 아닌 계산된 CSS로 변환됨
- 무료 티어 제한 있음

### 평가
| 항목 | 평가 |
|------|------|
| 코드→디자인 | ★★★★☆ (가장 쉬운 캡처) |
| 디자인→코드 | ☆☆☆☆☆ (지원 안 함) |
| 라운드트립 | ★★☆☆☆ (반쪽 솔루션) |
| 난이도 | 낮음 (플러그인 설치만) |
| 비용 | 무료~유료 티어 |

---

## 3. Google Antigravity + Stitch

### 개요
- **Antigravity**: Google의 에이전틱 IDE (VS Code 포크 + Gemini 3 기반)
- **Stitch**: Google Labs의 AI UI 디자인 도구 (프롬프트/이미지 → UI 디자인 + 코드)

### Antigravity로 기존 코드베이스 열기
- VS Code처럼 기존 프로젝트 폴더를 열 수 있음
- Gemini 3 Pro가 **100만 토큰** (대형 모노레포 전체) 읽기 가능
- 아키텍처, 의존성, 네이밍 컨벤션 자동 이해
- 라이브 프리뷰 패널에서 앱 실행 상태 확인

### Stitch로 기존 앱 리디자인
- 웹사이트 스크린샷/URL 업로드 → AI가 분석 → 리디자인 생성
- "이 앱을 미니멀하게 리디자인해줘" 같은 프롬프트 가능
- HTML/CSS 코드 및 Figma 파일로 내보내기 지원

### Antigravity + Stitch 통합 워크플로우
```
1. Antigravity에서 기존 프로젝트 열기
2. Agent 패널 → 점 3개 → MCP Servers → "stitch" 검색 → 설치
3. 프롬프트: "Use stitch mcp server to redesign the home page UI"
4. Stitch가 시각적 디자인 생성
5. Antigravity 에이전트가 디자인을 코드로 구현
6. 라이브 프리뷰에서 확인 → 반복
```

### 제한사항
- Stitch는 **커스텀 디자인 시스템/브랜드 가이드라인 직접 임포트 불가** — 프롬프트로 설명해야 함
- 기존 코드의 컴포넌트 구조를 자동 재활용하지 않음 — 에이전트에게 명시적으로 지시 필요
- Stitch 생성 코드는 HTML/CSS 기반 — Tailwind/React 변환은 Antigravity 에이전트가 추가 처리
- Antigravity는 아직 Public Preview 단계

### 평가
| 항목 | 평가 |
|------|------|
| 코드→디자인 | ★★★☆☆ (스크린샷 기반, 구조적 변환 아님) |
| 디자인→코드 | ★★★★☆ (Stitch + Antigravity 에이전트) |
| 라운드트립 | ★★★☆☆ (수동 조율 필요) |
| 난이도 | 중간 (MCP 설정 + 프롬프팅) |
| 비용 | 무료 (Public Preview) |

---

## 4. Piny (VS Code 비주얼 에디터)

### 개요
Pinegrow 팀이 만든 **VS Code/Cursor/Windsurf 확장**. 기존 React/Next.js + Tailwind 프로젝트를 **IDE 안에서 시각적으로 편집**.

### 핵심 특징
- 기존 프로젝트에 **코드 변경 없이** 바로 사용 가능
- 편집이 **즉시 코드에 반영** (파일 자동 저장 → HMR 트리거)
- Tailwind 클래스를 트리 구조로 정리하여 시각적 편집
- 추상화 없음, 클라우드 서비스 없음, 락인 없음

### 설치 및 사용
```
1. VS Code → Extensions → "Piny" 검색 → 설치 (무료)
2. .tsx/.jsx 파일 열기
3. 우클릭 → "Edit in Piny"
4. 시각적 패널에서 Tailwind 클래스 편집
5. 변경사항이 즉시 코드에 기록됨
```

### 워크플로우
1. Piny로 기존 페이지 컴포넌트 열기
2. 시각적으로 레이아웃/스타일 수정
3. 변경이 .tsx 파일에 직접 기록
4. git diff로 변경 확인 → 커밋

### 제한사항
- **디자인 도구가 아님** — Tailwind 클래스 편집기에 가까움
- 전체 페이지 레이아웃 재구성보다는 **스타일 미세 조정**에 적합
- 라우트 연결로 프리뷰 가능하나 Figma 수준의 자유도는 없음

### 평가
| 항목 | 평가 |
|------|------|
| 코드→디자인 | ★★★☆☆ (비주얼 프리뷰 + 편집) |
| 디자인→코드 | ★★★★★ (직접 코드에 기록) |
| 라운드트립 | ★★★★☆ (코드 = 디자인, 동일 소스) |
| 난이도 | 매우 낮음 (확장 설치만) |
| 비용 | 무료 |

---

## 5. Tail Lens (크롬 확장)

### 개요
브라우저에서 **실행 중인 Tailwind 앱의 클래스를 실시간으로 수정**하는 크롬 확장.

### 핵심 특징
- 요소 클릭 → Tailwind 클래스 목록 확인 + 편집
- 대안 클래스 hover 시 **라이브 프리뷰**
- 마진/패딩/높이 스페이싱 가이드 오버레이
- tailwind.config.js 커스텀 설정 인식 (v3, v4 지원)

### 설치
```
Chrome Web Store → "Tail Lens" 검색 → 설치
(Firefox, Brave, Edge도 지원)
```

### 워크플로우
1. `npm run dev`로 앱 실행
2. Tail Lens 활성화
3. 요소 인스펙트 → Tailwind 클래스 확인
4. 클래스 수정 → 라이브 프리뷰 확인
5. 최종 클래스 리스트 **복사** → 코드에 수동 붙여넣기

### 제한사항
- **코드에 자동 저장 안 됨** — 클래스 복사 후 수동 적용 필요
- 실험/탐색 용도이며 프로덕션 워크플로우로는 부족
- 구조 변경(HTML 요소 추가/삭제) 불가

### 평가
| 항목 | 평가 |
|------|------|
| 코드→디자인 | ★★☆☆☆ (인스펙트 + 실험) |
| 디자인→코드 | ★☆☆☆☆ (수동 복사) |
| 라운드트립 | ★☆☆☆☆ (보조 도구) |
| 난이도 | 매우 낮음 |
| 비용 | 무료~유료 |

---

## 6. Vercel v0

### 개요
Vercel의 AI UI 빌더. 프롬프트로 React 컴포넌트 생성 + **Design Mode**로 시각적 편집.

### 기존 코드베이스와 통합
- 생성된 컴포넌트를 기존 Next.js 프로젝트에 바로 플러그인 가능
- 기존 레이아웃/라우트/동적 라우트 구조를 깨지 않고 삽입
- 2026년 기준 풀스택 빌더 (DB, Auth, API 포함)

### 워크플로우 (기존 앱 리디자인)
1. 기존 페이지 스크린샷 또는 설명을 v0에 제공
2. "이 디자인을 이렇게 바꿔줘" 프롬프트
3. v0 Design Mode에서 시각적 미세 조정
4. 생성된 코드를 기존 프로젝트에 복사/적용

### 제한사항
- 기존 코드를 **직접 읽어서 수정**하는 것은 불가 — 새로 생성하는 방식
- 기존 컴포넌트 구조/상태 관리 재활용은 수동 통합 필요
- 전체 앱 리디자인보다는 개별 컴포넌트/페이지 단위에 적합

### 평가
| 항목 | 평가 |
|------|------|
| 코드→디자인 | ★★☆☆☆ (직접 임포트 불가) |
| 디자인→코드 | ★★★★★ (최고 수준 코드 생성) |
| 라운드트립 | ★★☆☆☆ (단방향) |
| 난이도 | 낮음 |
| 비용 | 무료~유료 |

---

## 7. Builder.io

### 개요
Figma → Code 변환 특화. **Visual Copilot CLI**가 기존 코드베이스의 프레임워크/스타일 컨벤션/컴포넌트 라이브러리를 분석.

### 코드→디자인 방향
- Builder.io 자체는 Figma→Code 단방향이 주력
- **figma-html** (GitHub: BuilderIO/figma-html) 오픈소스로 웹사이트 → Figma 변환 지원
- Chrome 확장으로 웹사이트를 Figma 디자인으로 변환 가능

### 디자인→코드 방향
- Visual Copilot이 기존 코드베이스를 분석하여 맞춤형 코드 생성
- Tailwind, React, Next.js 등 기존 스택에 맞게 출력
- 기존 컴포넌트 재활용 지원

### 평가
| 항목 | 평가 |
|------|------|
| 코드→디자인 | ★★★☆☆ (Chrome 확장 경유) |
| 디자인→코드 | ★★★★★ (코드베이스 인식 최고) |
| 라운드트립 | ★★★☆☆ |
| 난이도 | 중간 |
| 비용 | 유료 (Pro 플랜) |

---

## 8. Pinegrow

### 개요
데스크톱 앱. Tailwind Visual Editor 포함. Mac/Windows/Linux.

### 특징
- 기존 프로젝트 폴더를 열어서 시각적 편집
- 라이브 프리뷰, AI 어시스턴트 (v9.01, 2026.01)
- Piny의 상위 버전 (더 많은 기능)

### 제한사항
- React/JSX 지원이 Piny보다 제한적일 수 있음
- 유료 ($149 일회성)

---

## 9. Google Stitch 단독

### 개요
기존 웹사이트 스크린샷/URL → AI 분석 → 리디자인 생성.

### 워크플로우
1. stitch.google.com 접속
2. 기존 앱 스크린샷 업로드 또는 URL 입력
3. "미니멀하게 리디자인해줘" 프롬프트
4. HTML/CSS 코드 또는 Figma 파일로 내보내기
5. 생성된 디자인을 기반으로 기존 코드 수정

### 제한사항
- Tailwind/React 코드가 아닌 바닐라 HTML/CSS 출력
- 기존 코드 구조 무시 — 완전 새로 생성
- 커스텀 디자인 시스템 임포트 불가

---

## 10. 워크플로우 비교 및 추천

### 종합 비교표

| 도구 | 코드→디자인 | 디자인→코드 | 라운드트립 | 난이도 | 비용 |
|------|------------|------------|-----------|--------|------|
| **Code to Canvas** | ★★★★ | ★★★★ | ★★★★ | 중 | Figma Pro + Claude |
| **html.to.design** | ★★★★ | - | ★★ | 낮 | 무료~ |
| **Antigravity+Stitch** | ★★★ | ★★★★ | ★★★ | 중 | 무료 |
| **Piny** | ★★★ | ★★★★★ | ★★★★ | 최저 | 무료 |
| **Tail Lens** | ★★ | ★ | ★ | 최저 | 무료 |
| **v0** | ★★ | ★★★★★ | ★★ | 낮 | 무료~ |
| **Builder.io** | ★★★ | ★★★★★ | ★★★ | 중 | 유료 |

### 추천 워크플로우 (Sauna Log 프로젝트 기준)

#### A. 풀 라운드트립이 필요할 때 (가장 추천)
```
기존 코드 → [Code to Canvas] → Figma 편집 → [Claude Code + Figma MCP] → 코드 업데이트
```
**장점**: 양방향 완전 지원, Claude Code가 기존 코드 구조 이해
**비용**: Figma Pro 필요

#### B. 빠른 스타일 수정 (일상적 사용)
```
기존 코드 → [Piny in VS Code] → 시각적 Tailwind 편집 → 자동 코드 저장
```
**장점**: 무료, 설치 간단, 코드에 직접 반영
**적합**: 색상/간격/레이아웃 미세 조정

#### C. 전면 리디자인 (대규모 변경)
```
기존 앱 스크린샷 → [Google Stitch] → 새 디자인 생성
→ [html.to.design] → Figma로 변환 → 디자인 정제
→ [Claude Code + Figma MCP] → 기존 코드에 적용
```
**장점**: 새로운 디자인 방향 탐색 가능
**단점**: 파이프라인이 길고 수동 조율 필요

#### D. Antigravity 올인원 (실험적)
```
Antigravity로 기존 프로젝트 열기
→ Stitch MCP로 UI 리디자인
→ Gemini 에이전트가 코드 수정
→ 라이브 프리뷰 확인
```
**장점**: 단일 도구, 무료
**단점**: Public Preview 단계, 안정성 미검증

---

## 소스

- [Figma + Anthropic Code to Canvas 발표](https://www.cnbc.com/2026/02/17/figma-anthropic-ai-code-designs.html)
- [Code to Canvas 워크플로우 상세](https://muz.li/blog/claude-code-to-figma-how-the-new-code-to-canvas-integration-works/)
- [Figma Blog: Code to Canvas](https://www.figma.com/blog/introducing-claude-code-to-figma/)
- [html.to.design 공식](https://html.to.design/home/)
- [html.to.design Figma Plugin](https://www.figma.com/community/plugin/1159123024924461424)
- [Google Antigravity 공식](https://antigravity.google/)
- [Antigravity + Stitch 워크플로우](https://medium.com/@nischalmudennavar/the-antigravity-stitch-workflow-for-functional-prototypes-15dc40b9a690)
- [Google Stitch 공식](https://developers.googleblog.com/stitch-a-new-way-to-design-uis/)
- [Piny 공식](https://getpiny.com/)
- [Piny VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Pinegrow.piny)
- [Tail Lens 공식](https://www.taillens.io/)
- [Vercel v0](https://v0.dev/)
- [Builder.io Figma Plugin](https://www.figma.com/community/plugin/747985167520967365)
- [Figma MCP Server Guide](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server)
- [Builder.io figma-html (GitHub)](https://github.com/BuilderIO/figma-html)
- [Figma + OpenAI Codex](https://dataconomy.com/2026/02/26/figma-integrates-openai-codex-for-design-to-code-workflow/)
