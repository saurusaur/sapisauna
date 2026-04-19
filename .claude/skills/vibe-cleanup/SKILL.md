---
name: vibe-cleanup
description: |
  바이브코딩으로 빠르게 만든 코드를 프로덕션 품질로 정리하는 스킬.
  AI가 만든 코드에서만 발생하는 문제(없는 패키지 참조, 패턴 혼재, 코드 중복, 빈 테스트)를 탐지한다.

  Sauna Log 레포에서 사용 시: Next.js 14 App Router + TypeScript + Supabase + `references/PROJECT_SAUNA_LOG.md`를 함께 적용한다.

  이럴 때 사용:
  - 바이브코딩으로 앱을 만들었는데 정리가 필요할 때
  - AI가 생성한 코드를 배포 전에 점검하고 싶을 때
  - PR 전에 코드를 깔끔하게 만들고 싶을 때 (--diff 모드)

  Triggers: vibe-cleanup, 바이브 정리, 코드 정리, 클린업, cleanup, 정리해줘, 코드 청소, /vibe-cleanup
user-invocable: true
allowed-tools: "Read, Glob, Grep, Write, Edit, Bash(npm run lint *), Bash(npm run build *), Bash(npx tsc *), Bash(git *)"
---

# Vibe Cleanup (Sauna Log)

## 시작하기

`/vibe-cleanup` 또는 "vibe-cleanup 해줘"로 호출.

**하는 일:**
1. 프로젝트 스택·도구 자동 판별 (이 레포는 아래 **고정 컨텍스트** 참고)
2. AI 특유 문제 + 공통 위생 항목 탐지
3. 안전한 것은 자동 수정, 불확실한 것은 사용자 확인
4. 검증: **기본은 엄격** — `npm run lint` 후 `npm run build` (클린업은 자주 안 하므로 한 번에 잡는 쪽이 이득)
5. 결과 요약 리포트

**최근 변경분만:** `/vibe-cleanup --diff` → `git diff` 기준 변경 파일 위주

**빠른 패스 (예외):** 사용자가 명시하거나 환경 이슈로 빌드가 불가할 때만 `lint`만 수행하고 리포트에 그 이유를 남긴다.

## 이 레포 고정 컨텍스트

실행 시 **반드시** 읽을 것:

| 파일 | 용도 |
|------|------|
| 루트 `CLAUDE.md` | 프로젝트 규칙 최우선 |
| `.claude/rules/*` | 세부 실행 규칙 |
| `references/PROJECT_SAUNA_LOG.md` | 디렉터리·검증 명령·흔한 환각 포인트 |

**감지 스택 (기대값):** Next.js 14 App Router, TypeScript, Tailwind, Supabase 클라이언트

**검증 명령 (기본 = 엄격):** 순서 고정 — `npm run lint` → 성공 시 `npm run build`. 둘 다 통과할 때까지(최대 3회) 수정·재시도.

**선택:** `npx tsc --noEmit` (lint/build 사이에 타입만 빠르게 보고 싶을 때)

## 핵심 원칙

1. **AI 코드는 인간 코드와 다르다** — 환각 패키지, 스타일 혼재, 중복, 빈 테스트를 별도 탐지
2. **외부 도구는 선택적** — context7, LSP, Biome 없어도 내장 체크리스트로 동작
3. **확신 없으면 묻는다** — 자동 수정은 안전한 범위만
4. **CLAUDE.md > .claude/rules > 본 스킬** 순으로 우선

## 참조 파일 가이드 (경로 = 본 스킬 폴더 기준)

| 파일 | 읽는 시점 | 설명 |
|------|----------|------|
| `references/PROJECT_SAUNA_LOG.md` | 항상 (이 레포) | Sauna Log 전용 경로·검증·UI 규칙 |
| `references/checklists/common.md` | 항상 | 공통 위생·보안 기본 |
| `references/checklists/ai-specific.md` | 항상 | AI 코드 전용 |
| `references/checklists/typescript.md` | `tsconfig.json` 있을 때 | TS 검사 + 레포 예시 |
| `references/checklists/nextjs-react.md` | `next.config.*` 있을 때 | Next/App Router + 레포 예시 |
| `references/best-practices-registry.md` | 동적 조회 시 | 공식 URL, Supabase/Next 등 |

