# Places DB Data Quality Analysis

**Date**: 2026-03-24
**Total places**: 236 (195 KR-coded, 41 non-KR)

---

## Issue 1: 11 Places with Wrong country_code (KR → JP)

All 11 places coded as `country_code=KR` are confirmed Japanese facilities via Google Places API.
They all have `source=google` in place_sources, whereas all actual Korean places have `source=naver` only.

| # | Name | Google Place ID | Actual Location (Google verified) |
|---|------|----------------|----------------------------------|
| 1 | Hiki stargazing sauna | ChIJoynrMiSjWjURrnvE_IfD7SI | Hiroshima, Japan |
| 2 | SKY SPA Yokohama | ChIJdx0GWRNcGGARRyDTpB_Y-Hs | Yokohama, Kanagawa, Japan |
| 3 | TREATMENT SAUNA STEAMS. | ChIJ9WeNJsOLGGARTur9CPlVn-E | Minato City, Tokyo, Japan |
| 4 | The Sauna | ChIJoTLAbHsj9l8R4FkHsttXvls | Shinano, Nagano, Japan |
| 5 | Wellbe Sakae | ChIJgaTQU9JwA2ARu_5EEb6vxac | Nagoya, Aichi, Japan |
| 6 | Osaka Sauna DESSE | ChIJtTbI_UznAGARt0Ww5f65y00 | Chuo Ward, Osaka, Japan |
| 7 | Spa Metsa Sendai Ryusenji no Yu | ChIJ8-5U8YCBiV8RExnd9rCyhnc | Izumi Ward, Sendai, Japan |
| 8 | Mifuneyama Rakuen Hotel | ChIJjz3R_10oQDUR5Q3OzKCuuYg | Takeo, Saga, Japan |
| 9 | sauna kolme kylä | ChIJvbPOQQAHVDURCke2YOOiMDU | Okayama, Japan |
| 10 | Wagamachi Sauna | ChIJhXJcN4fnAGARc7-iDhBWZVU | Fukushima Ward, Osaka, Japan |
| 11 | Midorinokaze Resort Kitayuzawa | ChIJ26524iBbdV8RhRg9unvgC6o | Date, Hokkaido, Japan |

**Place IDs to fix** (DB `places.id`):
```
0130e29a-430a-49f0-afdf-4f414cd288f8
a5414757-8ad8-4d80-a18b-070365715b23
346d8006-958e-491e-9cfd-11f66ace5299
5b79400d-f1a2-4319-b4e7-714d7f0dfb8e
ca118a6e-453d-4240-a4ba-d7f36b12187a
5051b444-0ed3-4188-9cf0-c96b5c351585
44cb9251-f776-4d02-8f25-47ca4d66baf3
5cf44bec-80f8-4ec2-9071-f91d778b7bdd
9f22876a-bb94-4a6c-a537-3fcf8a1cab78
a887626e-0f2c-4385-aed1-c75c052649c3
87791b43-5818-4d17-82af-ea423597c34c
```

**Root cause**: These 11 places were seeded with Google sources but assigned `country_code=KR` by default instead of detecting country from the Google address.

**Recommendation**:
1. Update all 11 to `country_code=JP`
2. Add country detection logic in the seed/import pipeline that parses `address_components` from Google API

---

## Issue 2: Language Verification

### Results
- **KR places with Latin-only names: 11** — these are exactly the 11 misclassified Japanese places above
- **Non-KR places with Korean names: 0** — no anomalies in the other direction

### Conclusion
After fixing Issue 1 (moving the 11 JP places out of KR), there are **zero language anomalies**:
- All 184 actual KR places have Korean (한글) names
- All 41+ non-KR places have Latin/English names

No action needed beyond Issue 1 fix.

---

## Issue 3: 5 Naver external_ids Containing URLs

These 5 records have website URLs stored in `external_id` instead of proper Naver map identifiers:

| Name | external_id (URL) | facility_type |
|------|-------------------|---------------|
| 더 리버사이드 호텔 더 메디스파 | `http://www.riversidehotel.co.kr/pages/spa02.php` | hotel-spa |
| 더앤리조트스파 | `http://www.thenresort.com/` | public-bath |
| 히든베이호텔 | `https://www.hiddenbay.co.kr/` | hotel-spa |
| 안토 | `https://www.antoresort.co.kr/` | hotel-spa |
| 그랜드워커힐서울 | `https://www.walkerhill.com/grandwalkerhillseoul/kr/` | hotel-spa |

