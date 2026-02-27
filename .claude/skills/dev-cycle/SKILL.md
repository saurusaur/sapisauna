---
name: dev-cycle
description: 개발 표준 사이클 오케스트레이터. 조사→기획→반박→구현→검증→회고 6단계를 순서대로 진행. "/dev-cycle", "개발 사이클 돌려줘", "end-to-end로 해줘" 등으로 호출.
user-invocable: true
allowed-tools: "Read, Glob, Grep, Write, Edit, Bash(git *), Bash(npx tsc *), Bash(npx next lint *)"
---

# Dev Cycle (개발 표준 사이클)

리서치부터 회고까지 6단계를 순서대로 진행하는 오케스트레이터.

```
[RESEARCH PHASE]          [BUILD PHASE]
  1. 리서치                  4. 구현
  2. 기획        → GATE →    5. 검증
  3. 반박                    6. 회고
```

---

## 사용법

```
/dev-cycle research [주제]   # 1~3단계만
/dev-cycle build [대상]      # 4~6단계만
/dev-cycle [주제]            # 전체 6단계
```

---

## 단계별 역할

### STEP 1 리서치
코드베이스 탐색 + 외부 레퍼런스 수집. 관련 파일, 패턴, 의존성 파악.

### STEP 2 기획
구현 범위, 파일 구조, 작업 순서 정의. `docs/plans/PLAN_[주제]_YYYYMMDD.md`에 저장.

### STEP 3 반박
`/devils-advocate` 적용 — CRITICAL/HIGH 이슈 발견 시 기획 수정.

### ⛔ GATE
사용자에게 기획 + 반박 결과 제시. 승인 후 구현 진입.

### STEP 4 구현
STEP 3 반박 반영한 코드 작성.

### STEP 5 검증
`/maker-checker` 적용. `docs/verification/checker_report_YYYYMMDD.md`에 저장.

### STEP 6 회고
예측 정확도, 소요 시간, rules/ 추가 제안. `docs/retro/RETRO_[주제]_YYYYMMDD.md`에 저장.

---

## 저장 규칙

| 단계 | 저장 위치 |
|------|-----------|
| STEP 1~2 결과 | `docs/plans/PLAN_[주제]_YYYYMMDD.md` |
| STEP 5 검증 | `docs/verification/checker_report_YYYYMMDD.md` |
| STEP 6 회고 | `docs/retro/RETRO_[주제]_YYYYMMDD.md` |
