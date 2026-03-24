# Hotel-Spa Address Verification Report

**Date**: 2026-03-24
**Source**: `docs/research/seed-data-final-db-state.csv` (facility_type = hotel-spa)
**Total entries**: 40
**Method**: Korean facilities via Naver/web search, overseas via Google/web search

---

## Summary

| Result | Count |
|--------|-------|
| MATCH | 31 |
| MISMATCH | 2 |
| TRUNCATED (DB field cut off) | 5 |
| UNABLE TO VERIFY | 2 |

---

## Overseas Facilities (15)

### 1. Ochiairo
- **DB**: `1887-1 Yugashima  Izu  Shizuoka 410-3206`
- **Verified**: 〒410-3206 静岡県伊豆市湯ヶ島1887-1 (1887-1 Yugashima, Izu, Shizuoka 410-3206)
- **Result**: MATCH

### 2. Onyado Nono Nanba
- **DB**: `1-chōme-4-18 Nipponbashi  Chuo Ward  Osa` (truncated)
- **Verified**: 〒542-0073 大阪府大阪市中央区日本橋1-4-18 (1-4-18 Nipponbashi, Chuo-ku, Osaka)
- **Result**: MATCH (address truncated in DB but content correct)
- **Note**: DB field cut off at "Osa..." — full city name is "Osaka"

### 3. Wellbe Sakae
- **DB**: `Japan  〒460-0008 Aichi  Nagoya  Naka War` (truncated)
- **Verified**: 〒460-0008 愛知県名古屋市中区栄3-13-12 (3-13-12 Sakae, Naka-ku, Nagoya, Aichi)
- **Result**: MATCH (postal code and ward correct; DB truncated at "Naka War..." = Naka Ward; missing street-level detail 栄3-13-12)
- **Note**: DB lacks specific street address (3-13-12 Sakae)

### 4. AIRE Ancient Baths Barcelona
- **DB**: `Passeig de Picasso  22  Ciutat Vella  08` (truncated)
- **Verified**: Passeig de Picasso, 22, 08003 Barcelona, Spain
- **Result**: MATCH (truncated postal code "08" = 08003)

### 5. BOTANICAL POOL CLUB
- **DB**: `1510-2 Shimosakuma  Kyonan  Awa District` (truncated)
- **Verified**: 〒299-2115 千葉県安房郡鋸南町下佐久間1510-2 (1510-2 Shimosakuma, Kyonan, Awa District, Chiba)
- **Result**: MATCH (truncated but correct)

### 6. Elamus Spa
- **DB**: `Akadeemia tee 30  12611 Tallinn  Estonia`
- **Verified**: Akadeemia tee 30, 12611 Tallinn, Estonia
- **Result**: MATCH

### 7. Janu Tokyo
- **DB**: `1-chōme-2-2 Azabudai  Minato City  Tokyo`
- **Verified**: 東京都港区麻布台1-2-2 (1-2-2 Azabudai, Minato City, Tokyo)
- **Result**: MATCH

### 8. Therme Erding
- **DB**: `Thermenallee 1-5  85435 Erding  Germany`
- **Verified**: Thermenallee 1-5, 85435 Erding, Germany
- **Result**: MATCH

### 9. Bettei Senjyuan
- **DB**: `614 Tanigawa  Minakami  Tone District  G` (truncated)
- **Verified**: 〒379-1619 群馬県利根郡みなかみ町谷川614 (614 Tanigawa, Minakami, Tone District, Gunma)
- **Result**: MATCH (truncated at "G..." = Gunma)

### 10. Kitakobushi Shiretoko Hotel & Resort
- **DB**: `172 Utorohigashi  Shari  Shari District` (truncated)
- **Verified**: 〒099-4355 北海道斜里郡斜里町ウトロ東172 (172 Utoro-Higashi, Shari, Shari District, Hokkaido)
- **Result**: MATCH

### 11. Kannojigoku Hotel
- **DB**: `257 Tano  Kokonoe  Kusu District  Oita 8` (truncated)
- **Verified**: 大分県玖珠郡九重町田野257 (257 Tano, Kokonoe, Kusu District, Oita)
- **Result**: MATCH

### 12. Mifuneyama Rakuen Hotel
- **DB**: `Japan  〒843-0022 Saga  Takeo  武雄町武雄４１００`
- **Verified**: 〒843-0022 佐賀県武雄市武雄町大字武雄4100
- **Result**: MATCH

