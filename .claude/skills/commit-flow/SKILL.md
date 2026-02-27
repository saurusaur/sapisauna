---
name: commit-flow
description: One-command git workflow for quick commits. Detects device, stages files, commits with proper format, and optionally pushes.
user-invocable: true
allowed-tools: "Bash(git *), Bash(hostname *), Read, AskUserQuestion"
---

# Commit Flow

staging → commit → push 원스톱 워크플로우.

---

## 사용법

```
/commit-flow            # 인터랙티브 커밋 플로우
/commit-flow --push     # 커밋 + 푸시까지
```

---

## Flow

1. **디바이스 감지**: `hostname` → 브랜치 접두사 결정
2. **상태 확인**: `git status`, `git branch --show-current`
3. **main 브랜치 체크**: main이면 → 피처 브랜치 생성 제안
4. **파일 스테이징**: 사용자에게 범위 확인
5. **커밋**: 타입 자동 감지 + HEREDOC + Co-Authored-By
6. **푸시**: 사용자에게 확인 후 push

---

## Commit Message

타입 자동 감지:
- add/new/create → `feat:` | fix/bug → `fix:` | doc → `docs:` | refactor → `refactor:`

항상 포함:
```
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Pre-Flight Checks

- 10개+ 파일: 사용자 확인 필요
- 시크릿 스캔: api_key/password/secret/token 감지 시 경고
