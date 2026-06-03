# Handoff — docs/ 구조 정리 (B안 평탄화) + 큐레이션 시드 + 사우나펫 정리 잔여

> ## ✅ [2026-05-31] docs B안 평탄화 정리 — 완료
> §3.2·§3.3·§3.4 전부 실행, `preview`에 반영·push 완료.
> - **반영 커밋**: `7fbb85d docs: B안 평탄화 — po/ 루즈 파일 재분배 + UNUSED 폐쇄 + 30일+ 핸드오프 archive` (origin/preview)
> - **결과**: po/ = SSOT 3개 + `SAPI_OVERVIEW_KR.md`, docs 폴더 10→9개(UNUSED 삭제), 깨진 참조 0건, 중복 0건
> - **이동 요약**: VIS.md→guides/, SPEC→plans/, MOCK 5개+신규 HTML 2개→wireframes/, CURATION·RESEARCH→research/, CLOUDERS→plans/, SAPI_444→plans/archive/, cardtemplates→wireframes/archive/, PLAN_log_edit_session_helper→plans/archive/, 30일+ 핸드오프 3개·dryrun.log 2개→handoff/archive/
> - **참조 경로 6곳 갱신**: PLAN_sauna_pet_v2.md, BACKLOG.md, SAPI_OVERVIEW_KR.md
> - **사용자 결정 추가 반영**: SAPI_OVERVIEW_KR.md → po/ 유지 / §3.3 재분배 제안대로 전부 진행
> - **정리 메모**: 작업 중 동시 세션이 preview에 끼어들어(df28de8가 staged 이동분을 흡수) 중복이 발생했으나, df28de8를 토스트 fix만 남기게 재작성(`282e231`) 후 docs를 cherry-pick(`7fbb85d`)으로 깨끗이 분리. 백업 태그·중복 브랜치 정리 완료. 데이터 유실 0.
>
> **잔여(사용자 입력 대기)**: 큐레이션 노천탕 시드 INSERT SQL(아라고나이트 확인 포함) / 사우나펫 Phase 1 디자인 리소스 결정 — 아래 §6 체크리스트 하단 2개.

Date: 2026-05-29
Branch: `preview`
선행 핸드오프:
- `handoff_20260519_사우나펫_v2.5.1.md` — 사우나펫 v2.5.1 Phase 0
- `handoff_20260523_katalk_db_sync.md` — 카톡 DB 싱크 (이번 세션 무관)

다음 세션 단독 진행을 위한 핸드오프.

---

## 1. 이번 세션 작업 흐름 (3개 트랙)

### 트랙 A — docs/ 구조 정리 (현재 진행 중, 미실행 잔여 있음)
### 트랙 B — 큐레이션 시드 (제안서 1개 작성, 사용자가 추가 조사 중)
### 트랙 C — 사우나펫 정리 (커밋·푸시 완료)

---

## 2. 완료된 작업

### 2.1 사우나펫 v2.5.1 사전 정렬 — 완료 + 푸시됨
- 결정 D1-D8 모두 완료 (자유선택 / 기존 XP 그대로 / 칭호=배지 / 베타 직후 / 친구는 코드만 V1 / 홈 위젯 + 풀스크린 / 맥반석란 / L3 9 variant)
- 마이그레이션 025 `jimi 구운달걀 → 맥반석란` 실행 완료
- 커밋: `655635d feat:...`, `0a66426 docs:...` → `origin/preview` 푸시 완료
- 상세 핸드오프 별도 (`handoff_20260519_사우나펫_v2.5.1.md`)

### 2.2 큐레이션 시드 — 노천탕 BEST 제안서 작성
- `docs/po/CURATION_SEED_outdoor_bath.md` 신규 작성
- 시설 10건 시드 JSON 검증 완료 (9/10 확실, 1건 "핀크스 포도호텔↔아라고나이트" 확인 필요)
- 리스트 메타: 이름 "노천탕 BEST" / 이모지 🌲 / hue 160 / 태그 "노천탕, 온천"
- **사용자가 추가 조사 중**. 확정 후 INSERT SQL 작성 예정

### 2.3 docs/ 구조 1차 정리 — 7개 파일 archive
**plans/archive/로 이동 (4개)**:
- `PLAN_sauna_pet.md` (v1 deprecated, v2로 superseded)
- `PLAN_steam_sauna_quick_log.md` (커밋 239630d 외 4개 적용)
- `PLAN_wet_sauna_quick_log.md` (steam sauna로 흡수)
- `ANALYSIS_storage_strategy.md` (DB-first 정책 user-context 적용)

**research/archive/로 이동 (3개)**:
- `RESEARCH_cloudinary_heic.md` (HEIC 변환 구현 완료)
- `sa_list_benchmark_20260323.md` (SA-LIST Phase 1-4 출시 완료)
- `sauna-playlist-research.md` (SA-LIST 출시 완료)

