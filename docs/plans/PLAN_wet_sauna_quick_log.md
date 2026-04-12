# 사우너 숏로그 건식/습식 사우나 토글 (B안: deep_logs 활용)

## Context
사우너 중 습식 사우나 유저가 숏로그에서 습식 온도를 입력하고 싶음. 딥로그에 이미 `deep_logs.wet_sauna_temp` (40-75°C) + `has_wet_sauna` 구조가 있으므로, 이 기존 DB 구조를 그대로 활용.

## 핵심 설계

숏로그에서 습식 선택 시:
1. `logs.sauna_temp`에는 null 저장 (건식 미입력)
2. 자동으로 `deep_logs` 레코드 생성하여 `wet_sauna_temp` + `has_wet_sauna=true` 저장
3. 스토리/카드 표시 시 `sauna_temp`이 null이면 `deep_log.wet_sauna_temp`를 fallback으로 사용

**장점**: DB 스키마 변경 없음 (마이그레이션 불필요), 기존 deep_logs 구조 재사용
**트레이드오프**: 숏로그 저장 로직에서 deep_logs insert 추가 필요

## 변경 파일

### 1. 상수 — `src/constants/content.ts`
- `QUICK_LOG.SAUNER`에 습식 설정 추가 (DEEP_LOG.SAUNA_TEMPS.WET 재사용)
```ts
WET_SAUNA_TEMP: {
  label: "습식 사우나 온도", min: 40, max: 75, unit: "°C",
  steps: [기존 DEEP_LOG.SAUNA_TEMPS.WET.steps]
}
```

### 2. 숏로그 UI — `src/app/log/page.tsx` ★ 핵심
- `saunaType` state: `'dry' | 'wet'` (기본 `'dry'`)
- 건식/습식 칩 토글 (슬라이더 위에 배치)
- 토글 전환 시 `saunaTemp` 리셋 (건식 85, 습식 53)
- `buildLogData()` 변경:
  - 건식: 현행과 동일 (`sauna_temp: saunaTemp`)
  - 습식: `sauna_temp: null` + `_wetSaunaTemp: saunaTemp` (임시 키로 전달)
- 편집 복원: `deep_log.has_wet_sauna`이면 `saunaType='wet'` + 온도 복원

### 3. 서비스 — `src/lib/logs-service.ts`
- `insertLog()` 수정: `_wetSaunaTemp` 감지 시 로그 insert 후 deep_logs에도 자동 insert
```ts
if (logData._wetSaunaTemp != null) {
  await supabase.from('deep_logs').insert({
    log_id: newLogId,
    has_wet_sauna: true,
    wet_sauna_temp: logData._wetSaunaTemp,
  })
}
```
- `updateLog()` 수정: 동일 패턴 (기존 deep_log 있으면 update, 없으면 insert)

### 4. 스토리 카드 — `src/app/story/page.tsx`
- TEMP DELTA 계산: `sauna_temp` null일 때 `deep_log.wet_sauna_temp` fallback
```ts
const saunaT = log.sauna_temp || log.deep_log?.wet_sauna_temp || 80
const deltaT = saunaT - (log.cold_bath_temp || 15)
```
- 메트릭 라벨: wet이면 "WET DELTA"

### 5. 이미지 내보내기 — `src/lib/image-export.ts`
- `CardRenderParams`에 `wetSaunaTemp` 추가
- TEMP DELTA 동일 fallback 로직

### 6. 기록 상세 — `src/app/history/[id]/page.tsx`
- 사우너 온도 표시: `sauna_temp` null + `deep_log.wet_sauna_temp` 있으면 "WET SAUNA" 라벨로 습식 온도 표시
- TEMP DELTA 계산 동일 fallback

### 7. SaunnerGraph — `src/components/svg/saunner-graph.tsx`
- `saunaTemp` prop에 습식 온도가 들어올 수 있으므로 변경 불필요 (숫자만 받음)

### 8. 딥로그 — `src/app/log/deep/page.tsx`
- 숏로그에서 습식 입력 시: 딥로그 진입하면 습식 이미 채워져 있어야 함
- `currentLog`의 `_wetSaunaTemp` 감지 → `wetSaunaTemp` state에 복원, `hasSaunaTemps=true`

## 변경하지 않는 것
- DB 스키마/마이그레이션: 없음
- `src/types/index.ts`: deep_log에 이미 `wet_sauna_temp` 있음
- `src/lib/history-stats.ts`: TEMP DELTA를 집계할 때 `sauna_temp` 사용, wet은 deep_log에서 별도 — 현행 유지

## 복잡도
- **Medium**: `log/page.tsx` (토글 UI + 상태 + 데이터 전달)
- **Medium**: `logs-service.ts` (insert/update에 deep_logs 자동 생성)
- **Low**: 나머지 6개 파일 (fallback 로직 1-3줄)

## 검증
1. 숏로그: 건식↔습식 토글 전환, 습식 저장 후 DB 확인 (logs.sauna_temp=null, deep_logs.wet_sauna_temp=값)
2. 기록 상세: 습식 로그 → "WET SAUNA" 라벨 + 온도 표시
3. 스토리 카드: 습식 로그 TEMP DELTA 정상 (wet_sauna_temp - cold_bath_temp)
4. 딥로그 진입: 숏로그에서 습식 입력 후 딥로그 가면 습식 온도 이미 채워져 있음
5. 편집: 습식 로그 편집 시 토글이 습식으로 복원

## 주요 파일 경로
- `src/app/log/page.tsx`
- `src/lib/logs-service.ts`
- `src/constants/content.ts`
- `src/app/story/page.tsx`
- `src/lib/image-export.ts`
- `src/app/history/[id]/page.tsx`
- `src/app/log/deep/page.tsx`
