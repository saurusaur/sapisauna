# SA-리스트 테마별 시설 분류

> 소스: seed-data-final-db-state.csv (225건) + katalk-facility-detail-v2.csv + katalk-facility-analysis.md
> 작성일: 2026-03-23

---

## 1. 냉탕이 미친 사우나 (냉탕 14도 이하) — 13건

| 시설명 | 냉탕온도 | 근거 |
|--------|----------|------|
| 난곡목욕탕 | 9도 | seed CSV 냉탕 컬럼 |
| 마포365구민센터 | 10도 | seed CSV 냉탕 컬럼 |
| 할매탕 | 10도 | seed CSV 냉탕 컬럼 |
| 우이령불가마주쉼사우나 | 11도 | seed CSV 냉탕 컬럼 / "냉탕 온도가 무려 11도" |
| 프라임노다지사우나 | 12도 | seed CSV 냉탕 컬럼 |
| 프리마스파 | 13도 | katalk detail CSV 냉탕온도 13 (seed에는 17도 — 변동있음) |
| 관악24시불가마사우나 | 14도 | seed CSV 냉탕 컬럼 |
| 레몬사우나 | 15도 | seed/katalk CSV (경계) |
| 금정산부곡온천 | 15도 | seed CSV 냉탕 컬럼 (경계) |
| 강남목욕탕 (천안) | 15도 | seed CSV 냉탕 컬럼 (경계) |
| 아쿠아필드 안성 | 15도 | seed CSV 냉탕 컬럼 (경계) |
| 강변스파랜드 | 미기록 (5도 언급) | katalk: "여탕 냉탕은 5도까지는 아니었지만 정말 차가웠습니다" / seed 메모: "급냉탕 5도" |
| SATOYAMA TERRACE | 15도 | seed CSV 냉탕 컬럼 (경계) |

**엄격 기준 (14도 이하)**: 난곡(9), 마포365(10), 할매탕(10), 우이령(11), 프라임노다지(12), 프리마(13), 관악24시(14), 강변스파랜드(5도 언급) = **8건**
**완화 기준 (15도 포함)**: +레몬, 금정산부곡, 강남목욕탕, 아쿠아필드안성, SATOYAMA = **13건**

---

## 2. 노천탕 있는 곳 (open-air-bath 태그) — 43건