**각 파일 상단에 아카이빙 메모 추가 (날짜·근거)**.

**참조 경로 갱신**:
- `docs/po/BACKLOG.md` — 펫·steam sauna 항목의 archive 경로 반영
- `docs/plans/PLAN_sauna_pet_v2.md` — Supersedes 경로 archive 포함
- `docs/research/RESEARCH_INDEX.md` — §27, §32에 `[ARCHIVED 2026-05-24 → archive/]` 표기

### 2.4 PLAN_log_edit_session_helper 적용 검증
- `src/lib/log-edit-session.ts` 구현 완료 확인. 함수명은 PLAN과 약간 다름 (buildQuickEditSession / buildDeepEntrySession으로 분리, clearLogSessionAfterSave가 selectedRecordDate까지 정리)
- writer 2곳 + reader 2곳 모두 마이그레이션 완료 (커밋 `00918da`, `3cac216`)
- 빠진 내용 없음. 오히려 더 잘 구현됨 (steam_sauna_temp · primary_sauna_kind · _deepOnly 추가됨)
- **결론: archive 가능** (다음 세션에서 처리)

---

## 3. ⛔ 미실행 잔여 — docs/ 구조 정리 B안 (다음 세션 첫 작업)

### 3.1 사용자 결정 사항 (2026-05-29)

| # | 항목 | 결정 |
|---|---|---|
| 1 | `po/CLOUDERS_몰아주기_APPLICATION_DRAFT.md` | **진행 중** → `plans/`로 이동 |
| 2 | `po/SAPI_444_ROADMAP_DRAFT.md` | **archive** (사사사 협업 보류) |
| 3 | `design-system/VIS.md` | `guides/`로 이동 |
| 4 | `design-system/` 폴더 | **유지** (앞으로 디자인 자료 추가 예정) |
| 5 | `UNUSED/cardtemplates/` (bather/jimi/saunner/gradient SVG) | **아카이빙** |
| 6 | `UNUSED/` 폴더 | 삭제 (cardtemplates 옮긴 후) |

### 3.2 실행 액션 리스트

```bash
# 1) CLOUDERS — po/ → plans/
git mv docs/po/CLOUDERS_몰아주기_APPLICATION_DRAFT.md docs/plans/

# 2) SAPI_444 — po/ → plans/archive/ (사사사 보류)
git mv docs/po/SAPI_444_ROADMAP_DRAFT.md docs/plans/archive/

# 3) VIS.md — design-system/ → guides/
git mv docs/design-system/VIS.md docs/guides/

# 4) design-system/ 빈 폴더 유지 — .gitkeep 추가
touch docs/design-system/.gitkeep
git add docs/design-system/.gitkeep

# 5) UNUSED/cardtemplates/ → 추천: wireframes/archive/cardtemplates/
#    (UI/디자인 산출물 영역. design-system은 신규 자료 위주로 두고 archive는 wireframes에)
git mv docs/UNUSED/cardtemplates docs/wireframes/archive/cardtemplates

# 6) UNUSED/ 폴더 삭제
rmdir docs/UNUSED
```

### 3.3 SPEC + MOCK + RESEARCH + CURATION 재분배 (제안만, 사용자 OK 아직 안 받음)

위 6개 액션 외에 B안에서 제안한 **po/ 루즈 8개 재분배**가 사용자 답변 보류 상태로 보임. 다음 세션에서 사용자에게 확인 후 진행:

| 파일 | 제안 위치 | 근거 |
|---|---|---|
| `po/SPEC_sauna_pet_v2.5.1.md` | `plans/` | REF 한글본과 같이 두면 펫 묶음 |
| `po/MOCK_quick_log_primary.html` | `wireframes/` | 와이어프레임 영역 활성화 |
| `po/MOCK_quick_log_steam_sauna.html` | `wireframes/` | 동일 |
| `po/MOCK_stats_steam_toggle.html` | `wireframes/` | 동일 |
| `po/CURATION_SEED_outdoor_bath.md` | `research/` | curation_* 자료들과 묶음 |
| `po/RESEARCH_curation_seed_data.md` | `research/` | 명확한 리서치 |

### 3.4 부수 정리 (위 액션과 함께 처리 권장)

| 작업 | 명령 |
|---|---|
| `handoff/migrate_dryrun_*.log` (2개) → archive | `git mv docs/handoff/migrate_dryrun_*.log docs/handoff/archive/` |
| 30일+ 핸드오프 archive | `git mv docs/handoff/handoff_20260418_*.md docs/handoff/handoff_20260420_*.md docs/handoff/archive/` |
| `PLAN_log_edit_session_helper.md` archive | 상단에 적용 완료 메모 추가 후 `git mv docs/plans/PLAN_log_edit_session_helper.md docs/plans/archive/` |

