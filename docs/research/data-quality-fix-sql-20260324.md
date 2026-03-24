# 데이터 품질 수정 SQL (2026-03-24)

## 1. country_code 오류 11건 (KR → JP)

시드 데이터 입력 시 Google 소스 장소들에 country_code=KR이 기본값으로 들어감.
실제로는 전부 일본 시설 (Google Places API로 확인됨).

```sql
-- 11개 일본 시설 country_code 수정
UPDATE places SET country_code = 'JP', updated_at = NOW()
WHERE id IN (
  '0130e29a-430a-49f0-afdf-4f414cd288f8',  -- Hiki stargazing sauna (Hiroshima)
  'a5414757-8ad8-4d80-a18b-070365715b23',  -- SKY SPA Yokohama
  '346d8006-958e-491e-9cfd-11f66ace5299',  -- TREATMENT SAUNA STEAMS. (Tokyo)
  '5b79400d-f1a2-4319-b4e7-714d7f0dfb8e',  -- The Sauna (Nagano)
  'ca118a6e-453d-4240-a4ba-d7f36b12187a',  -- Wellbe Sakae (Nagoya)
  '5051b444-0ed3-4188-9cf0-c96b5c351585',  -- Osaka Sauna DESSE
  '44cb9251-f776-4d02-8f25-47ca4d66baf3',  -- Spa Metsa Sendai Ryusenji no Yu
  '5cf44bec-80f8-4ec2-9071-f91d778b7bdd',  -- Mifuneyama Rakuen Hotel (Saga)
  '9f22876a-bb94-4a6c-a537-3fcf8a1cab78',  -- sauna kolme kylä (Okayama)
  'a887626e-0f2c-4385-aed1-c75c052649c3',  -- Wagamachi Sauna (Osaka)
  '87791b43-5818-4d17-82af-ea423597c34c'   -- Midorinokaze Resort Kitayuzawa (Hokkaido)
);
-- 예상: 11 rows affected
```

## 2. Naver external_id에 URL이 들어간 5건

호텔/리조트 시설의 external_id에 웹사이트 URL이 들어감.
정상적인 naver external_id는 `{lng*1e7}_{lat*1e7}` 좌표 포맷.

**확인 후 수정**: 각 장소의 좌표로 올바른 external_id를 계산하거나, Naver 지도에서 수동 확인 후 반영.

```sql
-- 현재 잘못된 값 확인
SELECT ps.id, p.name, ps.external_id, p.latitude, p.longitude
FROM place_sources ps
JOIN places p ON p.id = ps.place_id
WHERE ps.id IN (
  'd54a4063-2dd3-4ad3-8e91-eb58aef29a22',  -- 더 리버사이드 호텔 더 메디스파
  'd5537c3d-a263-4377-b185-54ee1f8b4b48',  -- 더앤리조트스파
  '2e77190e-2ba1-4654-bfdb-634cb70be969',  -- 히든베이호텔
  'a26d5213-afb0-4a1c-9753-ed0f83904c94',  -- 안토
  'a68d907c-93c9-4dfd-a152-301a9076e6d6'   -- 그랜드워커힐서울
);

-- 좌표 기반 external_id 계산 (lng * 10000000 _ lat * 10000000)
-- 예시: 더 리버사이드 호텔 (lng=127.xxx, lat=37.xxx)
-- → external_id = '1270000000_370000000' (실제 좌표로 계산 필요)
--
-- 수동 확인 후 UPDATE:
-- UPDATE place_sources SET external_id = '계산된값' WHERE id = '대상id';
```

## 3. 한국 장소 Google Place ID 보강 (184건) — 별도 태스크

현재 한국 장소는 Google Place ID가 0건.
샘플 10개 테스트 결과 10/10 매칭 (100%).
Batch enrichment 비용 ~$3.

```sql
-- enrichment 후 INSERT 예시 (배치 스크립트 결과):
-- INSERT INTO place_sources (place_id, source, external_id)
-- VALUES ('place-uuid', 'google', 'ChIJxxxxx');
```

이건 별도 enrichment 스크립트 실행 후 진행.