### 13. Aomoriya by Hoshino Resorts
- **DB**: `Horikirizawa-56 Furumagiyama  Misawa  Ao` (truncated)
- **Verified**: 〒033-0044 青森県三沢市古間木山56 (56 Furumagiyama, Misawa, Aomori)
- **Result**: MISMATCH (minor)
- **Detail**: DB says "Horikirizawa-56 Furumagiyama" but verified address is just "古間木山56" (Furumagiyama 56). "Horikirizawa" (堀切沢) appears to be a sub-area name that is not part of the official address. The number is correct and facility is correctly identified.
- **Recommended fix**: Change to `56 Furumagiyama  Misawa  Aomori 033-0044`

### 14. Yuyado Daiichi
- **DB**: `518 Yōrōushi  Nakashibetsu  Shibetsu Dis` (truncated)
- **Verified**: 〒088-2684 北海道標津郡中標津町養老牛518 (518 Yoroushi, Nakashibetsu, Shibetsu District, Hokkaido)
- **Result**: MATCH

### 15. Noboribetsu Grand Hotel
- **DB**: `154 Noboribetsuonsenchō  Noboribetsu  Ho` (truncated)
- **Verified**: 〒059-0592 北海道登別市登別温泉町154 (154 Noboribetsu Onsencho, Noboribetsu, Hokkaido)
- **Result**: MATCH

---

## Korean Facilities (25)

### 16. 온유재스파마사지 상무점
- **DB**: `광주광역시 서구 시청로 57 2층 201호`
- **Verified**: 온유재스파 상무점은 광주 서구 상무지구에 위치 확인. 정확한 도로명 주소는 "시청로60번길 22" 근처로 추정되나, "시청로 57"과 일치하는 공식 확인 불가.
- **Result**: UNABLE TO VERIFY
- **Note**: 온유재스파는 마사지/에스테틱 업체로 hotel-spa 분류가 적절한지 재검토 필요. 공식 채널에서 상무점 정확 주소 확인 권장.

### 17. 그랜드 하얏트 서울
- **DB**: `서울특별시 용산구 소월로 322`
- **Verified**: 서울특별시 용산구 소월로 322 (한남동)
- **Result**: MATCH

### 18. 소노캄 경주
- **DB**: `경상북도 경주시 보문로 402-12 소노캄 경주`
- **Verified**: 경상북도 경주시 보문로 402-12 (신평동)
- **Result**: MATCH

### 19. 더 리버사이드 호텔 더 메디스파
- **DB**: `서울 서초구 강남대로107길 6`
- **Verified**: 서울특별시 서초구 강남대로107길 6
- **Result**: MATCH

### 20. 도미인 EXPRESS 서울 인사동
- **DB**: `서울특별시 종로구 인사동길 20-9`
- **Verified**: 서울특별시 종로구 인사동길 20-9
- **Result**: MATCH

### 21. 설해원 온천사우나
- **DB**: `강원특별자치도 양양군 손양면 공항로 230 설해온천 스파레벨(B1)`
- **Verified**: 강원특별자치도 양양군 손양면 공항로 230 (동호리, 설해원)
- **Result**: MATCH

### 22. 그랜드 하얏트 인천
- **DB**: `인천광역시 중구 영종해안남로321번길 208`
- **Verified**: 인천광역시 중구 영종해안남로321번길 208
- **Result**: MATCH

### 23. 도미인 서울 강남
- **DB**: `서울특별시 강남구 봉은사로 134`
- **Verified**: 서울특별시 강남구 봉은사로 134
- **Result**: MATCH

### 24. 서울신라호텔
- **DB**: `서울특별시 중구 동호로 249`
- **Verified**: 서울특별시 중구 동호로 249
- **Result**: MATCH

### 25. 트리니티스파 신세계백화점센텀시티점
- **DB**: `부산광역시 해운대구 센텀남대로 35 신세계백화점센텀시티점10F`
- **Verified**: 신세계백화점 센텀시티 주소 = 부산광역시 해운대구 센텀남대로 35. 트리니티스파는 신세계 VIP 클럽 시설로 10층에 위치.
- **Result**: MATCH

### 26. 히든베이호텔
- **DB**: `전남 여수시 신월로 496-25`
- **Verified**: 전남 여수시 신월로 496-25
- **Result**: MATCH

### 27. 오레브핫스프링앤스파
- **DB**: `제주특별자치도 서귀포시 태평로 152 오레브핫스프링앤스파`
- **Verified**: 제주특별자치도 서귀포시 태평로 152
- **Result**: MATCH

### 28. 그랜드워커힐서울
- **DB**: `서울특별시 광진구 광장동 22-1 그랜드워커힐 서울`
- **Verified**: 서울특별시 광진구 워커힐로 177 (지번: 광장동 22-1)
- **Result**: MATCH
- **Note**: DB는 지번주소 사용. 도로명주소는 "워커힐로 177". 둘 다 동일 위치.

