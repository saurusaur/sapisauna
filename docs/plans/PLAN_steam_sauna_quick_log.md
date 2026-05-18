# PLAN — 사우너 Quick Log 습식 사우나(Steam Sauna) 추가 + wet→steam 전면 리네임

작성일: 2026-05-18
브랜치 기준: `preview`

---

## 1. 목표

사우너 tribe의 quick log에 **습식 사우나(steam sauna)** 입력을 추가하고, 기존 `deep_logs.wet_sauna_temp`를 `logs.steam_sauna_temp`로 이전한다. 사용자가 둘 다 입력했을 때 **주 이용 사우나**를 명시적으로 선택할 수 있도록 `primary_sauna_kind` 컬럼을 신설하고, 모든 표시 영역(스토리카드/히스토리 detail/Stats 인사이트)이 primary 기반으로 메인 메트릭을 결정하도록 한다. 이 작업과 함께 코드/DB/시드 전반의 `wet*` 명칭을 `steam*`으로 통일한다.

---

## 2. 확정 결정사항

| # | 결정 |
|---|---|
| ① | Quick log UX = **인라인 미니 토글(건식/습식) + 단일 슬라이더 + 인라인 ✓ 체크마크 + × 클리어**. 토글 사이즈 고정. 앱 디자인 톤(stone palette + orange accent)으로 구현 |
| ② | 입력만 있으면 저장 가능(최소 하나). 디폴트 화면은 **blank** — 사용자가 슬라이더 첫 터치 시 그쪽이 자동 primary |
| ③ | **사우너 tribe만 변경**. bather/jimi quick log는 그대로 |
| ④ | DB: `logs.steam_sauna_temp` 신규 컬럼. `deep_logs.steam_sauna_temp` 데이터 백필 후 DROP |
| ⑤ | 컬럼명 = **`steam_sauna_temp`** (wet→steam 리네임). 같은 마이그레이션에서 처리 |
| ⑥ | Deep log 사우나 섹션: quick에 둘 다 있으면 **숨김**. 한쪽만 있으면 [+ 반대편 추가] 옵션. 수정은 quick log 편집 |
| ⑦ | **ΔT 정책 = `primary_sauna_kind` 기반**. primary가 'dry'면 dry ΔT, 'steam'이면 steam ΔT. 보조 표시 없음 (둘 다 있어도 primary 쪽만) |
| ⑧ | 습식 표기 = **라벨 prefix** ("STEAM TEMP DELTA" / "습식 온도차"). Story/History detail/Stats 모두 동일 |
| ⑨ | Graph glow color = **하나의 공식 유지**. 습식은 자연스럽게 차분한 색상 |
| ⑩ | Helper 함수 신설: `getPrimarySaunaTemp(log) → { value, kind: 'dry'\|'steam', label, deltaValue } \| null` |
| ⑪ | `places.facilities` 배열 + seed JSON의 `'wet-sauna'` → `'steam-sauna'` **전면 백필** |
| ⑫ | **신규 컬럼 `logs.primary_sauna_kind TEXT CHECK (IN ('dry','steam'))`** (NULL 허용, 사우나 미입력 행은 NULL) |
| ⑬ | Stats 인사이트 카드 "평균 온도차" = **라벨 옆 인라인 미니 토글** (디폴트는 해당 기간 로그들의 primary 분포 — primary='steam'이 많으면 steam 평균 디폴트, 아니면 dry) |

---

## 3. 메커니즘 도식

### Quick Log (사우너)
```
┌─ 사우너 Quick Log ─────────────────────────────────┐
│  사우나  [✓건식 ×] [✓습식 ×]  · 주 이용 사우나를     │
│                                선택해주세요  ← 둘 다 │
│                                입력 시에만 노출       │
│  ────────────●─────────                             │
│  냉탕                                  15°C         │
│  ──●──────────                                       │
│  토토노이                              ★★★★☆        │
│  [ 저장 ]                                            │
└──────────────────────────────────────────────────────┘
```

### Primary 결정 룰
| 상태 | UI | primary_sauna_kind | 메시지 | 저장 |
|---|---|---|---|---|
| 둘 다 비어있음 (초기) | ✓ 둘 다 숨김, 슬라이더 비활성 | `null` | 안 뜸 | ❌ |
| 한쪽만 입력 | 그쪽 주황 ✓, 다른 쪽 회색 ✓ disabled | 그쪽 자동 | 안 뜸 | ✅ |
| 두 번째 입력 추가 | 첫 입력 주황 ✓ 유지, 두 번째 회색 ✓ | 첫 입력 유지 (자동) | **뜸** "주 이용 사우나를 선택해주세요" | ✅ |
| ✓ 클릭으로 전환 | 클릭한 쪽 주황 ✓, 다른 쪽 회색 ✓ | 클릭한 값 | 계속 뜸 (둘 다 있는 동안) | ✅ |
| 한쪽 × 클리어 | 남은 쪽 자동 주황 ✓ | 남은 쪽 | 안 뜸 | ✅ |