| 시설명 | 근거 |
|--------|------|
| Ochiairo | open-air-bath 태그 |
| Onyado Nono Nanba | open-air-bath 태그 |
| Spa Metsa Sendai | open-air-bath 태그 |
| Bettei Senjyuan | open-air-bath 태그 |
| Kitakobushi Shiretoko | open-air-bath 태그 |
| Taikou-no-Yu Hot Spring | open-air-bath 태그 |
| Therme Erding | open-air-bath 태그 |
| Aomoriya by Hoshino Resorts | open-air-bath 태그 |
| Yuyado Daiichi | open-air-bath 태그 |
| Noboribetsu Grand Hotel | open-air-bath 태그 |
| Rauhaniemi Folk Spa | open-air-bath 태그 |
| Midorinokaze Resort Kitayuzawa | open-air-bath 태그 |
| 네이처스파 | open-air-bath 태그 |
| 설해원 온천사우나 | open-air-bath 태그 / 노천탕 42도 |
| 허심청 | open-air-bath 태그 |
| 금천파크온천호텔 | katalk: "노천탕에서 바라보는 설산뷰" |
| 신북온천 리조트 | open-air-bath 태그 |
| 힐스파 | open-air-bath 태그 |
| 오라카이 청계산 | katalk detail에서 open-air-bath |
| 클럽케이서울 | open-air-bath 태그 |
| 산방산 탄산온천 | open-air-bath 태그 |
| 석정온천휴스파 | open-air-bath 태그 |
| 소노캄 여수 | open-air-bath 태그 |
| 소노벨청송 솔샘온천 | open-air-bath 태그 |
| 더앤리조트스파 | open-air-bath 태그 |
| 더 리버사이드 호텔 더 메디스파 | open-air-bath 태그 |
| 프리마스파 | open-air-bath 태그 (노천탕 42도) |
| 하이디하우스 | open-air-bath 태그 |
| 아쿠아필드 하남 | open-air-bath 태그 |
| 센텀 스파랜드 | open-air-bath 태그 |
| 덕구온천스파월드 | open-air-bath 태그 |
| 더케이호텔경주 스파온천 | open-air-bath 태그 |
| 파크로쉬 (스파바이록시땅) | open-air-bath 태그 |
| 능암탄산온천 | open-air-bath 태그 |
| 율암온천 | open-air-bath 태그 |
| 이천 테르메덴 | open-air-bath 태그 |
| 온양관광호텔 | open-air-bath 태그 |
| 온양온천랜드 | open-air-bath 태그 |
| 초정약수원탕 | open-air-bath 태그 |
| 진천스카이사우나 | open-air-bath 태그 |
| 유성온천불가마사우나 | open-air-bath 태그 |
| 파주가야랜드 | open-air-bath 태그 |
| 수안보파크호텔 | open-air-bath 태그 |
| 제일유황온천 | open-air-bath 태그 |
| 월문온천휴양지 | open-air-bath 태그 |
| 청송 솔기온천 | open-air-bath 태그 |
| 해미안녹차해수사우나 | katalk detail에서 open-air-bath |
| 아난티 앳 부산 코브 | open-air-bath 태그 |
| 클럽디오아시스 | open-air-bath 태그 |
| 황금스파 | open-air-bath 태그 |
| 힐튼호텔 경주 | open-air-bath 태그 |
| 하이렉스파불한증막 | open-air-bath 태그 |
| 오레브핫스프링앤스파 | open-air-bath 태그 |
| 아라고나이트 고온천 | katalk: 수영장+노천탕, 디아넥스호텔 |
| 골드로즈사우나 | katalk detail에서 open-air-bath |
| 대성관 | open-air-bath 태그 |
| 히든베이호텔 | open-air-bath 태그 |

> 수가 많아 **국내만 50건+** 수준. 위 목록은 seed CSV + katalk에서 open-air-bath 태그 또는 노천탕 언급이 확인된 전체.

---

## 3. 24시간 사우나 (24시 컬럼 = Y) — 13건

| 시설명 | 근거 |
|--------|------|
| 24시인아사우나 | seed CSV 24시=Y |
| 24시사우나 네이버한방스파 | seed CSV 24시=Y |
| 더파크 스파랜드 | seed CSV 24시=Y |
| 도봉산 24시 불한증막 | seed CSV 24시=Y |
| 동양사우나 | seed CSV 24시=Y |
| 라성보석사우나 | seed CSV 24시=Y |
| 베뉴지아쿠아24 | seed CSV 24시=Y |
| 석천24시사우나 | seed CSV 24시=Y |
| 스파디움24 | seed CSV 24시=Y |
| 스파렉스 동묘 | seed CSV 24시=Y |
| 옥정스파24시사우나 | seed CSV 24시=Y |
| 클럽케이서울 | seed CSV 24시=Y |
| 황금스파 | seed CSV 24시=Y |
| 힐스파 | seed CSV 24시=Y |
| 홍삼스파 | katalk: "홍삼은 24시간" (seed에 Y 미기록) |
| 프리마스파 | katalk: "두곳다 24시간이라" (seed에 Y 미기록 — 남자만 24시간) |

**seed CSV 기준 확실**: 14건 (힐스파 포함)
**katalk 언급 포함**: +홍삼스파, 프리마스파(남성만) = 16건

---

## 4. 세신 맛집 (scrub 태그 또는 세신 언급) — 30건

