# 카톡 원본 데이터 → DB 반영 플랜

## 배경
카톡 원본(11,086줄)에서 85건 시설 정보를 재추출했으나, 시드 등록 시 반영 안 됨.
온도/태그/메모 보강 필요.

## 데이터 소스
- `docs/research/katalk-facility-detail-extract.csv` — 85건 추출 결과

## DB 매핑

```
카톡 CSV 컬럼      → DB 테이블.컬럼              → CHECK 범위
─────────────────────────────────────────────────────────
온탕온도           → logs.hot_bath_temp          → 30-46
열탕온도           → deep_logs.very_hot_bath_temp → 38-46
냉탕온도           → logs.cold_bath_temp          → 0-30
건식온도           → logs.sauna_temp              → 50-130
습식온도           → deep_logs.wet_sauna_temp     → 40-70
시설태그의 seshin  → deep_logs.scrub_types        → ['scrub']
시설태그의 massage → deep_logs.scrub_types        → ['massage'] 또는 ['scrub','massage']
가격              → deep_logs.cost               → INT
수질/청결메모      → deep_logs.memo에 append      → TEXT
```

## autoTag 매핑 (places.facilities 업데이트)

```
입력                         → facilities 태그
──────────────────────────────────────────
wet_sauna_temp 입력          → 'wet-sauna'
very_hot_bath_temp 입력      → 'very-hot-bath'
hot_bath_temp (딥로그) 입력  → 'hot-bath'
cold_bath_temp (딥로그) 입력 → 'cold-bath'
scrub_types에 'scrub'        → 'scrub'
scrub_types에 'massage'      → 'massage'
```

## 온도 업데이트 필요 (13건)

| 시설 | 변경 내용 |
|------|----------|
| 호텔탑스텐 금진온천 | 온탕 39 (신규), 열탕 41 (신규) |
| 네이처스파 | 열탕 40→46 |
| 더앤리조트스파 | 온탕 39 (신규), 냉탕 19 (신규), 건식 67 (신규) |
| 덕구온천스파월드 | 냉탕 16→24, 건식 92→70 |
| 설해원 | 온탕 40 (신규), 냉탕 20 (신규) |
| 쉐레이암반수사우나 | 열탕 45→42 |
| 스파디움24 | 냉탕 21→23 |
| 우리유황온천 | 냉탕 20→24 |
| 우이령불가마주쉼사우나 | 냉탕 11 (신규) |
| 율암온천 | 온탕 40→42, 냉탕 16→24, 건식 90→70 |
| 능암탄산온천 | 열탕 43→44 |
| 프리마스파 | 냉탕 17→13 |
| 허심청 | 온탕 40→39, 열탕 45→44 |

## 태그 보강 필요 (추출 CSV에서 시설태그가 있는 71건)

CSV의 시설태그를 시드 JSON + DB places.facilities에 합집합으로 반영.
단, CSV 태그 중 DB 태그 체계에 없는 것 매핑:
- `seshin` → `scrub`
- `outdoor-air` → `outdoor-rest`
- `outdoor-bath` → `open-air-bath`
- `warm-bath` → `hot-bath`
- `store` → `food`
- `pool` → (무시, 수영장은 사우나 태그 아님)
- `charcoal` → `bulgama`

## 세신 정보 보강

카톡에서 세신 관련 언급된 시설:
- 더메디스파, 백제인삼사우나, 블루스파, 삼호궁전사우나, 상암불꽃사우나, 설해원, 영빈호텔사우나, 청춘목욕탕, 프리마스파, 황금스파, 보석사우나, 한별불가마사우나

→ deep_logs.scrub_types에 ['scrub'] 추가 (아직 scrub_cost 정보는 없음)
→ places.facilities에 'scrub' 태그 추가

## 실행 스크립트

scripts/sync-katalk-data.ts:
1. katalk-facility-detail-extract.csv 읽기
2. seed-data-unified.json에서 place_id 매칭
3. 온도 업데이트: logs + deep_logs UPDATE
4. 태그 보강: places.facilities 합집합 UPDATE
5. 시드 JSON도 동시 업데이트

## 주의사항

- 덕구온천 건식 92→70: 큰 차이, 카톡 값 우선 적용 (실제 방문 후기)
- 더앤리조트스파 건식 67도: logs.sauna_temp CHECK 50-130 범위 내이지만 낮은 편. 습식일 수 있음 → 확인 필요
- 프리마스파 tattoo-friendly 제거 검토: 카톡에서 "문신 금지 강화 중" 언급
- 더메디스파 tattoo-friendly 제거 검토: 카톡에서 "문신 금지 강화 시작" 언급