다른 언어 스택 체크리스트가 필요하면 원본 `vibe-cleanup` 패키지의 `references/checklists/*.md`를 이 폴더에 추가한다.

## 실행 절차 (요약)

원본 가이드와 동일한 8단계 흐름을 따른다. 차이만 명시한다.

### 1. 프로젝트 컨텍스트 감지

- `package.json`, `next.config.*`, `tsconfig.json`, `supabase/` 존재 여부 확인
- `eslint` / `eslint-config-next` 여부는 `package.json`에서 확인

### 2. 프로젝트 상태 평가

- 전체 스캔 또는 `--diff` 시 변경 파일만
- 사용자에게 규모·스택·린트·테스트 유무 요약 표시

### 3. 동적 베스트 프랙티스 조회 (선택)

- `references/best-practices-registry.md`의 Next.js, React, TypeScript, Supabase 행 참고
- context7 / WebFetch 가능 시만. 실패 시 체크리스트만

### 4. LSP + 외부 린터 (선택)

- 이 레포 기본: `npm run lint`
- Biome/Oxlint는 설정 파일 있을 때만

### 5. 체크리스트 실행

**로드 순서:**
1. `PROJECT_SAUNA_LOG.md`
2. `common.md`
3. `ai-specific.md`
4. `typescript.md` (해당 시)
5. `nextjs-react.md` (해당 시)
6. 동적 `[동적]` 항목 병합

Grep, Read, Glob으로 위반 탐지.

### 6. 위반 수정

위험도 HIGH → MEDIUM → LOW 순.

**자동 수정 후보 (확신 높을 때만):** 미사용 import, 디버그 `console.log`, 명백한 `==` → `===`

**사용자 확인:** 하드코딩 상수, 패턴 혼재, TODO, 중복 통합 여부

### 7. 검증

| 순서 | 명령 | 비고 |
|------|------|------|
| 1 | `npm run lint` | 기본 필수 |
| 2 | `npm run build` | 기본 필수 (클린업 빈도 낮음 → 엄격 검증 권장) |
| (선택) | `npx tsc --noEmit` | 필요 시만 |

실패 시 최대 3회까지 수정·재시도. **터미널 출력은 CLAUDE.md 출력 규칙 준수** (과다 로그 지양).

**예외:** 사용자가 빠른 패스만 요청했거나 `.env`/네트워크 등으로 빌드가 불가하면 `lint`만 실행하고 리포트에 제한 사항을 적는다.

### 8. 결과 리포트

원본 SKILL의 리포트 템플릿 사용. 프로젝트 정보에 `Sauna Log` / 감지된 `next`+`supabase` 명시.

## 코드베이스 특수 주의 (사용자 요청 시)

- **캘린더/히스토리 등 기존 날짜 선택·월 전환 로직**을 "정리" 명목으로 바꾸지 말 것. 동작 보존이 우선이면 사용자에게 확인.

## 결과 해석·주의·확장

원본 `vibe-cleanup/SKILL.md`의 "결과 해석 가이드", "주의사항", "점진적 확장" 테이블을 그대로 적용한다.

새 체크리스트 스택 추가 시: `references/checklists/{스택}.md` 추가 → `best-practices-registry.md` 보강 → 본 파일 1단계 감지 테이블에 한 줄 추가.

## 다른 에이전트용 원샷 프롬프트

```text
Sauna Log 레포에서 vibe-cleanup 스킬을 실행해라.
- 먼저 CLAUDE.md, .claude/skills/vibe-cleanup/references/PROJECT_SAUNA_LOG.md, common.md, ai-specific.md, typescript.md, nextjs-react.md 순으로 적용할 검사 범위를 정한다.
- mock/새 라우트 추가 없이 기존 코드만 점검한다.
- 자동 수정은 미사용 import·디버그 로그 등 안전한 것만. 나머지는 리포트에 "수동 확인"으로 남긴다.
- 검증: npm run lint 후 npm run build까지 기본 필수. 불가 시 사유와 함께 lint만.
- 캘린더·인증·미들웨어 관련 리팩터는 사용자 확인 없이 동작 변경하지 않는다.
```