| 시설명 | 근거 |
|--------|------|
| AIRE Ancient Baths Barcelona | scrub 태그 |
| Bathhouse Williamsburg | scrub 태그 |
| Friedrichsbad Baden-Baden | scrub 태그 |
| TREATMENT SAUNA STEAMS | scrub 태그 |
| 강변스파랜드 | scrub 태그 |
| 골드로즈사우나 | scrub 태그 |
| 금천파크온천호텔 | scrub 태그 |
| 계룡스파텔대온천탕 | scrub 태그 |
| 단오풍정 | scrub 태그 / 1인 세신샵 |
| 대영온천 | scrub 태그 |
| 루하스사우나 | scrub 태그 |
| 매일온천 | scrub 태그 |
| 백제불한증막 인삼사우나 | scrub 태그 |
| 베뉴지아쿠아24 | scrub 태그 |
| 보리여성불한증막 | scrub 태그 |
| 산방산 탄산온천 | scrub 태그 |
| 서울신라호텔 | scrub 태그 |
| 성수탕 | scrub 태그 |
| 송도해수온천 송해온 | scrub 태그 |
| 숲속한방랜드 | scrub 태그 |
| 스파렉스 동묘 | scrub 태그 |
| 아쿠아필드 고양 | scrub 태그 |
| 영빈호텔사우나 | scrub 태그 |
| 옥정스파24시사우나 | scrub 태그 |
| 웨스틴 조선 서울 | scrub 태그 / "온기 세신 브랜드 운영" |
| 조선 팰리스 서울 강남 | katalk: "5성 호텔 사우나인데 세신 서비스" |
| 프리마스파 | scrub 태그 |
| 풍림24시불가마사우나 | scrub 태그 |
| 할매탕 | scrub 태그 / "세신 완벽" |
| 혜우사우나 | scrub 태그 |
| 허심청 | scrub 태그 |
| 황금스파 | scrub 태그 |
| 휘경인삼사우나 | scrub 태그 / "세신사 관리 좋음" |
| 레몬사우나 | scrub 태그 |
| 힐스파 | scrub 태그 |
| 한별불가마사우나 | katalk: "남자 세신 맘놓고 추천" (seed에 scrub 미기록) |
| 블루스파 | scrub 태그 |
| 삼호궁전 | katalk detail: scrub 태그 |
| 선수촌사우나 | katalk detail: scrub 태그 |
| 상암불꽃 | katalk detail: scrub 태그 |
| 더 리버사이드 호텔 더 메디스파 | scrub 태그 |
| 스파디움24 | scrub 태그 |
| 청춘목욕탕 | katalk detail: scrub 태그 |

> seed + katalk detail 합산 **약 40건** (중복 제거)

---

## 5. 동네 목욕탕 감성 (small-bath 또는 public-bath + 로컬 분위기) — 25건+ (small-bath)

### small-bath 타입 (확실한 동네 목욕탕) — 25건

| 시설명 | 소재지 |
|--------|--------|
| 갈곶목욕탕 | 경기 오산 |
| 강남목욕탕 | 천안 |
| 거북목욕탕 | 청주 |
| 금샘탕 | 부산 |
| 난곡목욕탕 | 서울 관악 |
| 녹천탕 | 부산 동래 |
| 도산원탕 | 안동 |
| 동방온천사우나 | 부산 동래 |
| 레몬사우나 | 서울 광진 |
| 만수탕 | 부산 사하 |
| 매일온천 | 서울 광진 |
| 봉개사우나 | 제주 |
| 성수탕 | 서울 성동 |
| 수정사우나 | 서울 서초 |
| 영진목욕탕사우나 | 서울 양천 |
| 우영탕 | 서울 강북 |
| 원성탕 | 천안 |
| 유림탕쑥사우나 | 부산 동래 |
| 유진사우나 | 서울 서대문 |
| 일죽목욕탕 | 경기 안성 |
| 주신사우나 | 서울 중구 |
| 천호목욕탕 | 서울 마포 |
| 청춘목욕탕 | 성남 분당 |
| 한신옥사우나 | 서울 성동 |
| 현대그린사우나 | 경기 광주 |

### 로컬 분위기 public-bath 보조 후보
- 쉐레이: "궁극의 동네목욕탕"
- 영빈호텔사우나: "로컬 사우나 근본 느낌"
- 동양사우나: "크고 귀여워! 동네 대중탕"
- 현대월드대중사우나: "목욕비 5천원의 행복"

---

## 6. 온천수/자연수 특화 (온천, 유황, 탄산, 암반수, 해수 등) — 30건+