### Deep Log 사우나 섹션 노출 룰
```
quick log 상태                | deep log 사우나 섹션
─────────────────────────────|─────────────────────────────
사우너 - 건식만               | [+ 습식 추가] 옵션 노출
사우너 - 습식만               | [+ 건식 추가] 옵션 노출
사우너 - 둘 다                | 섹션 숨김 (수정은 quick log)
bather/jimi - 사우나 안 함     | 기존대로 [+ 사우나 추가] 토글
```

### ΔT 표시 룰 (Story/History/Stats 공통)
```python
def getPrimarySaunaTemp(log):
    if log.primary_sauna_kind == 'dry' and log.sauna_temp is not None:
        return { 
            value: log.sauna_temp, 
            kind: 'dry',
            label: 'TEMP DELTA' / '온도차',
            deltaValue: log.sauna_temp - log.cold_bath_temp
        }
    elif log.primary_sauna_kind == 'steam' and log.steam_sauna_temp is not None:
        return { 
            value: log.steam_sauna_temp, 
            kind: 'steam',
            label: 'STEAM TEMP DELTA' / '습식 온도차',
            deltaValue: log.steam_sauna_temp - log.cold_bath_temp
        }
    return None  # 사우나 미입력
```

### Stats 인사이트 카드 토글
```
┌─ Sauner 인사이트 카드 ─────────────────────────┐
│  ⭕ (링)         평균 온도차 [건식|습식]  ← 토글  │
│                  42°C                            │
│                  토토노이 점수                    │
│                  4.2/5                           │
└──────────────────────────────────────────────────┘
• 토글 디폴트: 해당 기간 로그들의 primary_sauna_kind 다수결
• 데이터 없는 쪽 토글 disabled (회색)
• 토글 전환 시 값만 변경, 라벨 ("평균 온도차") 유지
```

---

## 4. 영향 파일 매트릭스

### 신규 (2개)
| 파일 | 목적 |
|---|---|
| `supabase/migrations/022_steam_sauna_rename_and_move.sql` | 통합 마이그레이션 |
| `src/lib/sauna-temp-helpers.ts` | `getPrimarySaunaTemp()` 헬퍼 |

### DB / Migration
| 파일 | 변경 |
|---|---|
| `supabase/migrations/022_*.sql` (신규) | RENAME COLUMN(wet→steam) + ADD logs.steam_sauna_temp + ADD logs.primary_sauna_kind + UPDATE 백필 + ALTER DROP + places.facilities array_replace |

### Types
| 파일 | 변경 |
|---|---|
| `src/types/index.ts:179-180` | `has_wet_sauna`/`wet_sauna_temp` 제거 (deep_log subnode) |
| `src/types/index.ts (LogWithPlace)` | `steam_sauna_temp?: number`, `primary_sauna_kind?: 'dry' \| 'steam'` 추가 |
| `src/types/index.ts:75-98` (`QuickLogData`) | `steamSaunaTemp?: number`, `primarySaunaKind?: 'dry'\|'steam'` 추가 |

### Service Layer
| 파일 | 변경 |
|---|---|
| `src/lib/logs-service.ts:69-70` | deep_log 변환에서 wet_sauna_temp 관련 제거 |
| `src/lib/logs-service.ts:195-225 (insertLog)` | `steam_sauna_temp`, `primary_sauna_kind` 컬럼 추가 |
| `src/lib/logs-service.ts:242-274 (updateLog)` | 동일 |
| `src/lib/logs-service.ts:277-379 (saveOrUpdateDeepLog)` | wet 관련 코드 제거 |
| `src/lib/logs-service.ts:341` | `'wet-sauna'` → `'steam-sauna'`. autoTags에 `steam_sauna_temp != null`도 푸시 |

### UI / Pages
| 파일 | 변경 |
|---|---|
| `src/app/log/page.tsx` (사우너 폼) | 미니 토글 + 인라인 ✓ + × + primary 메시지 + steam_sauna_temp state |
| `src/app/log/deep/page.tsx` | wet→steam 리네임, quick에 둘 다 있으면 사우나 섹션 숨김 |
| `src/app/history/[id]/page.tsx` | `getPrimarySaunaTemp` 사용, 라벨 분기 |
| `src/app/story/page.tsx` | 동일 |
| `src/lib/image-export.ts` | CardRenderParams에 steamSaunaTemp + primarySaunaKind 추가 |
| `src/components/svg/saunner-graph.tsx` | input props를 primarySaunaTemp 단일로 |
| `src/lib/story-overlay/graphs.ts` | 동일 |
| `src/lib/history-stats.ts (computeSaunnerInsight)` | avgDryTempDiff + avgSteamTempDiff 둘 다 반환. 디폴트 결정용 primary 분포도 반환 |
| `src/components/features/history-dashboard/insight-card.tsx` | "평균 온도차" 옆 인라인 미니 토글 + 디폴트 분기 |
| `src/app/explore/[id]/page.tsx` | `wet_sauna_temp` → `steam_sauna_temp` (단, 이제 logs 컬럼) |
| `src/lib/utils.ts:305-325 (DETAIL_FIELDS)` | saunner에 `steam_sauna_temp` 추가 (조건부) |

