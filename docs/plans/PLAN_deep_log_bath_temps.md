# 딥로그 탕 온도 섹션 추가 플랜

## 개요
모든 트라이브가 딥로그에서 탕 온도(온탕/열탕/냉탕)를 기록할 수 있도록 통합 섹션 추가.
퀵로그에서 이미 입력한 필드는 딥로그에서 숨김.

## 현재 상태

| 필드 | 퀵로그 입력 | 딥로그 입력 | DB |
|------|-----------|-----------|-----|
| 온탕 | 목욕파만 | 사우너만 (온탕 토글) | logs.hot_bath_temp |
| 열탕 | — | 사우너+목욕파 (열탕 토글) | deep_logs.very_hot_bath_temp |
| 냉탕 | 목욕파+사우너 | — | logs.cold_bath_temp |

## 변경 후

| 필드 | 퀵로그 (기존 유지) | 딥로그 (신규 섹션) | DB |
|------|-----------------|-----------------|-----|
| 온탕 | 목욕파만 | 목욕파 외 전원 | logs.hot_bath_temp |
| 열탕 | — | 전원 (기존 토글 → 이 섹션으로 이동) | deep_logs.very_hot_bath_temp |
| 냉탕 | 목욕파+사우너 | 찜질파만 (목욕파+사우너는 숨김) | logs.cold_bath_temp |

## UI 설계

딥로그 페이지에 새 섹션: **"탕 온도"**
- 위치: 청결도 아래, 혼잡도 위 (또는 기존 토글 섹션에 통합)
- 토글: "입력하기" → "입력 중"
- ON 시 슬라이더 최대 3개 (옵셔널, 퀵로그 미입력 필드만 표시):

```
┌─────────────────────────────┐
│ 탕 온도          [입력하기 ▷] │
└─────────────────────────────┘

토글 ON ↓

┌─────────────────────────────┐
│ 탕 온도           [입력 중 ●] │
│                             │
│ 온탕  ──●──────────── 40°C  │  ← 목욕파면 숨김 (퀵로그에서 입력)
│ 열탕  ────────●──── 43°C    │
│ 냉탕  ──●──────────── 18°C  │  ← 목욕파/사우너면 숨김 (퀵로그에서 입력)
└─────────────────────────────┘
```

## 표시 로직 (퀵로그 충돌 방지)

```typescript
const tribeId = currentLog.tribe_id
const quickHasCold = tribeId === 'saunner' || tribeId === 'bather'
const quickHasHot = tribeId === 'bather'

// 딥로그에서 보여줄 슬라이더
const showHotBath = !quickHasHot       // 목욕파 외 전원
const showVeryHotBath = true            // 전원 (기존 열탕 토글 대체)
const showColdBath = !quickHasCold      // 찜질파만

// 슬라이더가 1개도 없으면 섹션 자체 숨김 (불가능 — 열탕은 항상 있음)
```

## 기존 열탕 토글 처리

현재 딥로그에 `has_very_hot_bath` + `very_hot_bath_temp` 토글이 별도로 있음.
→ **이 섹션으로 통합**. 기존 열탕 토글 제거, "탕 온도" 섹션 내 열탕 슬라이더로 대체.

기존 습식사우나 토글(`has_wet_sauna`)은 그대로 유지 (탕이 아니라 사우나).

## DB 변경

없음. 기존 컬럼 재활용:
- `logs.hot_bath_temp` (30-46) — 온탕
- `logs.cold_bath_temp` (0-30) — 냉탕
- `deep_logs.very_hot_bath_temp` (38-46) — 열탕

## 저장 로직

```typescript
// 딥로그 저장 시
if (hasBathTemps) {
  // 온탕 → logs 테이블에 저장 (퀵로그 미입력 시만)
  if (showHotBath && hotBathTemp) {
    await updateLog(logId, { hot_bath_temp: hotBathTemp })
  }
  // 냉탕 → logs 테이블에 저장 (퀵로그 미입력 시만)
  if (showColdBath && coldBathTemp) {
    await updateLog(logId, { cold_bath_temp: coldBathTemp })
  }
  // 열탕 → deep_logs (기존과 동일)
  deepLogData.very_hot_bath_temp = veryHotBathTemp
  deepLogData.has_very_hot_bath = !!veryHotBathTemp
}
```

## 상수 추가

`src/constants/content.ts` — DEEP_LOG에 추가:

```typescript
BATH_TEMPS: {
  label: '탕 온도',
  labelEn: 'BATH TEMPS',
  toggleLabel: '입력하기',
  toggleLabelActive: '입력 중',
  HOT_BATH: { label: '온탕', min: 35, max: 42, unit: '°C', steps: [...] },
  VERY_HOT_BATH: { label: '열탕', min: 38, max: 46, unit: '°C', steps: [...] }, // 기존 HOT_BATH 이동
  COLD_BATH: { label: '냉탕', min: 5, max: 30, unit: '°C', steps: [...] },
}
```

## 변경 파일 (5개)

| 파일 | 변경 |
|------|------|
| `src/constants/content.ts` | DEEP_LOG.BATH_TEMPS 섹션 추가, 기존 HOT_BATH → BATH_TEMPS.VERY_HOT_BATH로 이동 |
| `src/app/log/deep/page.tsx` | 탕 온도 토글+슬라이더 UI 추가, 기존 열탕 토글 제거, tribe 기반 표시 로직 |
| `src/lib/logs-service.ts` | 딥로그 저장 시 logs.hot_bath_temp/cold_bath_temp UPDATE 로직 추가 |
| `src/app/history/[id]/page.tsx` | 딥로그 카드에 탕 온도 표시 |
| `src/app/explore/[id]/page.tsx` | 사-피 리포트 집계에 반영 (이미 placeLogs 기반이라 자동) |

## autoTag 변경

```
기존: 온탕 토글 ON → 'hot-bath' 태그
변경: 탕 온도 섹션에서 온탕 입력 → 'hot-bath', 열탕 → 'very-hot-bath', 냉탕 → 'cold-bath'
```

## 편집 모드 복원

딥로그 편집 시:
- `very_hot_bath_temp` 있으면 → 열탕 슬라이더 복원 (기존과 동일)
- `hot_bath_temp` 있고 `showHotBath` true → 온탕 슬라이더 복원
- `cold_bath_temp` 있고 `showColdBath` true → 냉탕 슬라이더 복원
- 셋 중 하나라도 있으면 토글 ON 상태로 복원