| 시설명 | 수질 종류 | 근거 |
|--------|-----------|------|
| 우리유황온천 | 유황 온천수 | 시설명 + katalk "온천인데" |
| 제일유황온천 | 유황 | 시설명 |
| 유성온천대온탕 | 온천수 | 대전 유성 온천 |
| 유성온천불가마사우나 | 온천수 | 대전 유성 온천 |
| 유성온천사이언스 | 온천수 | 대전 유성 온천 |
| 능암탄산온천 | 천연 탄산 | 시설명 + katalk "천연 탄산온천" |
| 산방산 탄산온천 | 탄산 온천 | 시설명 |
| 초정약수원탕 | 탄산약수 | "차가운 탄산온천은 몸과 정신이 번쩍" |
| 율암온천 | 온천수 | "온천수는 율암이 더 부드러운" |
| 월문온천휴양지 | 온천수 | 시설명 |
| 간월산온천 | 온천수 | 시설명 |
| 금진온천 (호텔탑스텐) | 온천 / 미네랄 | katalk "미네랄 온천수" |
| 국제광천수온천 | 광천수 | "진 온천이라 매우 청결" "히노끼 냄새" |
| 덕구온천스파월드 | 자연용출온천 | 메모: "자연용출온천" |
| 설해원 온천사우나 | 온천수 | 시설명 |
| 신북온천 리조트 | 온천수 | 시설명 |
| 온양관광호텔 | 온양 온천수 | "역시 온양온천! 온천수와 노천탕" |
| 온양온천랜드 | 온양 온천수 | 시설명 |
| 척산온천휴양촌 | 온천수 | katalk "강원 온천 추천 세트" |
| 필례 게르마늄 온천 | 게르마늄 온천 | 시설명 |
| 안동학가산온천 | 온천수 | 시설명 |
| 소노벨청송 솔샘온천 | 온천수 | 시설명 |
| 청송 솔기온천 | 온천수 | 시설명 |
| 수안보파크호텔 | 수안보 온천수 | 시설명 |
| 해미안녹차해수사우나 | 해수 | "해수라서 좋음" |
| 송도해수온천 송해온 | 고농도 해수 온천수 | "고농도 해수 온천수" |
| 대영온천 | 해수+민물 | "해수+민물 조합" |
| 김녕용암해수사우나 | 해수 | 시설명 |
| 스플라스 온천 워터파크 | 덕산 온천수 | 시설명 |
| 석정온천휴스파 | 온천수 | 시설명 |
| 오레브핫스프링앤스파 | 온천수 | 시설명 |
| 아라고나이트 고온천 | 아라고나이트 온천수 | katalk "디아넥스 아라고나이트 고온천" |
| 봉일스파랜드 | 수질 좋음 | "수질 하나만 보고 가기엔 충분한 가치" |
| 해피황토사우나 | 지하 암반수 | katalk "냉수탕 지하암반수" |
| 쉐레이 | 암반수 | "암반수 냉탕 수질 쵝오" |
| 금천파크온천호텔 | 온천 | 부산 동래 온천 |
| 허심청 | 동래 온천수 | 부산 동래 온천 |
| 녹천탕 | 동래 온천수 | 부산 동래 온천 |
| 동래 반도 온천 | 동래 온천수 | 시설명 |
| 계룡스파텔대온천탕 | 유성 온천수 | 시설명 |
| 이천 테르메덴 | 온천수 | 시설명 |
| 한화리조트 산정호수 온천 | 온천수 | "온천물은 완전 최고!" |

> **약 40건** — 온천/유황/탄산/해수/암반수 키워드 기준

---

## 7. 타투프렌들리 (tattoo-friendly 태그) — 다수 (180건+)

대부분의 시설이 `tattoo-friendly` 태그를 보유. 아래는 **명시적으로 tattoo-friendly가 핵심 차별점**인 곳만 선별:

