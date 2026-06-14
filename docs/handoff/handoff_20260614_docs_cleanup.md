# 문서 정리 세션 — 핸드오프·LEDGER (2026-06-14)

docs/ 전반 정리. **이 문서 = 삭제 항목의 유효 내용이 어디 보존되는지 기록(LEDGER).** 삭제는 전부 git 복구 가능.

## 1. docs/po 재배치 (커밋 33a75ca)
- po에 SSOT만 유지: BACKLOG · VISION · SAPI_OVERVIEW_KR · 친구_몰아주기_위임플랜 · 친구_부탁_노션
- po→plans 7(구현스펙) · po→po/archive 4(완료기록) · DISCOVERY_LOG 삭제(빈 템플릿). 이동 파일 참조 경로 전역 갱신(dead-link 0).

## 2. 와이어프레임 정리 (커밋 d231fd8·36aa421)
- 사-리스트 11→2, 스토리 2 삭제, 로그 9 삭제. [final] SSOT + 활성 인용 시안만 유지.

## 3. 아카이브 정리 (이 커밋) — Tier 1+2 삭제, 보존처 명시

### Tier 1 — 폐기/중복 (내용 보존처 = 후속/SSOT)
| 삭제 | 유효 내용 보존처 |
|---|---|
| Lovable·디자인툴 탐색 7 (LOVABLE_design_info/prompts·DESIGN_SYSTEM_lovable·RESEARCH_design_tools/workflow_v2/code_to_design·composer-prompts) | 도구 미채택으로 종결 — 보존 불요(현 워크플로=Pencil MCP·수기 와이어프레임) |
| PLAN_sauna_pet (v1) | → `docs/plans/SPEC_sauna_pet_v2.5.1.md` + `PLAN_sauna_pet_v2.md` |
| PLAN_place_db_schema | → `docs/plans/archive/PLAN_place_dedup_logic.md` + 라이브 DB |
| home-redesign-plan | → `docs/plans/archive/home-redesign-v2-fixes.md` + 홈 구현(코드) |
| PLAN_design_overhaul_roadmap | → `docs/plans/archive/PLAN_design_overhaul_implementation.md` |
| fix-sa-list-bugs-20260324 | → `docs/plans/archive/fix-sa-list-round2-20260326.md` |
| PLAN_katalk_data_sync | → `docs/plans/PLAN_katalk_db_sync_phase18.md`(활성) + phase4(archive) |
| PLAN_phase6_detail_layout·phase6_history_detail·phase11_style_audit | → 현 로그 v6·히스토리·스타일 구현(코드 SSOT) |
| story_legacy bak 2 (image-export.ts.bak·page.tsx.bak) | → 현 `src/app/story` 코드 |
| 구 지도 MOCK 3 (MOCK_map_markers·map_pins_24h·explore_map_view) | → 현 지도는 코드 SSOT, 리디자인은 `docs/wireframes/fromBINIGEONI/`(WIP) 기반 |
| 사피_제안기능_구현스케치 (wireframes 사본) | → 동일 원본 `docs/research/사피_경쟁분석_제안기획_2026-06/`에 유지 |
| hackathon-research-plan | → 사우나 플레이리스트 리서치 `docs/research/archive/sauna-playlist-research.md` 보존 |

### Tier 2 — 데이터 작업 중간본 (final 보존처)
| 삭제 | final 보존처 |
|---|---|
| facility-verification 중간 5 (results·result·25·_20260324·katalk-facility-verification) | → `seed-facility-verification-full.md` + `katalk-facility-verification-23.md` + 라이브 DB |
| katalk 중간 3 (extraction-plan-0326·facility-analysis·old-vs-new-comparison-0327) | → `katalk-raw-extracts-20260326`·`katalk-facility-update-20260326`·`katalk-db-crosscheck-20260327` + `PROTOCOL_katalk_crawl_extract` |
| heic 비교 3 (converter-comparison·library-deep-comparison·resize-before-decode) | → 결정문서 `RESEARCH_cloudinary_heic.md`(+`cloudinary-vs-cloudflare-deep-comparison`) |

### 보존(삭제 안 함)
- 핸드오프 archive 전체(세션 메모리) · plans/archive PLAN_* 23(구현상태 불명 — 추후 BACKLOG/코드 대조 필요)
- research/archive: audit·name/address verification·seed-data·전략리서치(Strava/벤치마크)·tattoo-policy(48·18 둘 다, 고유 데이터)·review-westin(보수적 보존)
- po/archive 7(최근 완료기록)

## 미해결 / 후속
- plans/archive PLAN_* 23건: 각 PLAN을 BACKLOG·코드와 대조해 구현완료/폐기 판정 후 정리 — 별도 조사 작업
- WIP·untracked(지도플랜·fromBINIGEONI·코드 content.ts·explore·log)는 본인 작업 흐름에서 처리 (BACKLOG 상단 주석 참조)
