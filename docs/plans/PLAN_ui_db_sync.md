# UI-DB 동기화 수정 계획

**작성일**: 2026-03-01
**근거**: `docs/plans/AUDIT_ui_vs_db_fields.md`
**목표**: UI에서 수집한 로그 데이터가 Supabase에 정확히 저장되도록 전체 파이프라인 정비

---

## 의존관계 다이어그램

```
#1 INSERT 로직 구현 (P0)
 ├─► #2 place_id 포함 (P0) ── #1과 동시 구현
 ├─► #4 purpose 타입 통일 (P0) ── INSERT 전에 DB 스키마 확정 필요
 ├─► #3 매점 필드 DB 추가 (P0) ── INSERT 전에 DB 스키마 확정 필요
 │
 ├─► #5 tribe_id → log_type 매핑 ── INSERT 시 자연 해결
 ├─► #6 totono → totono_score 매핑 ── INSERT 시 자연 해결
 ├─► #7 has_scrub → had_scrub 매핑 ── INSERT 시 자연 해결
 └─► #8 created_at → logged_at 매핑 ── INSERT 시 자연 해결
```

> WARNING #5~#8은 INSERT 매핑 함수 구현 시 자연스럽게 해결된다. 별도 작업 불필요.

---

## Phase 1: DB 스키마 확정 (선행 조건)

### #3 매점 관련 3개 필드 DB 누락

| 항목 | 내용 |
|------|------|
| **심각도** | CRITICAL |
| **우선순위** | P0 |
| **난이도** | S (간단) |
| **문제 설명** | UI(`/log/deep/page.tsx`)에서 `has_store`, `store_score`, `store_memo` 3개 필드를 수집하지만, `deep_logs` 테이블에 해당 컬럼이 존재하지 않음. INSERT 구현 시 이 데이터가 누락됨. |
| **영향 파일** | `supabase/migrations/001_schema.sql` (또는 신규 마이그레이션) |
| **선행 조건** | 없음 (스키마 변경이므로 가장 먼저) |
| **제안 해결책** | `deep_logs` 테이블에 3개 컬럼 추가 마이그레이션 실행: |

```sql
ALTER TABLE deep_logs ADD COLUMN has_store BOOLEAN DEFAULT false;
ALTER TABLE deep_logs ADD COLUMN store_score INT CHECK (store_score BETWEEN 1 AND 5);
ALTER TABLE deep_logs ADD COLUMN store_memo TEXT;
```

- `001_schema.sql`에도 반영하여 신규 배포 시 일관성 유지
- Supabase Dashboard > SQL Editor에서 ALTER 실행 후 `001_schema.sql`에 동기화

---

### #4 purpose 타입 불일치 (UI 배열 vs DB 단일 TEXT)

| 항목 | 내용 |
|------|------|
| **심각도** | CRITICAL |
| **우선순위** | P0 |
| **난이도** | M (보통) |
| **문제 설명** | UI는 복수 선택(`purposes: string[]`)이지만 DB는 `purpose TEXT`(단일값 + CHECK 제약). 현재 CHECK 제약: `'healing', 'after-workout', 'hangover', 'date', 'travel', 'leisure', 'work', 'sleep', 'meal'` 중 하나만 허용. |
| **영향 파일** | `supabase/migrations/001_schema.sql`, `src/types/index.ts` (`DeepLogData.purpose`), `src/lib/logs-service.ts` (조회 변환), INSERT 매핑 함수 |
| **선행 조건** | 없음 (스키마 변경이므로 가장 먼저) |
| **제안 해결책** | **방안 A (권장): DB를 TEXT[]로 변경** |

```sql
-- 기존 CHECK 제약 제거 + 타입 변경
ALTER TABLE deep_logs DROP CONSTRAINT IF EXISTS deep_logs_purpose_check;
ALTER TABLE deep_logs ALTER COLUMN purpose TYPE TEXT[] USING CASE
  WHEN purpose IS NOT NULL THEN ARRAY[purpose]
  ELSE '{}'::TEXT[]
END;
ALTER TABLE deep_logs ALTER COLUMN purpose SET DEFAULT '{}';
ALTER TABLE deep_logs RENAME COLUMN purpose TO purposes;
```