### 일본 (tattoo-friendly가 특별한 의미)
| 시설명 | 근거 |
|--------|------|
| Nukatoyuge | tattoo-friendly 태그 |
| Sauna Tokyo | tattoo-friendly 태그 |
| TOTOPA | tattoo-friendly 태그 |
| CYCL | tattoo-friendly 태그 |
| BOTANICAL POOL CLUB | tattoo-friendly 태그 |
| Hiki stargazing sauna | tattoo-friendly 태그 |
| Hotta-yu sento | tattoo-friendly 태그 |
| KIWAMI SAUNA Osu | tattoo-friendly 태그 |
| Kumeya Omihachiman | tattoo-friendly 태그 |
| Jungle Photo Land | tattoo-friendly 태그 |
| Shibuya Saunas | tattoo-friendly 태그 |
| Osaka Sauna DESSE | tattoo-friendly 태그 |
| The Sauna | tattoo-friendly 태그 |
| TSUKAHARA KARAFURO | tattoo-friendly 태그 |
| Shiriuchi Onsen | tattoo-friendly 태그 |

### 한국 (타투 정책이 커뮤니티에서 화제)
| 시설명 | 근거 |
|--------|------|
| 더메디스파 (더 리버사이드) | katalk: "프리마 대비 타투 가능이 차별점" |

> 참고: 프리마스파는 seed에 tattoo-friendly 태그 있으나, katalk에서 "문신 금지 정책 강화 중" 언급 — **주의 필요**

> **NOTE**: 한국 시설 대부분이 tattoo-friendly 태그를 가지고 있어 (180건+), 큐레이션 리스트로는 **일본 타투프렌들리 사우나** 또는 **타투 정책이 유의미한 곳**으로 좁히는 것이 가치 있음.

---

## 8. 도쿄 사우나 BEST — 8건

| 시설명 | 위치 | 근거 |
|--------|------|------|
| Sauna Tokyo | 아카사카, 미나토구 | 사우나슐렝 2025 2위 / 명예의 전당 |
| TOTOPA Toritsu Meiji Koen | 신주쿠구 | 사우나슐렝 2025 5위 / 2024 1위 |
| Janu Tokyo | 아자부다이, 미나토구 | 사우나슐렝 2025 9위 |
| Shibuya Saunas | 시부야구 | 사우나슐렝 2023 6위 / 타임아웃 도쿄 BEST |
| Shinagawa Sauna | 시나가와구 오이 | 사우나슐렝 2024 11위 |
| TREATMENT SAUNA STEAMS | 아카사카, 미나토구 | 사우나슐렝 2024 3위 (여성전용) |
| Hotta-yu sento | 아다치구 | 타임아웃 도쿄 BEST 추천 |
| sauna kolme kyla | 오카야마 (도쿄 아님!) | ~~사우나슐렝 8위~~ — 도쿄 아님, 제외 |

**도쿄 소재 확정: 7건**

---

## 9. 밥이 맛있는 사우나 (food 태그 또는 음식 언급) — 50건+

### food 태그 보유 시설 (seed CSV 기준)