**place_source IDs**:
```
d54a4063-2dd3-4ad3-8e91-eb58aef29a22  (더 리버사이드 호텔 더 메디스파)
d5537c3d-a263-4377-b185-54ee1f8b4b48  (더앤리조트스파)
2e77190e-2ba1-4654-bfdb-634cb70be969  (히든베이호텔)
a26d5213-afb0-4a1c-9753-ed0f83904c94  (안토)
a68d907c-93c9-4dfd-a152-301a9076e6d6  (그랜드워커힐서울)
```

**Pattern**: All 5 are hotel-spa or resort-type facilities. The external_id contains the facility's own website URL rather than a Naver `lng_lat` coordinate-based ID (which all other Naver sources use, e.g., `1270181435_375181498`).

**Root cause**: Likely the seed data source for these hotel-spa entries had website URLs instead of Naver map IDs, and the import script did not validate the `external_id` format.

**Impact**: These places still have valid `latitude`, `longitude`, `name_original`, and `address_original`, so the app works fine. However, the `external_id` cannot be used for Naver map deep-linking.

**Recommendation**:
1. Derive correct Naver external_ids from their coordinates: format is `{lng*10000000}_{lat*10000000}` (integer, no decimals)
2. Add validation in the import pipeline: Naver external_ids should match pattern `^\d+_\d+$`

---

## Issue 4: Google Place ID Enrichment for Korean Places

Tested 10 random Korean places — **all 10 found on Google Maps** with valid Place IDs:

| Korean Place Name | Google Place ID | Google Name Match |
|-------------------|----------------|-------------------|
| 유천스파 | ChIJ8TDPH33vYTURdgf_nNFYw0E | (주)유천스파 |
| 네이버한방스파 | ChIJv9a-QqWYfDURrhKzGFoh2yg | 네이버한방스파 |
| 군인공제회관 M스포렉스 | ChIJ6WO8ZaamfDUR13rLk4KqeHk | 군인공제회관 (partial) |
| 도미인 서울 강남 | ChIJoXN6rfyjfDURTrAX_PNpWWA | 도미인 서울 강남 |
| 수정사우나 | ChIJgXGpyhGhfDUR8bQUaJU8o7w | 수정사우나 |
| 동부사우나 | ChIJRby7lG5GYzURL8bN-YXmd_k | 동부사우나 (양평 match) |
| 백제불한증막 인삼사우나 | ChIJ98O9X7ulfDURJBoI8cKXzy4 | 백제인삼사우나 (partial) |
| 녹천탕 | ChIJc2uLspqTaDURCiGPRQyJcco | 녹천탕 |
| 천호목욕탕 | ChIJga_DLSSZfDURTlZd6LrQke4 | 천호대중목욕탕 (partial) |
| 일죽목욕탕 | ChIJd0dsrZm6ZDUR532wiEuxDBQ | 일죽목욕탕 |

**Match rate**: 10/10 (100%) — 7 exact, 3 partial name matches
**Partial matches**: Google sometimes uses a longer/shorter official name, but the facility is the same.

**Recommendation**:
1. Run a batch enrichment script for all 184 Korean places using `findplacefromtext` API
2. Store results as additional `place_sources` records with `source='google'`
3. Benefits: enables Google Maps deep-linking, Google reviews integration, English name availability
4. **Cost estimate**: 184 Find Place requests × $0.017/request = ~$3.13 (Places API pricing)
5. Consider adding a confidence check: only store if the Google result's coordinates are within ~500m of our stored coordinates

---

## Summary of Recommendations

| Issue | Severity | Fix Effort | Action |
|-------|----------|-----------|--------|
| 1. 11 wrong country_codes | HIGH | Low | UPDATE 11 rows: `country_code='JP'` |
| 2. Language anomalies | N/A | None | Resolved by Issue 1 fix |
| 3. URL in external_id (5) | MEDIUM | Low | Recalculate from coordinates or Naver lookup |
| 4. Missing Google IDs (184) | LOW | Medium | Batch enrichment script (~$3) |
