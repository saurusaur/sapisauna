# docs/plans 문서 vs 실제 코드 대조 분석

> 분석일: 2026-03-03
> 대상: docs/plans/ 내 8개 문서 × 현재 코드베이스

---

## 문서별 상태 요약

| # | 문서 | 상태 | 판정 |
|---|------|------|------|
| 1 | `AUDIT_ui_vs_db_fields.md` | 전건 해결 완료 | 🗄️ 아카이브 |
| 2 | `PLAN_ui_db_sync.md` | 전건 해결 완료 (다만 계획과 다르게 적용된 부분 있음) | 🗄️ 아카이브 + 차이점 주석 |
| 3 | `PLAN_place_db_schema.md` | 대부분 적용, 일부 설계 변경 | 🗄️ 아카이브 |
| 4 | `PLAN_place_dedup_logic.md` | 절반 적용, 절반 미적용 (미래 기능 포함) | ✏️ 적용 완료 표시 필요 |
| 5 | `REVIEW_dedup_coordinates.md` | 전건 결정 완료 | 🗄️ 아카이브 |
| 6 | `PLAN_app_stabilization_20260228.md` | 부분 적용 | ✏️ 상태 업데이트 필요 |
| 7 | `REVIEW_duplicate_logic.md` | 미적용 (리팩토링 백로그) | 📋 백로그 유지 |
| 8 | `PLAN_reward_system.md` | 미적용 (미래 기능) | 📋 백로그 유지 |

---

## 1. AUDIT_ui_vs_db_fields.md — 🗄️ 아카이브

CRITICAL 4건 + WARNING 4건 + INFO 2건 모두 해결됨.

| # | 항목 | 계획 | 실제 적용 | 일치? |
|---|------|------|----------|-------|
| C1 | INSERT 로직 없음 | logs-service.ts에 insertLog/insertDeepLog 추가 | ✅ 동일하게 구현됨 | ✅ |
| C2 | place_id 미포함 | log/page.tsx에 placeId state 추가 | ✅ 동일하게 구현됨 | ✅ |
| C3 | 매점 3필드 DB 누락 | deep_logs에 has_store/store_score/store_memo 추가 | ✅ 동일하게 구현됨 | ✅ |
| C4 | purpose 타입 불일치 | purpose TEXT → purposes TEXT[] | ✅ 동일하게 구현됨 | ✅ |
| W5 | tribe_id vs log_type | INSERT 매핑으로 해결 예정 | ⚡ **DB 컬럼 자체를 tribe_id로 변경** | 더 나은 방향 |
| W6 | totono vs totono_score | INSERT 매핑으로 해결 예정 | ⚡ **UI 코드를 totono_score로 통일** | 더 나은 방향 |
| W7 | has_scrub vs had_scrub | INSERT 매핑으로 해결 예정 | ⚡ **DB 컬럼을 has_scrub으로 변경** | 더 나은 방향 |
| W8 | created_at vs logged_at | INSERT 매핑으로 해결 예정 | ⚡ **logged_at 컬럼 자체 제거** | 더 나은 방향 |
| I9 | refreshed_score/rest_quality UI 미구현 | 향후 처리 | 변경 없음 (NULL 저장) | ✅ |
| I10 | deep_logs 미구현 필드들 | 향후 처리 | 변경 없음 (NULL/빈배열) | ✅ |

### 계획 vs 실제의 핵심 차이

**계획**: WARNING 4건은 INSERT 함수 내부에서 키 매핑으로 해결 (`{ log_type: logData.tribe_id }`)
**실제**: DB가 비어있으므로 컬럼명 자체를 UI와 통일 → 매핑 함수 불필요

→ **실제 적용이 더 나음** (매핑 레이어 제거 = 버그 가능성 감소, 코드 단순화)

**결론**: 전건 완료. 이 문서는 아카이브 가능.

---

## 2. PLAN_ui_db_sync.md — 🗄️ 아카이브

### 체크리스트 대조

| 체크리스트 항목 | 상태 | 비고 |
|---------------|------|------|
| deep_logs에 has_store/store_score/store_memo 존재 | ✅ | 001_schema.sql에 반영 |
| deep_logs.purposes TEXT[] 변경 | ✅ | 001_schema.sql에 반영 |
| log/page.tsx에 place_id 포함 | ✅ | placeId state + logData에 포함 |
| insertLog() 존재 | ✅ | logs-service.ts |
| insertDeepLog() 존재 | ✅ | logs-service.ts |
| complete/page.tsx에서 Supabase INSERT 호출 | ✅ | saveLogToHistory 제거, insertLog/insertDeepLog 사용 |
| INSERT 매핑 (tribe_id→log_type 등) | ⚡ 불필요 | DB 컬럼명 자체를 통일 |
| 비로그인 localStorage 폴백 | ❌ 미구현 | 계획에는 있었으나, /complete는 미들웨어 인증 필수이므로 불필요하다고 판단하여 제외 |
| INSERT 실패 시 데이터 유실 방지 | ✅ | 실패 시 currentLog 유지 + 에러 토스트 |