| 시설명 | 추가 근거 |
|--------|-----------|
| 24시인아사우나 | food 태그 |
| Bathhouse Williamsburg | food 태그 |
| BOTANICAL POOL CLUB | food 태그 |
| Elamus Spa | food 태그 |
| Kannojigoku Hotel | food 태그 |
| Mifuneyama Rakuen Hotel | food 태그 |
| Noboribetsu Grand Hotel | food 태그 |
| sauna kolme kyla | food 태그 |
| SAUNA SAKURADO | food 태그 |
| SKY SPA Yokohama | food 태그 |
| Therme Erding | food 태그 |
| Wellbe Sakae | food 태그 |
| Yulax | food 태그 |
| Yuyado Daiichi | food 태그 |
| Taikou-no-Yu | food 태그 |
| Aomoriya by Hoshino Resorts | food 태그 |
| Bettei Senjyuan | food 태그 |
| Kitakobushi Shiretoko | food 태그 |
| Spa Metsa Sendai | food 태그 |
| 강변스파랜드 | food 태그 |
| 금샘탕 | food 태그 |
| 군불로 | food 태그 |
| 네이처스파 | food 태그 |
| 더파크 스파랜드 | food 태그 |
| 도미인 EXPRESS 인사동 | food 태그 (야식 라멘) |
| 동양사우나 | food 태그 |
| 라성보석사우나 | food 태그 |
| 매일온천 | food → seed에 없으나 로컬 식당 |
| 메가스파사우나 | food 태그 |
| 백제불한증막 인삼사우나 | food 태그 |
| 베뉴지아쿠아24 | food 태그 |
| 봉개사우나 | food 태그 |
| 봉일스파랜드 | food 태그 |
| 산방산 탄산온천 | food 태그 |
| 센텀 스파랜드 | food 태그 |
| 숲속한방랜드 | food 태그 / "먹는 재미로 가는" |
| 실로암사우나 | food 태그 / "진우식당 백반 무조건" |
| 우리유황온천 | food 태그 |
| 율암온천 | food 태그 |
| 장흥 참숯가마 | food 태그 |
| 통도참숯가마 | food 태그 |
| 태화강참숯가마 | food 태그 |
| 쉐레이 | food 태그 |
| 쉐르빌사우나 | food 태그 |
| 오라카이 청계산 | katalk detail food 태그 |
| 프리마스파 | food 태그 |
| 하이디하우스 | food 태그 |
| 해미안 | food 태그 |
| 홍삼스파 | food 태그 / "근처 최고야짬뽕 맛있습니다" |
| 황금스파 | food 태그 |
| 힐스파 | food 태그 |
| 해미안녹차해수사우나 | food 태그 |
| 휘경인삼사우나 | food 태그 |
| 클럽디오아시스 | food 태그 |
| 클럽케이서울 | food 태그 |
| 골드로즈사우나 | food 태그 |
| 더 리버사이드 호텔 더 메디스파 | food 태그 |
| 석천24시사우나 | food 태그 |
| 아라고나이트 고온천 | katalk: 가족추천, 수영장+사우나 |
| 나무향기 한증막 | food 태그 |
| 덕구온천스파월드 | food 태그 |

### 음식이 특별히 언급된 곳 (큐레이션 가치 높음)
- **실로암사우나**: "진우식당 백반 무조건"
- **숲속한방랜드**: "먹는 재미로 가는 체험형 찜질 공간"
- **도미인**: 야식 라멘 서비스
- **홍삼스파**: 근처 맛집 언급
- **허심청**: katalk "농심호텔1층 뷔페 추천"
- **로데오스파**: katalk "먹거리 다양"

> food 태그 보유 시설이 **60건+**로 매우 많음. 큐레이션은 **"밥 자체가 유명한 곳"**으로 좁혀야 실용적.

---

## 테마별 건수 요약

| # | 테마 | 건수 | 비고 |
|---|------|------|------|
| 1 | 냉탕이 미친 사우나 | 8~13 | 14도 이하 엄격 8건 / 15도 포함 13건 |
| 2 | 노천탕 있는 곳 | 50+ | open-air-bath 태그 기준 |
| 3 | 24시간 사우나 | 14~16 | seed CSV Y 기준 14건 + katalk 2건 |
| 4 | 세신 맛집 | 40+ | scrub 태그 + katalk 세신 언급 |
| 5 | 동네 목욕탕 감성 | 25+ | small-bath 타입 25건 + 로컬 분위기 4건 |
| 6 | 온천수/자연수 특화 | 40+ | 온천/유황/탄산/해수/암반수 |
| 7 | 타투프렌들리 | 180+ (전체) / 15 (일본) | 한국 대부분 해당 → 일본 중심 큐레이션 권장 |
| 8 | 도쿄 사우나 BEST | 7 | 도쿄 소재 확정 |
| 9 | 밥이 맛있는 사우나 | 60+ | food 태그 기준 → 음식 유명한 곳으로 좁히기 권장 |

---

## Decision Points (확인 필요)

1. **냉탕 기준선**: 14도 이하 vs 15도 포함?
2. **타투프렌들리**: 한국 시설 대부분 해당 — 일본 한정 or 전체?
3. **밥이 맛있는 사우나**: food 태그 전체(60+) vs 음식이 실제 유명한 곳만 선별?
4. **노천탕**: 50건+ 넘음 — 전체 or "노천탕이 특히 뛰어난 곳"으로 좁힐지?
5. **프리마스파 tattoo 정책**: seed에는 tattoo-friendly, katalk에서는 "금지 강화" — 어느 쪽?