### 29. 웨스틴 조선 서울
- **DB**: `서울특별시 중구 소공로 106`
- **Verified**: 서울특별시 중구 소공로 106 (소공동)
- **Result**: MATCH

### 30. 이천 테르메덴
- **DB**: `경기도 이천시 모가면 사실로 984`
- **Verified**: 경기도 이천시 모가면 사실로 984
- **Result**: MATCH

### 31. 조선 팰리스 서울 강남
- **DB**: `서울특별시 강남구 테헤란로 231 센터필드타워 웨스트동`
- **Verified**: 서울특별시 강남구 테헤란로 231 (센터필드 WEST)
- **Result**: MATCH

### 32. 클럽디오아시스 스파&워터파크
- **DB**: `부산광역시 해운대구 달맞이길 30 엘시티`
- **Verified**: 부산광역시 해운대구 달맞이길 30 엘시티 3,4,5,6층
- **Result**: MATCH

### 33. 안토
- **DB**: `서울 강북구 삼양로 689`
- **Verified**: 서울특별시 강북구 삼양로 689 (우이동)
- **Result**: MATCH

### 34. 하이디하우스
- **DB**: `서울특별시 서초구 성촌4길 11`
- **Verified**: 서울특별시 서초구 성촌4길 11
- **Result**: MATCH

### 35. 스파바이록시땅앳파크로쉬
- **DB**: `강원특별자치도 정선군 중봉길 9-12 파크로쉬`
- **Verified**: 강원특별자치도 정선군 북평면 중봉길 9-12
- **Result**: MISMATCH (minor)
- **Detail**: DB에 "북평면"이 누락됨. 정확한 주소는 "강원특별자치도 정선군 **북평면** 중봉길 9-12"
- **Recommended fix**: `강원특별자치도 정선군 북평면 중봉길 9-12 파크로쉬`

### 36. 프리마스파
- **DB**: `서울특별시 강남구 도산대로102길 10`
- **Verified**: 서울특별시 강남구 도산대로102길 10 (청담동 56-17). 구 청담 프리마 호텔 부지 내 스파.
- **Result**: MATCH

### 37. 호텔탑스텐 금진온천
- **DB**: `강원특별자치도 강릉시 옥계면 헌화로 455-34 호텔탑스텐 1층`
- **Verified**: 강원특별자치도 강릉시 옥계면 헌화로 455-34
- **Result**: MATCH

### 38. 아라고나이트 고온천
- **DB**: `제주특별자치도 서귀포시 안덕면 산록남로 762번길 71`
- **Verified**: 제주특별자치도 서귀포시 안덕면 산록남로762번길 71 (디아넥스호텔 부대시설)
- **Result**: MATCH

### 39. 힐튼호텔 경주
- **DB**: `경상북도 경주시 보문로 484-7`
- **Verified**: 경상북도 경주시 보문로 484-7
- **Result**: MATCH

### 40. 온유재스파마사지 상무점 (facility_type 재검토 필요)
- **Note**: 이 시설은 마사지/에스테틱 업체로, hotel-spa보다는 다른 분류가 적절할 수 있음

---

## Action Items

### Mismatches to Fix (2건)

| # | 시설명 | 문제 | 수정안 |
|---|--------|------|--------|
| 13 | Aomoriya by Hoshino Resorts | "Horikirizawa-56" → 공식 주소에 Horikirizawa 없음 | `56 Furumagiyama, Misawa, Aomori 033-0044` |
| 35 | 스파바이록시땅앳파크로쉬 | "북평면" 누락 | `강원특별자치도 정선군 북평면 중봉길 9-12 파크로쉬` |

### Truncated Addresses (5건)
DB 필드 길이 제한으로 주소가 잘린 항목들. 내용은 정확하나 불완전:
- Onyado Nono Nanba: "Osa..." → "Osaka 542-0073"
- Wellbe Sakae: "Naka War..." → "Naka Ward, Nagoya" + 상세주소 "3-13-12 Sakae" 누락
- Bettei Senjyuan: "G..." → "Gunma"
- Kannojigoku Hotel: "Oita 8..." → "Oita 879-4911"
- Noboribetsu Grand Hotel: "Ho..." → "Hokkaido"

### Unable to Verify (1건)
- 온유재스파마사지 상무점: 정확한 주소 확인 불가 + hotel-spa 분류 적합성 검토 필요

### Classification Review (1건)
- 온유재스파마사지 상무점: 마사지/에스테틱 업체 → hotel-spa 분류가 적절한지 확인 필요