### 계획과 다르게 적용된 부분

1. **비로그인 폴백 미구현**: 계획서에는 "인증 상태 확인 → 비로그인 시 localStorage 폴백"이 있었으나, 미들웨어가 /complete를 인증 필수로 보호하므로 비로그인 분기가 원천 불가. 올바른 판단.

2. **INSERT 매핑 함수 없음**: 계획서의 "UI→DB 키 매핑" 표가 모두 불필요해짐. DB 컬럼명 자체를 통일했으므로 더 깔끔.

3. **storage.ts 폴백 제거**: 계획서에는 "localStorage 저장을 폴백(오프라인)으로 유지할지 결정"이라 했으나, saveLogToHistory 호출 자체를 제거. DB가 SSOT. storage.ts의 SavedLog/saveLogToHistory/getSavedLogs는 현재 **사실상 미사용** (complete에서 import 안 함).

**결론**: 전건 완료. 계획 대비 더 단순하게 적용. 아카이브 가능.

---

## 3. PLAN_place_db_schema.md — 🗄️ 아카이브

### 코드 대조

| 계획 항목 | 실제 코드 | 일치? |
|----------|----------|-------|
| places에서 name/address 제거 | ✅ DB에 없음, place_sources에서 JOIN | ✅ |
| place_sources.link 컬럼 | ❌ 계획에는 있음 | ⚡ 이후 제거됨 (PLAN_place_dedup_logic에서 결정) |
| place_sources에 latitude/longitude | 계획에 없음 | ⚡ 이후 추가됨 |
| places.coordinate_source | 계획에 없음 | ⚡ 이후 추가됨 |
| places.status | 계획에 없음 | ⚡ 이후 추가됨 |
| places.merged | 계획에 없음 | ⚡ 이후 추가됨 |
| Dedup 3단계 로직 | ✅ addPlace()에 구현됨 | ✅ |

### 판정

이 문서는 **초기 설계**이고, 이후 PLAN_place_dedup_logic.md에서 발전됨. 현재 코드는 dedup 플랜을 따르므로 이 문서는 **역사적 참고용**.

**결론**: 아카이브. PLAN_place_dedup_logic.md가 최신 설계.

---

## 4. PLAN_place_dedup_logic.md — ✏️ 부분 적용, 정리 필요

가장 큰 문서. 항목별 대조:

### 적용 완료 (표시 필요)

| 섹션 | 계획 | 코드 상태 | 차이점 |
|------|------|----------|--------|
| DB 구조 (places) | coordinate_source, status, merged 컬럼 | ✅ 001_schema.sql | ✅ 일치 |
| DB 구조 (place_sources) | latitude/longitude 추가, link 유지 | ⚡ link 제거됨 | 계획은 link 유지, 코드는 제거 |
| 좌표 저장 정책 | places + place_sources 양쪽 저장 | ✅ 구현됨 | ✅ |
| Dedup 1단계 (external_id) | source+external_id 매칭 | ✅ addPlace()에 구현 | ✅ |
| Dedup 3단계 (신규 생성) | coordinate_source 설정 | ✅ addPlace()에 구현 | ✅ |
| find_nearby_places RPC | 복수형, LIMIT 1 제거 | ✅ 001_schema.sql + places-service.ts | ✅ |

### 계획과 다르게 적용된 부분 (비판적 분석)

#### A. `place_sources.link` — 계획은 유지, 코드는 제거

- **계획**: link TEXT 유지 (Naver 홈페이지 URL 등)
- **코드**: link 제거, 지도 URL은 external_id 기반 동적 생성
- **분석**: 코드가 더 나음. link 필드는 Naver에서 업체 홈페이지/SNS URL인데, 대부분 빈 문자열이고 지도 링크와 별개. 동적 생성이 항상 최신 URL 보장.

#### B. RPC 수학 공식 — Haversine vs 간소화

- **계획**: 정식 Haversine (acos/cos/sin/radians)
- **코드**: 간소화 공식 (lat/lng 차이를 111320m 기준 변환)
- **분석**: 50m 반경에서는 실질적 차이 없음. 간소화 공식이 연산 비용 낮음. 단, 적도/극지방에서 오차 증가하지만 한국 기준 무시 가능. **현재 코드가 적절**.

#### C. Dedup 2단계 — 유저 확인 UI 미구현

- **계획**: 50m 내 후보 발견 시 → "이미 등록된 장소가 있습니다. 같은 장소인가요?" 유저 확인 UI
- **코드**: 첫 번째 후보로 자동 병합 (유저 확인 없음)
- **분석**: 이것은 **의도적 단순화**. 유저 확인 UI는 추가 UX 설계 필요. 현재는 MVP로 자동 병합. 문서에서 "미구현, 향후 추가" 표시 필요.

