# Workflow Cheat Sheet

> 변경사항을 라이브에 직접 푸시하지 않고 미리 검증하는 워크플로.
> 라이브 = `main` (외부 노출, sapisauna.vercel.app)
> 검증 = `preview` (본인만, sapisauna-git-preview-saunabum.vercel.app)
> 작업 격리 = `feature/*`

---

## 🔖 즐겨찾기

| 환경 | URL |
|------|-----|
| **Preview (본인 검증)** | https://sapisauna-git-preview-saunabum.vercel.app |
| Production (외부) | https://sapisauna.vercel.app |
| Vercel 대시보드 | https://vercel.com/saunabum/sapisauna |
| Supabase 대시보드 | https://supabase.com/dashboard/project/nztmoyfqbeqkuhczjixx |

---

## 🔁 Standard Workflow

### 1. feature 브랜치로 작업 시작

```bash
git checkout main && git pull
git checkout -b feature/오늘작업
```

| 명령 | 의미 |
|------|------|
| `git checkout main` | main 브랜치로 전환 (시작점을 최신으로) |
| `git pull` | origin/main의 최신 커밋을 받아옴 |
| `git checkout -b feature/오늘작업` | `feature/오늘작업` 새 브랜치 생성 + 전환. 현재 main에서 분기 |

### 2. 작업하고 커밋

```bash
# ... 코드 수정 ...
git add <파일> 또는 git add -A
git commit -m "메시지"
```

| 명령 | 의미 |
|------|------|
| `git add <파일>` | 특정 파일을 스테이징 (커밋 후보로 등록) |
| `git add -A` | 모든 변경 파일을 스테이징 (편하지만 .env 같은 거 실수로 들어갈 수 있음) |
| `git commit -m "..."` | 스테이징된 변경을 하나의 커밋으로 묶음 |

### 3. feature 브랜치 푸시 (선택적 단독 검증)

```bash
git push -u origin feature/오늘작업
```

| 명령 | 의미 |
|------|------|
| `git push` | 로컬 커밋을 GitHub에 업로드 |
| `-u origin feature/오늘작업` | "이 로컬 브랜치를 origin의 같은 이름 브랜치와 추적하기"로 첫 푸시 시 등록. 이후엔 `git push`만으로 동작 |
| (Vercel 자동 동작) | feature URL `sapisauna-git-feature-오늘작업-saunabum.vercel.app` 자동 생성 — **봐도 되고 무시해도 됨** |

### 4. preview 통합 + 검증

```bash
git checkout preview
git pull
git merge feature/오늘작업
git push
```

| 명령 | 의미 |
|------|------|
| `git checkout preview` | preview 브랜치로 전환 |
| `git pull` | preview의 최신 상태 가져오기 (다른 머신/PR 변경 동기화) |
| `git merge feature/오늘작업` | feature 작업을 preview에 합치기. 충돌 시 해결 후 다시 commit |
| `git push` | preview에 푸시 → **preview URL 자동 갱신** → 브라우저에서 검증 |

### 5. 검증 OK → main에 PR 머지 (라이브 배포)

```bash
gh pr create --base main --head preview --title "이번 묶음 요약" --body "변경 내용"
gh pr merge --squash
```

| 명령 | 의미 |
|------|------|
| `gh pr create` | GitHub CLI로 Pull Request 생성 |
| `--base main --head preview` | preview의 변경을 main으로 머지하는 PR |
| `--title / --body` | PR 제목·본문 |
| `gh pr merge --squash` | 머지 실행. `--squash`는 preview의 여러 commit을 하나로 압축해서 main에 넣음 (히스토리 깔끔) |
| (자동) Vercel | main 푸시 감지 → 프로덕션 자동 배포 |

### 6. feature 브랜치 정리

```bash
git checkout main && git pull
git branch -d feature/오늘작업
git push origin --delete feature/오늘작업
```

| 명령 | 의미 |
|------|------|
| `git checkout main && git pull` | main으로 돌아와 라이브 반영 결과 동기화 |
| `git branch -d feature/오늘작업` | 로컬 feature 브랜치 삭제 (`-d`는 안전 삭제, 머지 안 됐으면 거부) |
| `git push origin --delete feature/오늘작업` | 원격 GitHub의 feature 브랜치도 삭제 |

> **preview 브랜치는 절대 삭제 X** — long-lived 통합 브랜치라 영구 유지.

---

## 🚨 자주 쓰는 보조 명령

### 상태 확인
```bash
git status              # 현재 브랜치 + 변경사항 요약
git log --oneline -10   # 최근 10개 커밋 한 줄씩
git branch -a           # 로컬+원격 모든 브랜치 (-a = all)
git diff                # 아직 커밋 안 한 변경사항 보기
git diff --stat         # 변경 파일 + 라인 수만 요약
```

### 작업 취소
```bash
git restore <파일>           # 파일을 마지막 커밋 상태로 되돌림 (스테이징 안 된 변경 버림)
git restore --staged <파일>  # 스테이징만 해제 (변경은 유지)
git checkout main -- <파일>  # 다른 브랜치 버전으로 파일 되돌림
```

### main 직접 push 시도하면 차단됨

```
❌ main 브랜치 직접 push 금지
```

이건 정상. **이 경우 다음 흐름으로 진행**:

```bash
git checkout preview && git merge <feature브랜치>
git push
gh pr create --base main --head preview --title "..."
gh pr merge --squash
```

응급 시 우회: `git push --no-verify` (사고 직후 hotfix 등 정말 급할 때만)

---

## 🛡️ 안전 장치 요약

| 장치 | 위치 | 역할 |
|------|------|------|
| `pre-push` hook | `.git/hooks/pre-push` | main 직접 push 차단 (이 머신 한정) |
| Vercel preview | 자동 | 모든 push에 preview URL 발급 |
| Supabase RLS | DB | 데이터 권한 (auth + owner 검증) |
| `.env` gitignore | `.gitignore` | secrets 코밋 방지 |

---

## 💡 작업 단위 가이드

| 변경 규모 | 추천 |
|-----------|------|
| 1줄 fix, 오타 | feature 만들지 말고 그냥 preview에서 직접 commit (단순화) |
| 한 기능, 1~3 파일 | feature/이름 → preview 머지 |
| 큰 기능, 며칠 걸침 | feature/이름 길게 유지, 중간 진행은 feature URL에서만 검증 |
| 응급 hotfix | feature/hotfix → preview 빠르게 검증 → main 머지 |

---

## 📚 관련 문서

- 인프라 결정 배경: `docs/plans/archive/PLAN_staging_environment.md`
- Sentry 가이드: `docs/guides/SENTRY_GUIDE.md`
- 백로그: `docs/po/BACKLOG.md`
