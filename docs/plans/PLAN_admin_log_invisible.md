# 어드민 로그 완전 비가시화 플랜

## 원칙
어드민(시드 데이터) 로그는 **통계 숫자로만** 장소 상세의 사-피 리포트에 기여.
그 외 모든 곳에서 invisible.

## 현재 상태 + 필요 변경

| 위치 | 현재 | 필요 변경 |
|------|------|----------|
| 홈 커뮤니티 피드 | ❌ 어드민 노출 | 어드민 제외 |
| 장소 카드 평점/건수 | ❌ 어드민 포함 | 어드민 제외 |
| 장소 상세 로그 카드 | ✅ 이미 제외 | — |
| 장소 상세 트라이브 통계 | ✅ 이미 제외 | — |
| 장소 상세 온도/비용/청결도 집계 | ✅ 어드민 포함 (의도적) | 유지 |

## ADMIN_ID
`23c431c3-9b23-4779-bb27-13472e58090a`

---

## 변경 1: 홈 커뮤니티 피드

### 파일: `src/lib/logs-service.ts`
### 위치: `:89` `getCommunityFeed()`

현재:
```typescript
if (user) {
  query = query.neq('user_id', user.id)
}
```

변경:
```typescript
const ADMIN_ID = '23c431c3-9b23-4779-bb27-13472e58090a'
query = query.neq('user_id', ADMIN_ID)
if (user) {
  query = query.neq('user_id', user.id)
}
```

---

## 변경 2: 장소 카드 평점/건수

### 문제
`get_place_stats` RPC가 DB에서 전체 logs를 집계 → 어드민 revisit_score(3) + 건수 포함.

### 옵션 A: RPC 수정 (DB)
```sql
CREATE OR REPLACE FUNCTION get_place_stats(p_place_id UUID)
RETURNS TABLE(avg_score NUMERIC, log_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    ROUND(AVG(revisit_score)::NUMERIC, 1) AS avg_score,
    COUNT(*) AS log_count
  FROM logs
  WHERE place_id = p_place_id
    AND revisit_score IS NOT NULL
    AND user_id != '23c431c3-9b23-4779-bb27-13472e58090a';
$$;
```

### 옵션 B: 클라이언트 필터
place-card에서 stats 대신 placeLogs에서 직접 계산 — 비효율적, RPC 수정이 나음.

### 추천: 옵션 A

---

## 변경 3: ADMIN_ID 상수화

여러 파일에서 ADMIN_ID를 하드코딩 중. 상수로 분리.

### 파일: `src/constants/content.ts` 또는 `src/lib/constants.ts`
```typescript
export const ADMIN_USER_ID = '23c431c3-9b23-4779-bb27-13472e58090a'
```

### 참조 파일 업데이트
- `src/app/explore/[id]/page.tsx:85` — 현재 하드코딩
- `src/lib/logs-service.ts` — getCommunityFeed에 추가
- DB RPC — SQL에서 직접 사용 (상수화 불가, 하드코딩 유지)

---

## 변경 파일 요약 (3개 + DB 1개)

| 파일 | 변경 |
|------|------|
| `src/lib/logs-service.ts:89-104` | getCommunityFeed에 ADMIN_ID 제외 추가 |
| `src/app/explore/[id]/page.tsx:85` | ADMIN_ID → 상수 import로 변경 |
| `src/constants/content.ts` (또는 별도 파일) | ADMIN_USER_ID 상수 추가 |
| **DB**: `get_place_stats` RPC | WHERE에 `AND user_id != 'ADMIN_ID'` 추가 |

---

## 변경 4: 사-피 리포트 온도 집계 로직 수정

### 문제
현재 `calcAvg`가 tribe 필터로 온도를 집계:
```typescript
calcAvg('hot_bath_temp', 'bather')   // 목욕파 로그에서만 온탕
calcAvg('sauna_temp', 'saunner')     // 사우너 로그에서만 건식
calcAvg('jjim_temp', 'jimi')         // 찜질파 로그에서만 한증막
```

어드민 로그의 tribe_id가 시설과 안 맞으면 온도가 있어도 집계에서 빠짐.
온도는 시설의 물리적 특성이라 tribe 무관하게 집계해야 함.

### 파일: `src/app/explore/[id]/page.tsx`
### 위치: `:102-113`