---

## 4. 정리 후 docs/ 최종 구조 (목표)

```
docs/
├── DEPLOY_GUIDE.md / LAUNCH_CHECKLIST.md / STACK.md / UX_PRINCIPLES.md  (루트 유지)
├── po/          BACKLOG / VISION / DISCOVERY_LOG  ← SSOT 3개만
├── plans/       PLAN_* + REVIEW_* + TODO_* + REF_* + SPEC_* + CLOUDERS_* + archive/
├── research/    리서치 + 큐레이션 시드 + archive/ + katalk-20260519/
├── wireframes/  MOCK_* + archive/ (cardtemplates 포함)
├── handoff/     활성 핸드오프 + archive/
├── retro/       회고
├── guides/      개발 가이드 (SENTRY_GUIDE + VIS.md)
├── design-system/ .gitkeep 1개 (추후 채워질 자리)
└── legal/       법률
```

→ **10개 폴더 → 9개** (UNUSED 삭제). 신규 폴더 0개.

---

## 5. 현재 Git 상태

### 5.1 푸시 완료
- `655635d feat: jimi 첫 로그 마일스톤 "구운달걀" → "맥반석란" 통일`
- `0a66426 docs: 사우나펫 v2.5.1 작업 계획 및 디시전 정리`

### 5.2 미커밋 — 파일 정리 작업분 (다음 세션에서 마지막 액션까지 끝낸 뒤 한 번에 커밋 권장)
- plans/ 4개 archive 이동 + 메모
- research/ 3개 archive 이동 + 메모
- RESEARCH_INDEX.md §27·§32 표기
- BACKLOG.md / PLAN_sauna_pet_v2.md 참조 경로 갱신
- 큐레이션 시드 제안서 (`po/CURATION_SEED_outdoor_bath.md`) 신규
- ★ 위 §3.2 6개 액션은 아직 미실행

### 5.3 이번 세션과 무관한 미커밋 (사용자 별도 작업분, 그대로 보존)
- `src/app/log/deep/page.tsx` / `src/lib/image-export.ts` / `src/lib/logs-service.ts` / `src/lib/utils.ts`
- 5/23 커밋된 다른 작업 흔적도 있음 (`759fcbf` deep log key-presence 패턴)

커밋 분리 권장:
- 커밋 1: `docs: archive completed plans + research files` (7개 archive + 메모 + 참조 경로)
- 커밋 2: `docs: B-plan flat reorg — po/ 루즈 파일 재분배 + UNUSED 폐쇄` (§3.2 + §3.3 한 번에)
- 커밋 3: 큐레이션 시드 제안서 (사용자 확정 후 별도)

---

## 6. 다음 세션 체크리스트

```
☑ 이 핸드오프 + handoff_20260519 + PLAN_sauna_pet_v2.md 읽기
☑ git status — 미커밋 작업분 확인
☑ §3.2 6개 액션 실행 (CLOUDERS·SAPI_444·VIS·design-system·cardtemplates·UNUSED)
☑ §3.3 SPEC/MOCK/CURATION/RESEARCH 재분배 사용자 확인 후 진행 (전부 진행 결정)
☑ §3.4 부수 정리 (handoff/.log + 30일+ 핸드오프 + PLAN_log_edit_session_helper)
☑ archive 잔여 점검: po/는 SSOT 3개(+SAPI_OVERVIEW_KR) 남음
☑ 정리 커밋 + push origin preview (7fbb85d, 동시세션 충돌 cherry-pick으로 해소)
□ 큐레이션 노천탕 시드 — 사용자 추가 조사 결과 받으면 INSERT SQL 작성 (아라고나이트 확인 포함)
□ 사우나펫 Phase 1 착수 결정 — 디자인 리소스 옵션 (A/B/C/D, handoff_20260519 §4.1 참조)
```

---

## 7. 주요 참조

| 자료 | 경로 |
|---|---|
| 사우나펫 작업 계획 | `docs/plans/PLAN_sauna_pet_v2.md` |
| 사우나펫 스펙 | `docs/po/SPEC_sauna_pet_v2.5.1.md` |
| 사우나펫 핸드오프 | `docs/handoff/handoff_20260519_사우나펫_v2.5.1.md` |
| 큐레이션 시드 제안서 | `docs/po/CURATION_SEED_outdoor_bath.md` |
| 큐레이션 후보 원본 | `docs/research/curation_final_candidates_20260323.md` |
| BACKLOG SSOT | `docs/po/BACKLOG.md` |
| 시드 JSON (장소 매칭용) | `scripts/seed-data-unified.json` |
| Auto Memory | `/Users/stella/.claude/projects/-Users-stella-Documents-sauna-log/memory/MEMORY.md` |

---

*핸드오프 끝. §3.2 액션 6개부터 실행하면 됩니다.*