### 미적용 (향후 기능)

| 섹션 | 상태 |
|------|------|
| 폐업 확인 플로우 | 미구현 (Google Place Details API 연동 필요) |
| 어드민 리뷰 화면 | 미구현 |
| 자동 크로스 소스 매칭 | 미구현 |
| 엣지 케이스 테스트 시나리오 | 미검증 (DB 비어있음) |

**결론**: 적용 완료 부분 표시 + 차이점 주석 + 미적용은 백로그 표시 필요.

---

## 5. REVIEW_dedup_coordinates.md — 🗄️ 아카이브

4개 질문 모두 결정 완료:

| 질문 | 결정 | 코드 반영 |
|------|------|----------|
| Q1: 좌표를 place_sources에도 저장? | ✅ 양쪽 저장으로 결정 | ✅ 001_schema.sql에 반영 |
| Q2: 50m 반경 적절? | ✅ 50m 유지 | ✅ RPC 기본값 50 |
| Q3: dedup 충돌 시 유저 확인 UX | 계획됨 (PLAN_place_dedup_logic) | ⚡ 자동 병합으로 MVP 구현 |
| Q4: 대표 좌표 업데이트 정책 | 첫 소스 좌표 유지 | ✅ 현재 코드 동작 |

**결론**: 모든 질문 해결됨. 아카이브 가능.

---

## 6. PLAN_app_stabilization_20260228.md — ✏️ 상태 확인 필요

| # | 항목 | 현재 상태 |
|---|------|----------|
| P0-1 | auth-context getSession catch | **확인 필요** |
| P0-2 | middleware getUser try/catch | **확인 필요** |
| P0-3 | user-context null → 스피너 | **확인 필요** |
| P0-4 | error.tsx 글로벌 에러 바운더리 | ❌ 미존재 |
| P1-5 | safeParse() 유틸 | ❌ 미존재 |
| P1-6~9 | 에러 핸들링 일괄 | **확인 필요** |
| P2-10~11 | Lint 정리 | **확인 필요** |

**결론**: P0-1~3이 적용되었는지 코드 확인 필요. error.tsx와 safeParse는 미구현.

---

## 7. REVIEW_duplicate_logic.md — 📋 백로그 유지

15건의 코드 중복/리팩토링 항목. 현재까지 적용된 것 없음.

| 변경된 것 | 비고 |
|----------|------|
| #12의 `totono` 필드 | `totono_score`로 통일됨 (but 타입 중복 자체는 미해결) |
| #14의 storage 이중 시스템 | saveLogToHistory 호출 제거됨 → storage.ts 사실상 미사용 |

**결론**: 리팩토링 백로그로 유지. 단, #14는 storage.ts 정리 가능 상태.

---

## 8. PLAN_reward_system.md — 📋 백로그 유지

미래 기능 설계문서. 코드 변경 없음. 백로그 그대로 유지.

---

## 권장 조치 요약

### A. 아카이브 대상 (4개) — "✅ ARCHIVED" 헤더 추가

1. `AUDIT_ui_vs_db_fields.md` — 전건 해결
2. `PLAN_ui_db_sync.md` — 전건 해결 (계획 대비 더 깔끔하게 적용)
3. `PLAN_place_db_schema.md` — 초기 설계, PLAN_place_dedup_logic로 대체
4. `REVIEW_dedup_coordinates.md` — 전건 결정 완료

### B. 적용 완료 표시 필요 (1개)

5. `PLAN_place_dedup_logic.md` — 적용 완료 섹션 체크 + 미적용(유저 확인 UI, 폐업 플로우) 표시

### C. 상태 확인 후 업데이트 필요 (1개)

6. `PLAN_app_stabilization_20260228.md` — P0 항목들 코드 확인 후 상태 업데이트

### D. 백로그 유지 (2개)

7. `REVIEW_duplicate_logic.md` — 리팩토링 백로그 (storage.ts 정리 가능 메모 추가)
8. `PLAN_reward_system.md` — 미래 기능, 변경 없음

### E. 비판적 차이점 (확인 필요)

| # | 차이 | 계획 | 실제 | 권장 |
|---|------|------|------|------|
| 1 | place_sources.link | 유지 | 제거 | ✅ 제거가 나음 |
| 2 | WARNING 4건 해결 방식 | INSERT 매핑 | DB 컬럼명 통일 | ✅ 통일이 나음 |
| 3 | RPC 공식 | Haversine | 간소화 | ✅ 50m에선 동일 |
| 4 | Dedup 유저 확인 UI | 구현 계획 | 자동 병합 | ⚠️ MVP OK, 향후 구현 필요 |
| 5 | 비로그인 localStorage 폴백 | 구현 계획 | 미구현 | ✅ 미들웨어 보호로 불필요 |
| 6 | saveLogToHistory 폴백 | 유지 예정 | 호출 제거 | ✅ DB가 SSOT |