변경 전:
```typescript
const tempMetrics = [
  { label: '온탕', value: calcAvg('hot_bath_temp', 'bather') },
  { label: '사우나', value: calcAvg('sauna_temp', 'saunner') },
  { label: '냉탕', value: calcAvg('cold_bath_temp') },
  { label: '한증막', value: calcAvg('jjim_temp', 'jimi') },
].filter(m => m.value !== null)
```

변경 후:
```typescript
const tempMetrics = [
  { label: '온탕', value: calcAvg('hot_bath_temp') },
  { label: '사우나', value: calcAvg('sauna_temp') },
  { label: '냉탕', value: calcAvg('cold_bath_temp') },
  { label: '한증막', value: calcAvg('jjim_temp') },
].filter(m => m.value !== null)
```

tribe 필터 제거 → 전체 placeLogs(어드민 포함)에서 값 있는 것만 평균.
이렇게 하면 어드민 시드 온도도 자연스럽게 사-피 리포트에 반영.

### tribeSubMetrics도 동일 수정

`:119-139` — 트라이브별 서브 메트릭도 tribe 필터 대신 전체 집계로 변경.
단, revisit_score와 totono_score 같은 **주관적 점수**는 userLogs(어드민 제외)에서 집계.
**온도/수질** 같은 **객관적 수치**는 placeLogs(어드민 포함)에서 집계.

```typescript
// 객관적 수치: placeLogs 전체 (어드민 포함)
const calcTempAvg = (field: keyof typeof placeLogs[0]) => {
  const vals = placeLogs.filter(l => l[field] != null).map(l => l[field] as number)
  return vals.length > 0 ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : null
}

// 주관적 점수: userLogs (어드민 제외)
const calcScoreAvg = (field: keyof typeof userLogs[0], filterTribe?: string) => {
  const logs = filterTribe ? userLogs.filter(l => l.tribe_id === filterTribe) : userLogs
  const vals = logs.filter(l => l[field] != null).map(l => l[field] as number)
  return vals.length > 0 ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : null
}
```

적용:
- `tempMetrics`: `calcTempAvg` 사용 (tribe 필터 없이)
- `tribeSubMetrics.saunner.토토노우/재방문`: `calcScoreAvg` 사용
- `tribeSubMetrics.bather.수질/재방문`: `calcScoreAvg` 사용
- `tribeSubMetrics 내 습식/열탕`: `calcDeepAvg` 유지 (이미 placeLogs 전체)

---

## 변경 파일 최종 요약 (4개 + DB 1개)

| # | 파일 | 변경 |
|---|------|------|
| 1 | `src/constants/content.ts` | `ADMIN_USER_ID` 상수 추가 |
| 2 | `src/lib/logs-service.ts:89-104` | `getCommunityFeed`에 ADMIN_ID 제외 |
| 3 | `src/app/explore/[id]/page.tsx:85,102-139` | ADMIN_ID 상수 import + 온도 집계 tribe 필터 제거 + 점수/온도 분리 |
| 4 | **DB**: `get_place_stats` RPC | `AND user_id != 'ADMIN_ID'` 추가 |

## DB 스크립트 (Supabase에서 실행)

```sql
CREATE OR REPLACE FUNCTION get_place_stats(p_place_id UUID)
RETURNS TABLE(avg_score NUMERIC, log_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    ROUND(AVG(revisit_score)::NUMERIC, 1) AS avg_score,
    COUNT(*) AS log_count
  FROM logs
  WHERE place_id = p_place_id
    AND revisit_score IS NOT NULL
    AND user_id != '23c431c3-9b23-4779-bb27-13472e58090a';
$$;
```

## 확인 포인트

1. **어드민 본인 로그인** — 히스토리에서 자기 기록 보임 (기존 유지). 다른 유저에게만 안 보임.
2. **장소 카드 평점/건수** — RPC에서 어드민 제외 → 실제 유저 평점만.
3. **사-피 리포트 온도** — tribe 필터 제거 → 어드민 시드 온도 반영됨.
4. **사-피 리포트 점수** — userLogs(어드민 제외)에서 집계 → 어드민 revisit_score=3 미반영.
5. **향후 어드민 추가 시** — ADMIN_USER_ID를 배열로 확장 가능.

## 실행 순서

1. DB: `get_place_stats` RPC 업데이트 (Supabase Dashboard)
2. 코드: ADMIN_USER_ID 상수 추가
3. 코드: getCommunityFeed 수정
4. 코드: explore/[id] 온도 집계 로직 수정
5. 테스트: 다른 계정 → 홈 피드 어드민 안 보임 + 장소 카드 평점 어드민 제외 + 사-피 리포트 온도 표시됨
