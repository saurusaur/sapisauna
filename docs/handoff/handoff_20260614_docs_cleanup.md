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
- 핸드오프 archive 전체(세션 메모리)
- research/archive: audit·name/address verification·seed-data·전략리서치(Strava/벤치마크)·tattoo-policy(48·18 둘 다, 고유 데이터)·review-westin(보수적 보존)
- po/archive 7(최근 완료기록)

## 4. plans/archive PLAN_* 23건 구현상태 대조 (이 커밋) — 19 삭제·4 보존
마이그레이션·코드·커밋 증거로 구현완료(DONE) 판정 → 삭제. 내용=코드/마이그레이션이 SSOT.

| 삭제(DONE) | 구현 증거(SSOT 보존처) |
|---|---|
| PLAN_color_hue_migration | 019·020 마이그 + user-context·profile-icon·utils(coverHex) |
| PLAN_facility_type_bath_policy_split | 009 마이그 + types(BathPolicy)·explore |
| PLAN_facility_type_ui_implementation | types/index.ts·constants/content.ts |
| PLAN_warm_hot_bath_split | 008 마이그 + very_hot_bath_temp(타입·상수·explore) |
| PLAN_deep_log_bath_temps | BLOCK_TYPES(constants) + history 상세 온도 섹션 |
| PLAN_steam_sauna_quick_log | 024 마이그 + steam_sauna_temp·primary_sauna_kind(log) |
| PLAN_wet_sauna_quick_log | 024로 steam 통합 대체(B안 폐기) |
| PLAN_geocoding_migration | 022 마이그 + api/places/*-geocode·lib/geo |
| PLAN_ui_db_sync | "적용완료 2026-03-03" + logs-service place_id |
| PLAN_dashboard_statistics | lib/history-stats.ts + components/features/history-dashboard/ |
| PLAN_reward_system | constants/rewards·lib/reward-service·reward-engine (커밋 ebd28e0) |
| PLAN_tribe_picks_card | components/features/tribe-picks-card.tsx (홈 통합) |
| PLAN_typography_system | tailwind fontFamily.heading + font-heading 적용 |
| PLAN_tattoo_cover_ui | content.ts(tattoo)·place-facility-editor·explore 필터 |
| PLAN_error_logging | instrumentation·error.tsx·lib/error-logger (Sentry, 커밋 c6adb35) |
| PLAN_admin_log_invisible | ADMIN_USER_ID 필터(logs-service·explore) |
| PLAN_form_flow_consistency_refactor | place-facility-editor·use-confirmable-exit·error-banner |
| PLAN_log_edit_session_helper | lib/log-edit-session.ts (커밋 00918da) |
| PLAN_history_dashboard_agent_handoff | history-dashboard/ + history-stats (커밋 3bb4623) |

**보존(4)**: PLAN_sa_list_renewal(§E "구독리스트 지도"=BACKLOG P2 활성 SSOT) · PLAN_seed_data_and_facility_reward(시드 done, 시설기여보상 미구현=어드민 대기) · PLAN_staging_environment(미도입, 참고) · REVIEW_phase3_devils_advocate(학습 기록).

## 미해결 / 후속
- WIP·untracked(지도플랜·fromBINIGEONI·코드 content.ts·explore·log)는 본인 작업 흐름에서 처리 (BACKLOG 상단 주석 참조)
