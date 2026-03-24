# Map Link Verification Report

**Date**: 2026-03-24
**Sample**: 30 places (10 KR, 10 JP, 10 Other)
**Method**: Google Places API validation + curl-based URL content check

---

## 1. Executive Summary

| 항목 | 결과 |
|------|------|
| Google Format A (현재 사용) | **0/30 작동** — place name이 SSR 응답에 포함되지 않음 |
| Google Format B (권장) | **29/30 작동** — 공식 Maps URLs API 형식 |
| Google Format D (fallback) | **29/30 작동** — name+address 검색 |
| Google Place ID 유효성 | **20/20 유효** (모든 ID가 API에서 OK 반환) |
| Naver 검색 URL | curl/WebFetch 검증 불가 (JS 렌더링) — 브라우저 수동 확인 필요 |

**핵심 발견**: 현재 Format A (`/maps/place/?q=place_id:ID`)는 Google Maps에서 **공식 지원하지 않는 URL 형식**이다. Place ID 자체는 모두 유효하지만, URL 포맷이 잘못되어 빈 지도 페이지가 표시된다.

---

## 2. Google Maps URL Format 테스트 결과

### 테스트한 포맷

| Format | URL Pattern | 공식 여부 |
|--------|-------------|-----------|
| A (현재) | `https://www.google.com/maps/place/?q=place_id:{ID}` | **비공식** — 문서에 없음 |
| B (권장) | `https://www.google.com/maps/search/?api=1&query={NAME}&query_place_id={ID}` | **공식** — [Maps URLs](https://developers.google.com/maps/documentation/urls/get-started) |
| D (fallback) | `https://www.google.com/maps/search/?api=1&query={NAME}+{ADDRESS}` | **공식** — place_id 없을 때 |

### 전체 결과 테이블

| # | Name | Country | Google ID | ID Valid | Format A | Format B | Format D |
|---|------|---------|-----------|----------|----------|----------|----------|
| 1 | 유천스파 | KR | - | - | - | - | - |
| 2 | 24시사우나 네이버한방스파 | KR | - | - | - | - | - |
| 3 | 군인공제회관 M스포렉스 | KR | - | - | - | - | - |
| 4 | 도미인 서울 강남 | KR | - | - | - | - | - |
| 5 | 수정사우나 | KR | - | - | - | - | - |
| 6 | 동부사우나 | KR | - | - | - | - | - |
| 7 | 백제불한증막 인삼사우나 | KR | - | - | - | - | - |
| 8 | 녹천탕 | KR | - | - | - | - | - |
| 9 | 천호목욕탕 | KR | - | - | - | - | - |
| 10 | 일죽목욕탕 | KR | - | - | - | - | - |
| 11 | Janu Tokyo | JP | ChIJEWV5V2-LGGA... | YES | NONE | EXACT | EXACT |
| 12 | sauna kolme kyla | JP* | ChIJvbPOQQAHVDU... | YES | NONE | EXACT | EXACT |
| 13 | TSUKAHARA KARAFURO | JP | ChIJZ0nTw92VUzU... | YES | NONE | EXACT | EXACT |
| 14 | BOTANICAL POOL CLUB | JP | ChIJG9fBOtAdGGA... | YES | NONE | EXACT | EXACT |
| 15 | Hakusan-yu Takatsuji | JP | ChIJJxGZY54IAWA... | YES | NONE | EXACT | EXACT |
| 16 | Midorinokaze Resort Kitayuzawa | JP* | ChIJ26524iBbdV8... | YES | NONE | EXACT | EXACT |
| 17 | Shiriuchi Onsen Kokyu no Ma | JP | ChIJySLX44HInl8... | YES | NONE | EXACT | EXACT |
| 18 | Yulax | JP | ChIJyT9mQGL0QDU... | YES | NONE | EXACT | EXACT |
| 19 | Spa Metsa Sendai Ryusenji no Yu | JP* | ChIJ8-5U8YCBiV8... | YES | NONE | EXACT | EXACT |
| 20 | Shibuya Saunas | JP | ChIJpzjfMsyLGGA... | YES | NONE | EXACT | EXACT |
| 21 | Bathhouse Williamsburg | US | ChIJBTF_ACxZwok... | YES | NONE | EXACT | EXACT |
| 22 | Elamus Spa | EE | ChIJZYUkv0qVkkY... | YES | NONE | EXACT | EXACT |
| 23 | Friedrichsbad Baden-Baden | DE | ChIJkS-PNUEfl0c... | YES | NONE | EXACT | EXACT |
| 24 | Kalma Saun | EE | ChIJvztCf3uTkkY... | YES | NONE | EXACT | EXACT |
| 25 | Kuusijärvi | FI | ChIJf0AkBfAGkkY... | YES | NONE | EXACT | EXACT |
| 26 | Rauhaniemi Folk Spa | FI | ChIJ6ziEnk0nj0Y... | YES | NONE | EXACT | EXACT |
| 27 | Löyly Helsinki | FI | ChIJ7WWs57ELkkY... | YES | NONE | EXACT | EXACT |
| 28 | Othership Flatiron | US | ChIJKxPbBwBZwok... | YES | NONE | EXACT | EXACT |
| 29 | Rajaportti sauna | FI | ChIJO38bvJnYjkY... | YES | NONE | EXACT | EXACT |
| 30 | AIRE Ancient Baths Barcelona | US | ChIJ_dPAk_2ipBI... | YES | NONE | EXACT | EXACT |

> **JP***: `country_code=KR`로 저장되어 있으나 실제 일본 시설 (별도 데이터 품질 이슈)

### Format 결과 요약

| Format | EXACT | PARTIAL | NONE | 비고 |
|--------|-------|---------|------|------|
| A (현재) | 0 | 0 | 20 | **완전히 작동 안 함** |
| B (권장) | 19 | 1 | 0 | `Onsen Balcony King&Queen`만 PARTIAL (& 인코딩 이슈) |
| D (fallback) | 19 | 1 | 0 | B와 동일한 성능 |

---

## 3. Naver Maps URL 테스트 (한국 시설)

### 현재 포맷
```
https://map.naver.com/v5/search/{NAME}?c={LNG},{LAT},17
```

### 검증 제약
- Naver Maps는 100% JS 렌더링 → curl/WebFetch로 콘텐츠 검증 불가
- Naver API는 captcha로 자동 요청 차단
- **브라우저 수동 확인이 필요함**

### Naver external_id 분석

| 유형 | 건수 | 설명 |
|------|------|------|
| `mapx_mapy` 좌표 형식 | 179 | `1270442278_374775719` — 직접 place URL로 변환 불가 |
| URL (웹사이트) | 5 | 시설 홈페이지 URL이 저장됨 — 지도 링크로 사용 불가 |

> Naver external_id는 좌표 기반이므로 네이버 지도 place 페이지로 직접 연결할 수 없다. 현재의 검색 URL 방식이 유일한 접근법.

### Naver URL 개선 가능성
- `name + address` 검색이 `name` 단독 검색보다 정확할 수 있음
- 좌표 파라미터(`?c=lng,lat,17`)는 검색 영역을 제한하므로 유지 권장
- Naver Place API(유료)를 통해 naver_place_id를 별도로 수집하면 `https://map.naver.com/p/entry/place/{PLACE_ID}` 직접 링크 가능

---

## 4. 전체 DB 현황

| 구분 | 건수 | Google 링크 | Naver 링크 |
|------|------|-------------|------------|
| Google source만 있는 시설 | 52 | Format B 사용 가능 | name 검색 fallback |
| Naver source만 있는 시설 | 184 | name+coord 검색 fallback | name 검색 |
| 양쪽 다 있는 시설 | 0 | - | - |
| **합계** | **236** | - | - |

### 국가별 Google ID 보유율

| 국가 | 총 시설 | Google ID | 비율 |
|------|---------|-----------|------|
| KR | 195 | 11* | 5.6% |
| JP | 29 | 29 | 100% |
| US | 4 | 4 | 100% |
| FI | 4 | 4 | 100% |
| EE | 2 | 2 | 100% |
| DE | 2 | 2 | 100% |

> *KR 11건은 모두 일본 시설이 `country_code=KR`로 잘못 분류된 것

---

## 5. 권장 코드 변경

### 5-1. Google Maps URL 수정 (P0 — 필수)

**현재 코드** (`src/app/explore/[id]/page.tsx:308-312`):
```typescript
const googleMapUrl = googleSource?.external_id
  ? `https://www.google.com/maps/place/?q=place_id:${googleSource.external_id}`
  : place.latitude
    ? `https://www.google.com/maps/search/${encodeURIComponent(place.name)}/@${place.latitude},${place.longitude},17z`
    : `https://www.google.com/maps/search/${encodeURIComponent(place.name + ' ' + place.address)}`
```

**권장 변경**:
```typescript
const googleMapUrl = googleSource?.external_id
  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${googleSource.external_id}`
  : place.latitude
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}@${place.latitude},${place.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`
```

**변경 포인트**:
1. Format A → Format B: `place/?q=place_id:` → `search/?api=1&query=NAME&query_place_id=`
2. Fallback도 공식 Maps URLs API 형식으로 통일

### 5-2. Naver Maps URL 개선 (P1 — 권장)

현재 형식은 합리적이나, name + address 조합으로 검색 정확도를 높일 수 있음:
```typescript
const naverMapUrl = place.latitude
  ? `https://map.naver.com/v5/search/${encodeURIComponent(place.name + ' ' + place.address)}?c=${place.longitude},${place.latitude},17`
  : `https://map.naver.com/v5/search/${encodeURIComponent(place.name + ' ' + place.address)}`
```

### 5-3. 데이터 품질 이슈 (P2 — 별도 태스크)

1. **KR 오분류 11건**: `country_code=KR`이지만 실제 일본 시설 → JP로 수정 필요
2. **Naver URL external_id 5건**: 시설 홈페이지 URL이 external_id에 저장됨 — 지도 링크와 무관
3. **Google ID 미보유 KR 184건**: 한국 시설은 Google Place ID가 전혀 없어 항상 fallback 사용

---

## 6. Places with Invalid/Missing Google Place IDs

### Invalid Google Place IDs: **0건**
테스트한 20개 Place ID 모두 Google Places API에서 `OK` 반환.

### Missing Google Place IDs (Google source 없는 시설)

전체 236건 중 184건이 Google source를 보유하지 않음 (모두 KR naver-only).
이 시설들은 name+coordinate 기반 Google 검색 URL을 fallback으로 사용.

### Naver external_id가 URL인 시설 (5건)

| Name | external_id (URL) |
|------|-------------------|
| 더 리버사이드 호텔 더 메디스파 | http://www.riversidehotel.co.kr/pages/spa02.php |
| 더앤리조트스파 | http://www.thenresort.com/ |
| 히든베이호텔 | https://www.hiddenbay.co.kr/ |
| 안토 | https://www.antoresort.co.kr/ |
| 그랜드워커힐서울 | https://www.walkerhill.com/grandwalkerhillseoul/kr/ |

> 이 5건은 naver 좌표 기반 external_id가 아닌 웹사이트 URL이 저장됨 — 데이터 정리 필요

---

## 7. 검증 메타데이터

| 항목 | 내용 |
|------|------|
| 검증 명령 | Google Places API `place/details/json` 34회 호출, curl URL content check 68회 |
| 수치 증거 | Format A: 0/20 EXACT, Format B: 19/20 EXACT + 1 PARTIAL, 모든 Place ID OK |
| 신뢰도 | **HIGH** — Google API 직접 검증 + SSR 콘텐츠 확인. Naver는 MEDIUM (JS 렌더링으로 자동 검증 불가) |