### Constants
| 파일 | 변경 |
|---|---|
| `src/constants/content.ts:412-413` | `id: "wet-sauna"` → `"steam-sauna"` |
| `src/constants/content.ts:657-668` | `WET:` → `STEAM:` |
| `src/constants/content.ts:921` | `"wet-sauna"` → `"steam-sauna"` |
| `src/constants/content.ts` (QUICK_LOG.SAUNER) | 사우나 토글 라벨/메시지 키 추가 (`STEAM_SAUNA` block) |

### Scripts / Seeds
| 파일 | 변경 |
|---|---|
| `scripts/seed-data-unified.json` | 63 항목 `"wet-sauna"` → `"steam-sauna"` 일괄 치환 |
| `scripts/bulk-register-places.ts` | `wet_sauna_temp` → `steam_sauna_temp` |
| `scripts/enrich-places-from-katalk.ts` | 동일 (단 카톡 헤더 `'습식온도'`는 그대로) |

### Korean text (변경 NOT 필요)
- `습식`, `건식`, `사우너`, `사우나` 등 한국어 라벨은 그대로 유지

---

## 5. 마이그레이션 SQL 초안

```sql
-- supabase/migrations/022_steam_sauna_rename_and_move.sql
-- 1) wet → steam 리네임  2) deep_logs → logs 이동  3) primary_sauna_kind 추가  4) facility 태그 백필

BEGIN;

-- (1) deep_logs 컬럼 RENAME (wet → steam)
ALTER TABLE deep_logs RENAME COLUMN wet_sauna_temp TO steam_sauna_temp;
ALTER TABLE deep_logs RENAME COLUMN has_wet_sauna TO has_steam_sauna;
ALTER TABLE deep_logs RENAME CONSTRAINT deep_logs_wet_sauna_temp_check
  TO deep_logs_steam_sauna_temp_check;

-- (2) logs 테이블 신규 컬럼
ALTER TABLE logs
  ADD COLUMN steam_sauna_temp INT
  CHECK (steam_sauna_temp BETWEEN 40 AND 75);

ALTER TABLE logs
  ADD COLUMN primary_sauna_kind TEXT
  CHECK (primary_sauna_kind IN ('dry', 'steam'));

-- (3) 기존 deep_logs 데이터를 logs로 백필
UPDATE logs l
  SET steam_sauna_temp = d.steam_sauna_temp
  FROM deep_logs d
  WHERE l.id = d.log_id
    AND d.has_steam_sauna = TRUE
    AND d.steam_sauna_temp IS NOT NULL;

-- (4) primary_sauna_kind 기존 데이터 백필 (dry만 있으면 dry, steam만 있으면 steam, 둘 다 있으면 dry 우선)
UPDATE logs
  SET primary_sauna_kind = CASE
    WHEN sauna_temp IS NOT NULL THEN 'dry'
    WHEN steam_sauna_temp IS NOT NULL THEN 'steam'
    ELSE NULL
  END
  WHERE sauna_temp IS NOT NULL OR steam_sauna_temp IS NOT NULL;

-- (5) deep_logs에서 steam 컬럼 제거 (logs로 단일화)
ALTER TABLE deep_logs DROP COLUMN steam_sauna_temp;
ALTER TABLE deep_logs DROP COLUMN has_steam_sauna;

-- (6) places.facilities 배열 백필 ('wet-sauna' → 'steam-sauna')
UPDATE places
  SET facilities = array_replace(facilities, 'wet-sauna', 'steam-sauna')
  WHERE 'wet-sauna' = ANY(facilities);

COMMIT;
```

**주의:** 단일 트랜잭션. 실패 시 전체 롤백. 마이그레이션 실행 전 Supabase 스냅샷 권장.

---

## 6. UX 디테일 (앱 디자인 체계 적용)

