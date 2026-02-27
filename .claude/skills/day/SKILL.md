---
name: day
description: 오늘의 Daily Note 생성 또는 업데이트. 아침에 목표 세팅, 중간/저녁에 git 기반 진행 기록. "/day"로 호출.
user-invocable: true
allowed-tools: "Read, Write, Edit, Bash(git log *), Bash(date *), Bash(ls *), Glob, AskUserQuestion"
---

# Daily Note (/day)

오늘의 Daily Note를 생성하거나 업데이트한다.

---

## 경로

- Daily Note 폴더: `Daily/`
- 파일명: `YYYY-MM-DD.md` (오늘 날짜)

---

## 핵심 원칙: 데일리 노트 = 컨텍스트 브리핑

**데일리 노트 하나만 읽으면 오늘의 모든 맥락을 파악할 수 있어야 한다.**

---

## 워크플로우

### Step 1: 오늘 날짜 확인
```bash
date +%Y-%m-%d
```

### Step 2: 파일 존재 여부 확인

`Daily/YYYY-MM-DD.md` 파일이 있는지 확인.

### Step 3-A: 파일 없음 → 새로 생성 (아침 모드)

1. 어제 노트 읽기 (필수): `Daily/` 폴더에서 가장 최근 파일을 찾아 읽는다
2. 어제의 미진행/이슈와 내일 항목을 이월 목록으로 추출
3. 아래 구조로 생성:

```markdown
---
date: YYYY-MM-DD
tags: [daily]
goals_completed: 0
goals_total: N
---

# YYYY-MM-DD

## 📌 현재 상황 요약
> 이 섹션을 읽으면 오늘의 맥락을 즉시 파악할 수 있습니다.

**어제(M/D) 성과**: N개 목표 중 N개 완료
- 성과 요약 1~3

**진행 중 프로젝트 현황**:
- **프로젝트명** — 현재 상태 → 다음 액션

---

## 🎯 오늘의 목표
- [ ] 이월 항목
- [ ] 새 목표

### 이월 내역 (M/D → M/D)
- 항목명 — 출처(미진행/내일)

---

## ✅ 완료한 작업
-

## 🤖 Claude Code 작업
<!-- Claude Code가 자동으로 추가합니다 -->

## 📝 메모 & 인사이트
-

## 🚧 블로커 / 이슈
-

## 미진행 / 이슈
-

## 🔜 내일 할 일
- [ ]
```

### Step 3-B: 파일 있음 → 업데이트 (저장 모드)

1. 기존 파일 읽기
2. git log로 오늘 커밋 가져오기:
   ```bash
   git log --format="%ai %s" --after="YYYY-MM-DDT00:00:00" --before="YYYY-MM-DDT23:59:59" --reverse
   ```
3. 커밋을 "완료한 작업" 섹션에 업데이트
4. 완료된 목표는 체크박스 체크 (`- [x]`)

---

## 출력

터미널에 간단히:
```
Daily Note YYYY-MM-DD [생성됨/업데이트됨]
- 오늘 커밋: N건
- 주요 성과: N건
- 미진행: N건
```
