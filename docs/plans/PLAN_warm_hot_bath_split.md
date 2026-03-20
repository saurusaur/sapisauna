# 온탕/열탕 DB 분리 플랜

> deep_logs에서 온탕(warm_bath)과 열탕(very_hot_bath) 명확 구분

## 변경 요약

| 현재 | → 변경 | 비고 |
|------|--------|------|
| `deep_logs.has_hot_bath` | `has_very_hot_bath` | rename |
| `deep_logs.hot_bath_temp` (38-46) | `very_hot_bath_temp` | rename |
| — | `has_warm_bath` BOOLEAN | 신규 |
| — | `warm_bath_temp` INT (35-42) | 신규 |
| `logs.hot_bath_temp` | 변경 없음 | 목욕파 숏로그 |

## 1. DB 마이그레이션

파일: `supabase/008_warm_hot_bath_split.sql`

```sql
ALTER TABLE deep_logs RENAME COLUMN has_hot_bath TO has_very_hot_bath;
ALTER TABLE deep_logs RENAME COLUMN hot_bath_temp TO very_hot_bath_temp;
ALTER TABLE deep_logs ADD COLUMN has_warm_bath BOOLEAN DEFAULT false;
ALTER TABLE deep_logs ADD COLUMN warm_bath_temp INT CHECK (warm_bath_temp BETWEEN 35 AND 42);
```

## 2. 수정 파일 (7개)

| # | 파일 | 변경 내용 |
|---|------|----------|
| 1 | `src/types/index.ts:172-173` | `has_hot_bath→has_very_hot_bath`, `hot_bath_temp→very_hot_bath_temp` + warm 추가 |
| 2 | `src/lib/logs-service.ts:67-68,291-292,312` | DB 읽기/쓰기 매핑 rename + warm 추가 + autoTag 매핑 수정 |
| 3 | `src/constants/content.ts:497-511` | `DEEP_LOG.HOT_BATH` → `WARM_BATH` + `VERY_HOT_BATH` 분리 |
| 4 | `src/app/log/deep/page.tsx:54-56,103-104,139-140,381-413` | state rename + warm state 추가 + UI 슬라이더 2개 |
| 5 | `src/app/history/[id]/page.tsx:379-383` | 표시 블록 온탕/열탕 분리 |
| 6 | `src/app/explore/[id]/page.tsx:112,121,130` | 사-피 리포트 온탕/열탕 별도 집계 |
| 7 | `supabase/008_warm_hot_bath_split.sql` | 마이그레이션 (신규) |

## 3. 변경 불필요 (확인 완료)

- `src/app/story/page.tsx` — logs.hot_bath_temp (숏로그) 사용, 무관
- `src/app/log/page.tsx` — logs.hot_bath_temp (숏로그) 사용, 무관
- `src/lib/utils.ts` — logs 테이블 필드, 무관
- `src/lib/image-export.ts` — logs 테이블, 무관
- `src/components/svg/bather-graph.tsx` — logs 테이블, 무관

## 4. autoTag 매핑 변경

```
변경 전: has_hot_bath → 'hot-bath' 태그
변경 후: has_warm_bath → 'hot-bath' (온탕)
         has_very_hot_bath → 'very-hot-bath' (열탕)
```

## 5. 작업 순서

1. Supabase Dashboard에서 SQL 실행
2. types → service → constants → deep/page → history → explore 순서
3. 로컬 테스트: 딥로그 작성 → 저장 → 히스토리 → 탐색 확인
4. 배포

## 6. 리스크

- 기존 열탕 데이터: rename이므로 자동 이전, 손실 없음
- warm_bath 신규: 기존 로그는 null, 문제 없음
- localStorage 캐시: 편집 시 옛 키 fallback 처리 필요 (1회성)