mock HTML은 mechanical 비교용. 실제 구현은 **기존 사우나 로그 톤**:
- 색상 base: stone palette (stone-100~stone-700)
- accent: orange-600 (#ea580c) — 체크마크 active, 메시지 텍스트 모두 동일 색상으로 시각 연결
- 폰트: `Pretendard`, 시스템 폰트 스택
- 슬라이더: 기존 `src/app/log/page.tsx` saunaTemp 슬라이더 컴포넌트 재사용
- 미니 토글: 기존 사이트의 다른 토글 컴포넌트 참조 (없으면 stone-200/stone-700 톤으로 신규)
- ✓ 체크마크: orange-600 (primary) / stone-400 (보조). hover 시 살짝 강조 (orange-700 또는 stone-600)
- ×: stone-300 → stone-400 (hover red-500)
- 메시지 "주 이용 사우나를 선택해주세요": orange-600 텍스트, plain (배경 없음), 토글에 ~6px 거리

---

## 7. 작업 단계 (실행 순서)

1. ✅ **PLAN 문서 업데이트** (이 문서)
2. **마이그레이션 SQL 작성 → 로컬 supabase 적용 → 검증**
3. **Types 업데이트** (`src/types/index.ts`)
4. **Helper 함수 신설** (`src/lib/sauna-temp-helpers.ts`)
5. **Service layer 업데이트** (`src/lib/logs-service.ts`)
6. **Constants 업데이트** (`src/constants/content.ts`)
7. **Deep log page 정리** (steam 관련 로직 제거 + 표시 룰)
8. **Quick log saunner 폼에 미니 토글 추가**
9. **History/Detail/Story/Stats/Graphs 페이지 헬퍼 사용으로 교체**
10. **Explore 페이지 컬럼 참조 변경**
11. **Utils.ts DETAIL_FIELDS 보완**
12. **Seed JSON 일괄 치환 + Scripts 업데이트**
13. **검증: type-check, lint, dev 서버, 입력 시나리오 13건**

---

## 8. 검증 시나리오 (브라우저)

- [ ] 사우너 quick log 첫 진입: blank, 슬라이더 회색, 저장 비활성
- [ ] 건식만 입력: 자동 주황 ✓ 건식, 저장 활성, 메시지 없음
- [ ] 습식만 입력: 자동 주황 ✓ 습식, 저장 활성, 메시지 없음
- [ ] 둘 다 입력: 첫 입력 주황 유지, 둘째 회색, **메시지 표시**, 저장 활성
- [ ] 회색 ✓ 클릭 → primary 전환, 색상 swap, 메시지 유지
- [ ] × 클릭으로 한쪽 클리어 → 메시지 사라짐, 남은 쪽 자동 주황
- [ ] DB 검증: `primary_sauna_kind` 컬럼이 정확하게 저장됨
- [ ] Deep log: quick에 건식만 → 습식 추가 옵션 노출
- [ ] Deep log: quick에 습식만 → 건식 추가 옵션 노출
- [ ] Deep log: quick에 둘 다 → 사우나 섹션 숨김
- [ ] Story card: primary='dry' → 'TEMP DELTA' 메인
- [ ] Story card: primary='steam' → 'STEAM TEMP DELTA' / '습식 온도차'
- [ ] History dashboard insight: 토글로 dry/steam 평균 ΔT 전환 가능
- [ ] Stats 토글: 데이터 없는 쪽 disabled
- [ ] Explore place detail: steam_sauna_temp 평균값 표시
- [ ] places.facilities에 'steam-sauna' 태그 자동 push 동작

---

## 9. 리스크 & 미해결 사항

| 항목 | 비고 |
|---|---|
| 빈 deep_logs 행 정리 | steam만 있던 deep_log 행이 다른 필드 없으면 빈 행 됨 → 마이그레이션 후 별도 검사 (선택) |
| seed JSON 63건 일괄 치환 | sed/jq로 안전 치환 + JSON 유효성 검증 필요 |
| 프로덕션 데이터 백업 | 마이그레이션 실행 전 Supabase 스냅샷 권장 |
| 미니 토글 디자인 컴포넌트 | 기존 앱에 유사 패턴 있는지 구현 시 추가 조사 |
| Graph glow color 습식 케이스 | 같은 공식 유지 — 시각적으로 "약한 세션"으로 보일 수 있음 (양해) |
| primary_sauna_kind 디폴트 | DB NOT NULL은 아님. 사우나 미입력 행은 NULL. CHECK는 값 있을 때만 'dry'/'steam' 강제 |

---

## 10. 변경 영향 통계

- DB 컬럼: deep_logs 2개 RENAME 후 DROP, logs 2개 ADD (steam_sauna_temp, primary_sauna_kind)
- 코드 파일: 13개 (TypeScript/TSX)
- 상수 블록: 4개
- 시드: 63 entries
- DB row 백필: places.facilities, logs.primary_sauna_kind (실 카운트는 마이그레이션 시 확인)
