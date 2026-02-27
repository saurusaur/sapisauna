---
name: maker-checker
description: 독립 검증 에이전트. 작업 결과물만 보고 독립적으로 검증. 컨텍스트 격리로 확증편향 방지.
user-invocable: true
allowed-tools: "Read, Glob, Grep, Bash(npx tsc *), Bash(npx next lint *), Bash(git diff *), Bash(git log *), Bash(wc *)"
---

# Maker-Checker (독립 검증)

작업물에 대한 독립적 검증. 작업자의 의도나 추론은 보지 않음.

---

## 사용법

```
/maker-checker                    # 최근 변경사항 검증
/maker-checker [파일경로]          # 특정 파일 검증
/maker-checker --since HEAD~3     # 최근 3커밋 검증
```

---

## 검증 프로토콜

1. `git diff --name-only HEAD~1` 로 아티팩트 수집
2. 카테고리별 검증:
   - **TypeScript/TSX**: `npx tsc --noEmit` 타입 검사, import 존재 여부
   - **데이터(JSON)**: JSON.parse 유효성, 스키마 일관성
   - **문서(MD)**: frontmatter 존재, 깨진 링크
   - **스타일**: `npx next lint` 린트 검사
3. 리포트 작성: PASS / PASS_WITH_WARNINGS / FAIL

---

## 컨텍스트 격리 (핵심 원칙)

Checker에게 전달: 변경 파일 목록, git diff, CLAUDE.md
전달 금지: 작업 에이전트의 대화 내역, "잘 됐습니다" 보고
