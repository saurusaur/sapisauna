# 시드 데이터 작업 파일 정리 + 아카이브 계획

> 시드 데이터 정리 완료 후 파일 분류. 다음 단계: 추천 리스트 기능 구현.

---

## 1. 아카이브 대상 (docs/plans/archive/로 이동)

구현 완료된 플랜. 더 이상 참조 불필요.

| 파일 | 최종 반영 |
|------|----------|
| `PLAN_warm_hot_bath_split.md` | ✅ 온탕/열탕 분리 구현 완료 (03-20 `2d0c8cd`) |
| `PLAN_facility_type_bath_policy_split.md` | ✅ facility_type + bath_policy 분리 완료 (03-20 `f004186`) |
| `PLAN_facility_type_ui_implementation.md` | ✅ UI 구현 완료 (03-20 `afe0d12`) |
| `PLAN_admin_log_invisible.md` | ✅ 어드민 비가시화 구현 완료 (03-21 `a0e7702`) |
| `PLAN_deep_log_bath_temps.md` | ✅ 탕 온도 통합 섹션 구현 완료 (03-21 `84d0864`) |
| `PLAN_katalk_data_sync.md` | ✅ 카톡 데이터 60건 DB 반영 완료 (03-21 `7fa4ecd`) |
| `PLAN_seed_bulk_registration.md` | ✅ 229건 벌크 등록 완료 (03-21 `d3e598d`) |
| `PLAN_seed_data_validation.md` | ✅ 검증 완료, 결과는 seed-data-unified.json에 반영됨 |
| `PLAN_seed_data_and_facility_reward.md` | ✅ 시드 등록 완료. 보상 시스템은 칭호로 대체 |
| `PLAN_tattoo_cover_ui.md` | ✅ 타투 커버 모달 구현 완료 (03-20 `afe0d12`) |

## 2. 유지 (다음 기능에 필요)

| 파일 | 이유 |
|------|------|
| **docs/plans/** |
| `PLAN_venue_type_auto_mapping.md` | 미구현 — API 카테고리→시설유형 자동매핑. P1 백로그 |
| `PLAN_reward_system.md` | 참고용 — 칭호 시스템으로 대체됐지만 향후 뱃지 확장 시 참조 |
| `reference_reward_system_design.md` | 참고용 — 위와 동일 |
| `REVIEW_safeParse_errors.md` | 미완료 — P1 백로그 |
| `ANALYSIS_storage_strategy.md` | 참고용 — Auth 가드/스토리지 전략 |
| `TODO_place_dedup_remaining.md` | 미완료 — 중복 장소 처리 |
| **docs/research/** |
| `katalk-facility-analysis.md` | 유지 — 카톡 커뮤니티 인사이트, 유저 세그먼트 정보 |
| `katalk-tag-review.csv` | 유지 — 스텔라 확인 대기 중 (프리마/더메디스파 타투 등) |
| `katalk-facility-detail-v2.csv` | 유지 — 카톡 추출 최종본, 추가 보강 시 참조 |
| `notion-review-db-analysis.md` | 유지 — 노션 리뷰 DB 분석 (추가 시드 소스) |
| `notion-simple-review-analysis.md` | 유지 — simple review 원본 + 태그 |
| `review-westin-chosun.md` | 유지 — 리뷰 데이터 원본 |
| `legal-review-beta.md` | 유지 — 법률 검토 |
| **scripts/** |
| `seed-data-unified.json` | 유지 — SSOT. place_id 매핑 포함 |
| `seed-registration-result.json` | 유지 — 이름↔UUID 매핑 (큐레이션용) |
| `010_curated_lists_DRAFT.sql` | 유지 — 큐레이션 테이블 드래프트 |
| `seed-places.ts` | 유지 — 벌크 등록 스크립트 (재사용 가능) |
| `sync-katalk-data.ts` | 유지 — 카톡 데이터 반영 스크립트 (재사용) |

## 3. 아카이브 대상 (docs/research/ → docs/research/archive/)

시드 작업 중간 산출물. 최종 결과는 seed-data-unified.json에 반영됨.

| 파일 | 최종 반영 |
|------|----------|
| `facility-verification-25.md` | → seed-data-unified.json에 반영됨 |
| `facility-verification-result.md` | → 위와 동일 |
| `facility-verification-results.md` | → 위와 동일 |
| `facility-tags-44-websearch.md` | → seed-data-unified.json 태그에 반영됨 |
| `facility-tags-research-48.md` | → 위와 동일 |
| `facility-shampoo-english-name-verification.md` | → shampoo 태그 + 영문명 반영됨 |
| `katalk-facility-verification.md` | → CSV 시설 검증 → 시드에 반영됨 |
| `katalk-facility-verification-23.md` | → 위와 동일 |
| `seed-data-full-audit-20260320.md` | → 감사 결과 반영됨 |
| `seed-data-full-listing.md` | → seed-data-unified.json이 최신 |
| `seed-data-gender-policy.md` | → bath_policy로 반영됨 |
| `seed-facility-verification-full.md` | → 검증 결과 반영됨 |
| `tattoo-policy-18-unknown.md` | → tattoo 태그 반영됨 |
| `tattoo-policy-48-facilities.md` | → 위와 동일 |
| `venue-type-corrections.md` | → facility_type 반영됨 |
| `katalk-facility-detail-extract.csv` | → v2로 대체됨 |
| `katalk-db-update-plan.csv` | → sync 완료 |
| `katalk-tag-review-checklist.md` | → katalk-tag-review.csv로 대체 |
| `katalk-extraction-debug.json` | → 디버그용, 삭제 가능 |

## 4. 삭제 후보 (스텔라 확인 필요)

| 파일 | 이유 |
|------|------|
| `scripts/extract_facility_info.py` | v2/v3로 대체된 초기 버전 |
| `scripts/extract_facility_info_v2.py` | v3로 대체 |
| `scripts/extract_facility_info_v3.py` | extract_facility_v2.py로 대체 |
| `scripts/unify-seed-data.py` | 1회성 통합 스크립트, seed-data-unified.json 생성 후 불필요 |
| `scripts/fix-mismatched.ts` | 1회성 수정 스크립트 |
| `scripts/sync-names.ts` | 1회성 이름 sync 스크립트 |
| `scripts/seed-manual-review.json` | 수동 확인 완료됨 |
| `scripts/csv-new-facilities.json` | seed-data-unified.json에 통합됨 |
| `scripts/notion-seed-candidates.json` | seed-data-unified.json에 통합됨 |
| `scripts/seed-data.json` | seed-data-unified.json에 통합됨 |
| `docs/research/katalk-extraction-debug.json` | 디버그용 |
| `docs/research/cloudinary-vs-cloudflare-deep-comparison.md` | HEIC 관련, 시드와 무관 |
| `docs/plans/effervescent-moseying-quiche.md` | 이전 플랜 별명파일? |

## 5. 질문

1. **effervescent-moseying-quiche.md** — 이 파일 뭔가요? 삭제해도 되나요?
2. **pwa-desktop-layout-patterns.md**, **username-profanity-filter-options.md** — 시드와 무관, 유지? 아카이브?
3. **HEIC 관련 3개** (heic-converter-comparison, heic-library-deep-comparison, heic-resize-before-decode) — 시드와 무관, 유지?
4. **삭제 후보 13개** — 전부 삭제 OK? 아니면 일부 보존?