- `types/index.ts`: `DeepLogData.purpose: string` → `purposes: string[]`
- `logs-service.ts`: `toLogWithPlace`에서 `dl.purpose ? [dl.purpose] : []` → `dl.purposes || []`
- 컬럼명도 `purposes`로 리네임하여 UI 키와 일치시킴 (WARNING #해당없음 → 추가 매핑 불필요)

**방안 B (차선): UI를 단일 선택으로 변경** — 사용자 경험 후퇴이므로 비권장

---

## Phase 2: INSERT 로직 구현 (핵심)

### #1 logs/deep_logs INSERT 로직 없음

| 항목 | 내용 |
|------|------|
| **심각도** | CRITICAL |
| **우선순위** | P0 |
| **난이도** | L (복잡) |
| **문제 설명** | `complete/page.tsx`가 `saveLogToHistory()`로 localStorage에만 저장. `logs-service.ts`에는 SELECT 함수만 존재하고 INSERT/UPDATE 함수가 없음. 즉, 모든 로그 데이터가 Supabase에 전혀 도달하지 않는 상태. |
| **영향 파일** | |

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/logs-service.ts` | `insertLog()`, `insertDeepLog()` 함수 신규 작성 |
| `src/app/complete/page.tsx` | `saveLogToHistory()` 호출 전/후에 Supabase INSERT 호출 추가 |
| `src/lib/storage.ts` | localStorage 저장을 폴백(오프라인)으로 유지할지 결정 |
| `src/types/index.ts` | INSERT용 입력 타입 정의 (선택) |

| **선행 조건** | #3 (매점 컬럼 추가), #4 (purpose 타입 통일) 완료 후 |
| **제안 해결책** | |

#### 1) `logs-service.ts`에 INSERT 함수 추가

```typescript
// logs-service.ts에 추가할 함수 시그니처

/** Quick Log INSERT — UI 키 → DB 컬럼 매핑 포함 */
export async function insertLog(logData: Record<string, unknown>): Promise<string>
// 반환: 생성된 log UUID (deep_log 연결에 필요)

/** Deep Log INSERT */
export async function insertDeepLog(logId: string, deepData: Record<string, unknown>): Promise<void>
```

#### 2) UI → DB 키 매핑 (WARNING #5~#8 해결)

INSERT 함수 내부에서 다음 매핑 수행:

| UI 키 (localStorage) | DB 컬럼 | 변환 |
|----------------------|---------|------|
| `tribe_id` | `log_type` | 직접 매핑 (#5) |
| `totono` | `totono_score` | 직접 매핑 (#6) |
| `has_scrub` | `had_scrub` | 직접 매핑 (#7) |
| `created_at` | `logged_at` | 직접 매핑 (#8) |
| `purposes` (배열) | `purposes` (TEXT[]) | Phase 1 #4 완료 후 직접 매핑 |

#### 3) `complete/page.tsx` 수정

```
현재 흐름: currentLog → saveLogToHistory() → localStorage
목표 흐름: currentLog → insertLog() → Supabase
                      → saveLogToHistory() → localStorage (폴백)
```

- 인증 상태 확인 → 로그인 시 Supabase INSERT, 비로그인 시 localStorage 폴백
- INSERT 실패 시 localStorage에 저장 + 에러 토스트 표시 (데이터 유실 방지)
- 성공 시 localStorage 정리

---

### #2 place_id 미포함

| 항목 | 내용 |
|------|------|
| **심각도** | CRITICAL |
| **우선순위** | P0 |
| **난이도** | S (간단) |
| **문제 설명** | `log/page.tsx`의 `handleSave()`에서 `selectedPlace`의 `id`를 `currentLog`에 포함하지 않음. `place_name`만 저장하고 `place_id`가 빠져 있어서 DB INSERT 시 장소 연결 불가. |
| **영향 파일** | `src/app/log/page.tsx` (`handleSave` 함수) |
| **선행 조건** | 없음 (#1과 동시 구현) |
| **제안 해결책** | |

`log/page.tsx`에서 `selectedPlace` 파싱 시 `place_id` state를 추가하고, `logData` 객체에 포함:

```typescript
// useEffect 내
const place = JSON.parse(placeData)
setPlaceName(place.name)
setPlaceId(place.id)          // ← 추가

// handleSave 내
const logData = {
  place_id: placeId,           // ← 추가
  place_name: placeName,
  // ... 나머지 동일
}
```

- `selectedPlace`에 이미 `id` 필드가 존재하는지 확인 필요 (place 선택 흐름 추적)
- 없다면 `/place/page.tsx`에서 선택 시 `id`를 localStorage에 함께 저장하도록 수정

---

## Phase 3: WARNING 항목 (INSERT 매핑으로 해결)

> 아래 4건은 Phase 2 #1의 INSERT 매핑 함수에서 자연스럽게 처리된다.
> 별도 작업 항목이 아니며, #1 구현 시 매핑 테이블을 빠뜨리지 않으면 된다.

### #5 tribe_id (UI) vs log_type (DB)

| 항목 | 내용 |
|------|------|
| **심각도** | WARNING |
| **우선순위** | P1 (→ #1에 포함) |
| **난이도** | S |
| **문제 설명** | UI는 `tribe_id`로 저장, DB 컬럼명은 `log_type`. |
| **해결 방법** | INSERT 매핑: `{ log_type: logData.tribe_id }` |
| **조회 측 현황** | `logs-service.ts` `toLogWithPlace()`에서 이미 `row.log_type → tribe_id`로 역매핑 중. 정상. |

### #6 totono (UI) vs totono_score (DB)

| 항목 | 내용 |
|------|------|
| **심각도** | WARNING |
| **우선순위** | P1 (→ #1에 포함) |
| **난이도** | S |
| **문제 설명** | UI는 `totono`로 저장, DB 컬럼명은 `totono_score`. |
| **해결 방법** | INSERT 매핑: `{ totono_score: logData.totono }` |
| **조회 측 현황** | `toLogWithPlace()`에서 이미 `row.totono_score → totono`로 역매핑 중. 정상. |

### #7 has_scrub (UI) vs had_scrub (DB)

| 항목 | 내용 |
|------|------|
| **심각도** | WARNING |
| **우선순위** | P1 (→ #1에 포함) |
| **난이도** | S |
| **문제 설명** | Deep Log UI는 `has_scrub`으로 저장, DB 컬럼명은 `had_scrub`. |
| **해결 방법** | Deep Log INSERT 매핑: `{ had_scrub: deepData.has_scrub }` |
| **조회 측 현황** | `toLogWithPlace()`에서 이미 `dl.had_scrub → has_scrub`으로 역매핑 중. 정상. |

### #8 created_at (UI) vs logged_at (DB)

| 항목 | 내용 |
|------|------|
| **심각도** | WARNING |
| **우선순위** | P1 (→ #1에 포함) |
| **난이도** | S |
| **문제 설명** | UI는 `created_at`으로 타임스탬프 저장, DB는 `logged_at`을 기대 (DEFAULT NOW()이므로 필수는 아님). |
| **해결 방법** | INSERT 매핑: `{ logged_at: logData.created_at }` — 사용자가 입력한 시점 보존 |
| **참고** | `logged_at`을 명시하지 않으면 DB DEFAULT(NOW())가 적용되므로 INSERT 시점과 실제 기록 시점 차이 발생 가능. 명시적 매핑 권장. |

---

## Phase 4: INFO 항목 (미구현 UI / 미사용 DB 컬럼)

> 즉시 수정 불필요. 향후 기능 확장 시 참고.

### #9 DB 컬럼 존재, UI 미구현 (logs)

| 항목 | 내용 |
|------|------|
| **심각도** | INFO |
| **우선순위** | P2 (나중) |
| **난이도** | M |
| **DB 컬럼** | `refreshed_score` (목욕파 개운함 1-5), `rest_quality` (찜질파 가벼움 1-5) |
| **현재 상태** | `types/index.ts`의 `QuickLogData`에 `refreshedScore`, `restQuality` 필드 정의는 있으나 Quick Log UI에서 입력받지 않음 |
| **제안** | Quick Log UI에 슬라이더 추가하거나, 불필요하면 DB 컬럼 제거. 현재는 NULL로 저장되므로 문제 없음. |

### #10 DB 컬럼 존재, UI 미구현 (deep_logs)

| 항목 | 내용 |
|------|------|
| **심각도** | INFO |
| **우선순위** | P2 (나중) |
| **난이도** | L |
| **DB 컬럼** | `used_sauna_types` TEXT[], `used_rooms` TEXT[], `used_amenities` TEXT[], `scrub_price` INT, `food_eaten` TEXT[] |
| **현재 상태** | `types/index.ts`의 `DeepLogData`에 대응 필드(`facilityTags`, `roomTypes`, `amenities`, `scrubPrice`, `food`)가 정의되어 있으나 Deep Log UI에서 입력받지 않음 |
| **제안** | Deep Log v2 확장 시 UI 구현. 현재는 NULL/빈 배열로 저장되므로 문제 없음. |

---

## 실행 순서 요약

| 순서 | 항목 | 난이도 | 설명 |
|------|------|--------|------|
| 1 | #3 매점 필드 DB 추가 | S | ALTER TABLE 3줄 |
| 2 | #4 purpose TEXT → TEXT[] | M | ALTER + 타입 수정 + 조회 수정 |
| 3 | #2 place_id 추가 | S | `log/page.tsx` handleSave 수정 |
| 4 | #1 INSERT 로직 구현 | L | `logs-service.ts` + `complete/page.tsx` — #5~#8 매핑 포함 |
| 5 | #9, #10 | - | 백로그 등록, 향후 처리 |

**예상 총 작업량**: 스키마 변경(#3, #4) 1회 + 코드 변경 3~4개 파일

---

## 체크리스트 (구현 완료 검증용)

- [ ] `deep_logs`에 `has_store`, `store_score`, `store_memo` 컬럼 존재 확인
- [ ] `deep_logs.purpose` → `purposes TEXT[]`로 변경 확인
- [ ] `log/page.tsx` handleSave에서 `place_id` 포함 확인
- [ ] `logs-service.ts`에 `insertLog()` 함수 존재 확인
- [ ] `logs-service.ts`에 `insertDeepLog()` 함수 존재 확인
- [ ] `complete/page.tsx`에서 Supabase INSERT 호출 확인
- [ ] INSERT 매핑에서 `tribe_id→log_type`, `totono→totono_score`, `has_scrub→had_scrub`, `created_at→logged_at` 변환 확인
- [ ] 비로그인 사용자 localStorage 폴백 동작 확인
- [ ] INSERT 실패 시 데이터 유실 없음 확인 (localStorage 폴백)
- [ ] 기존 `toLogWithPlace()` 조회 함수와 양방향 매핑 일관성 확인
