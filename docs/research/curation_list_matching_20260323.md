# 큐레이션 리스트 테마별 시설 매칭 — 딥 분석

> 소스: katalk-facility-detail-v2.csv, katalk-facility-analysis.md, katalk-tag-review.csv, seed-data-final-db-state.csv
> 작성일: 2026-03-23
> 방법: 9개 테마별 키워드 매칭 → 전후 문맥 확인 → 시설 식별 → DB 교차검증

---

## 1. 냉탕이 미친 사우나

키워드: 냉탕, 냉수, 차가운, 14도, 15도, 16도, 얼음, cold

| 시설명 | 소스 | 근거 인용 | DB 등록 | 신뢰도 |
|--------|------|-----------|---------|--------|
| 강변스파랜드 | katalk detail | "여탕 냉탕은 5도까지는 아니었지만 정말 차가웠습니다" + seed 메모 "급냉탕 5도" | Yes | HIGH |
| 우이령불가마 | katalk detail | "냉탕 온도가 무려 11도입니다 11도….!!!! → 재방문의사: 냉탕때문에 올수도있겠다" | Yes | HIGH |
| 프라임노다지사우나 | seed DB | 냉탕=12도 (seed CSV) | Yes | HIGH |
| 프리마스파 | katalk detail | 냉탕온도 13도 기록 (katalk), seed에는 17도 → 시기별 변동 | Yes | HIGH |
| 난곡목욕탕 | seed DB | 냉탕=9도 (seed CSV) | Yes | HIGH |
| 마포365구민센터 | seed DB | 냉탕=10도 (seed CSV) | Yes | HIGH |
| 할매탕 | seed DB | 냉탕=10도 (seed CSV) | Yes | HIGH |
| 관악24시불가마사우나 | seed DB | 냉탕=14도 (seed CSV) | Yes | HIGH |
| 더메디스파 | katalk detail | "냉탕온도(16도)로 생각보다 즐겁게 루틴 \| 이전 냉탕온도(22-23도) 높았음" | Yes | MEDIUM |
| 레몬사우나 | katalk detail | 냉탕=15도 기록 (경계선) | Yes | MEDIUM |
| 금정산부곡온천 | seed DB | 냉탕=15도 (seed CSV) | Yes | MEDIUM |
| 강남목욕탕 (천안) | seed DB | 냉탕=15도 (seed CSV) | Yes | MEDIUM |
| 아쿠아필드 안성 | seed DB | 냉탕=15도 (seed CSV) | Yes | MEDIUM |
| SATOYAMA TERRACE | seed DB | 냉탕=15도 (seed CSV) | Yes | MEDIUM |
| 황금스파 | seed DB | 냉탕=16도 (seed CSV) | Yes | LOW |
| 율암온천 | seed DB | 냉탕=16도 (seed CSV) | Yes | LOW |
| 로데오 스파 | seed DB | 냉탕=16도 (seed CSV) | Yes | LOW |
| 덕구온천스파월드 | seed DB + katalk | 냉탕=16도 seed, katalk: "냉탕온도가 아쉬웠고" (부정적) | Yes | LOW |

**엄격 기준 (14도 이하)**: 강변스파랜드(5도 언급), 난곡(9), 마포365(10), 할매탕(10), 우이령(11), 프라임노다지(12), 프리마(13), 관악24시(14) = **8건**

---

## 2. 노천탕 있는 곳

키워드: 노천, 노천탕, 야외, 외기욕, open-air, 옥상

| 시설명 | 소스 | 근거 인용 | DB 등록 | 신뢰도 |
|--------|------|-----------|---------|--------|
| 설해원 | katalk analysis + detail | "노천탕 42도" / "노천탕 3:00-3:30 물갈이 → 3:30 맞춰 가면 새 물" / open-air-bath 태그 | Yes | HIGH |
| 금천파크 | katalk detail | "여긴 다 모르겠고 노천탕에서 바라보는 설산뷰는 인생 최고 뷰였습니다" | Yes | HIGH |
| 프리마스파 | katalk analysis + detail | "노천탕 있음 (여성 노천탕은 폐지됨)" / open-air-bath 태그 | Yes | HIGH |
| 신북온천 | katalk detail | "노천탕은 크지는 않지만 공기가 좋고 쾌적한 분위기" / open-air-bath 태그 | Yes | HIGH |
| 허심청 | katalk detail + seed | open-air-bath 태그 / outdoor-rest 태그 | Yes | HIGH |
| 파크로쉬 | katalk detail | open-air-bath 태그 / "한국에서 제일 좋았던 곳" | Yes | HIGH |
| 하이디하우스 | katalk detail | 노천탕온도=38도 기록 / open-air-bath 태그 | Yes | HIGH |
| 덕구온천 | katalk detail | 노천탕온도=42도 기록 / open-air-bath 태그 | Yes | HIGH |
| 산방산 탄산온천 | katalk detail | open-air-bath 태그 / "제주 바람 맞으면서 힐링 가능" | Yes | HIGH |
| 해미안 | katalk detail | open-air-bath 태그 / "노천탕이 좀 더럽습니다" (부정적 주의) | Yes | MEDIUM |
| 소노캄 | katalk detail | open-air-bath 태그 | Yes | HIGH |
| 네이처스파 | katalk detail | open-air-bath 태그 | Yes | HIGH |
| 율암온천 | seed DB | open-air-bath 태그 | Yes | HIGH |
| 아난티 | katalk detail | open-air-bath 태그 | Yes | HIGH |
| 월문온천 | katalk detail | open-air-bath 태그 | Yes | HIGH |
| 클럽케이 | katalk detail | "노천탕있는 아파트" 언급 / open-air-bath 태그 (seed) | Yes | MEDIUM |
| 스파디움 | katalk detail | open-air-bath 태그 | Yes | HIGH |
| 더앤온천 | katalk detail | open-air-bath 태그 | Yes | HIGH |
| 오라카이 | katalk detail | open-air-bath 태그 | Yes | HIGH |
| 힐스파 | katalk detail + seed | open-air-bath 태그 | Yes | HIGH |
| 골드로즈 | katalk detail | open-air-bath 태그 | Yes | MEDIUM |
| 제일유황 | katalk detail | open-air-bath 태그 | Yes | HIGH |
| 황금스파 | katalk detail | open-air-bath 태그 | Yes | HIGH |
| 아라고나이트 고온천 | katalk 원본 3건 | "디아넥스 아라고나이트 고온천 추천. 수영장+노천탕 깔끔" / "당일예약 안됨" | Yes | HIGH |

**katalk에서 노천탕 품질 언급이 있는 BEST 후보**: 설해원, 금천파크, 프리마스파, 신북온천, 산방산, 파크로쉬, 하이디하우스, 덕구온천

> 전체 50건+ — 위는 katalk에서 노천탕 관련 직접 언급이 있는 곳 위주로 선별

---

## 3. 24시간 사우나

키워드: 24시, 새벽, 야간, 밤새

| 시설명 | 소스 | 근거 인용 | DB 등록 | 신뢰도 |
|--------|------|-----------|---------|--------|
| 24시인아사우나 | seed DB | 24시=Y | Yes | HIGH |
| 24시사우나 네이버한방스파 | seed DB | 24시=Y / "장작향 찜질방이 있는 어머님 감성 24시 사우나" | Yes | HIGH |
| 더파크 스파랜드 | seed DB | 24시=Y | Yes | HIGH |
| 도봉산 24시 불한증막 | seed DB | 24시=Y | Yes | HIGH |
| 동양사우나 | seed DB | 24시=Y | Yes | HIGH |
| 라성보석사우나 | seed DB | 24시=Y | Yes | HIGH |
| 베뉴지아쿠아24 | seed DB | 24시=Y | Yes | HIGH |
| 석천24시사우나 | seed DB | 24시=Y | Yes | HIGH |
| 스파디움24 | seed DB | 24시=Y | Yes | HIGH |
| 스파렉스 동묘 | seed DB | 24시=Y | Yes | HIGH |
| 옥정스파24시사우나 | seed DB | 24시=Y | Yes | HIGH |
| 클럽케이서울 | seed DB | 24시=Y | Yes | HIGH |
| 황금스파 | seed DB | 24시=Y | Yes | HIGH |
| 힐스파 | seed DB | 24시=Y / "24시 찜질방도 운영하여 1박2일로도 온천과 찜질을 즐길 수 있는곳" | Yes | HIGH |
| 홍삼스파 | katalk detail | "홍삼은 24시간" (seed에 Y 미기록) | Yes | MEDIUM |
| 프리마스파 | katalk detail | "두곳다 24시간이라 시간제약없이갈수있어서 좋아요!" (남성만 24시간) | Yes | MEDIUM |
| 풍림24시불가마사우나 | seed DB | 시설명에 24시 포함 (seed에 Y 미기록 — 확인 필요) | Yes | MEDIUM |
| 관악24시불가마사우나 | seed DB | 시설명에 24시 미포함이나 seed에 기록 없음 — katalk 미언급 | Yes | LOW |

**seed CSV 기준 확실 14건 + katalk 언급 2건 = 16건**

---

## 4. 세신 맛집

키워드: 세신, 때밀이, scrub, 이모

| 시설명 | 소스 | 근거 인용 | DB 등록 | 신뢰도 |
|--------|------|-----------|---------|--------|
| 한별불가마사우나 | katalk analysis | "남자 세신 맘놓고 추천" / "세신과 마사지 모두 너무 좋았습니다" | Yes | HIGH |
| 웨스틴 조선 서울 | katalk detail + seed | scrub 태그 / "온기 세신 브랜드 운영" / "얼음미스트샤워를 샤악 한 후 냉탕 들어가서 아 진짜 세상 별거없다 너무 행복하다" | Yes | HIGH |
| 조선 팰리스 서울 강남 | katalk detail | "5성 호텔 사우나인데 세신 서비스가 있는게 조선 다웠고, 고급스럽고 한가했으나" | Yes | HIGH |
| 할매탕 | seed DB | scrub 태그 / "세신 완벽" | Yes | HIGH |
| 휘경인삼사우나 | seed DB | scrub 태그 / "세신사 관리 좋음" | Yes | HIGH |
| 레몬사우나 | katalk detail | scrub 태그 / "세신 침대가 두개가 있는데 하나는 거의 사용 안 하셔서" | Yes | MEDIUM |
| 단오풍정 | seed DB | scrub 태그 / "한옥 카페보다 예쁜 세신샵" (1인 세신 전문) | Yes | HIGH |
| 프리마스파 | katalk detail + seed | scrub 태그 / 세신가격=60,000원 | Yes | HIGH |
| 실로암사우나 | katalk detail | scrub 태그 | Yes | MEDIUM |
| 삼호궁전 | katalk detail | scrub 태그 / "급냉탕도 있더라구요" | Yes | MEDIUM |
| 선수촌사우나 | katalk detail | scrub 태그 | Yes | MEDIUM |
| 상암불꽃 | katalk detail | scrub 태그 | Yes | LOW |
| 블루스파 | katalk detail | scrub 태그 | Yes | LOW |
| 청춘목욕탕 | katalk detail | scrub 태그 | Yes | MEDIUM |
| 덕구온천 | katalk detail | scrub 태그 | Yes | MEDIUM |
| 쉐레이 | katalk detail | scrub 태그 | Yes | MEDIUM |
| 스파디움24 | katalk detail + seed | scrub 태그 / 세신가격=13,000원 | Yes | MEDIUM |
| 허심청 | seed DB | scrub 태그 | Yes | MEDIUM |
| 서울신라호텔 | seed DB | scrub 태그 | Yes | MEDIUM |
| 안토사우나 | katalk detail | scrub 태그 | Yes | MEDIUM |

**세신이 직접적으로 극찬된 BEST 후보**: 한별불가마(맘놓고추천), 웨스틴조선(온기브랜드), 조선팰리스(5성세신), 할매탕(세신완벽), 단오풍정(전문세신), 프리마(고가세신), 휘경인삼(세신사관리좋음)

---

## 5. 동네 목욕탕 감성

키워드: 동네, 목욕탕, 로컬, 단골, 소규모, 리뉴얼

| 시설명 | 소스 | 근거 인용 | DB 등록 | 신뢰도 |
|--------|------|-----------|---------|--------|
| 청춘목욕탕 | katalk analysis + detail | "동네 목욕탕인데 공사하고 새로 오픈한지 얼마안되서 겁~나 깨끗해요. 쥔장님 몹시도 친절" / "서울에 이런 곳 생기면 온몸으로 치대면서 다닐 거" / 32회 언급 | Yes | HIGH |
| 레몬사우나 | katalk detail | "리뉴얼한 동네 목욕탕의 정석" / "온탕에 진짜 레몬이 둥둥 떠 있는 레몬온탕이 귀여운곳" | Yes | HIGH |
| 갈곶목욕탕 | katalk analysis | "정착은 갈곶으로 했어요" / "전통 동네 목욕탕" | Yes | HIGH |
| 로데오스파 | katalk analysis | "깔끔한 동네 목욕탕 느낌, 먹거리 다양" | Yes | HIGH |
| 쉐레이 | seed DB | "궁극의 동네목욕탕" / katalk: "작은 규모지만 관리가 잘 되는 느낌" | Yes | HIGH |
| 영빈호텔사우나 | seed DB | "로컬 사우나 근본 느낌" | Yes | HIGH |
| 동양사우나 | seed DB | "크고 귀여워! 만 원에 목욕+찜질까지 할 수 있는 너그러운 동네 대중탕" | Yes | HIGH |
| 현대월드대중사우나 | seed DB | "목욕비 5천원의 행복! 시설, 위치, 분위기 모두 중상급의 대중목욕탕" | Yes | HIGH |
| 골드로즈 | katalk detail | "롯데사우나/ 관리 잘 안됩니다 로컬목욕탕 그 자체" | Yes | MEDIUM |
| 난곡목욕탕 | seed DB | "국가에서 보존해 줘야 하는 세월이 멈춘 온기의 공간" (small-bath) | Yes | HIGH |
| 영진목욕탕사우나 | seed DB | "사라지지 않았으면 좋겠는 귀엽고 깨끗하고 따뜻한 동네 목욕탕" (small-bath) | Yes | HIGH |
| 현대그린사우나 | seed DB | "동네분들의 애정이 느껴지는 작은 로컬 목욕탕!" (small-bath) | Yes | HIGH |
| 거북목욕탕 | seed DB | "목욕탕의 존재이유에 대해서 다시 생각하게 된 거북탕" (small-bath) | Yes | HIGH |
| 성수탕 | seed DB | "레트로 사우나를 즐기고 싶다면 성수탕으로 오세요~" (small-bath) | Yes | MEDIUM |
| 매일온천 | seed DB | "흔한 동네 목욕탕" (small-bath) | Yes | MEDIUM |
| 한신옥사우나 | seed DB | "시설은 오래되었어도 갖출건 갖춘 곳" (small-bath) | Yes | MEDIUM |
| 더파크스파랜드 | katalk detail | "대부분 목욕탕이 청결부분이 좀 그렇더라구요 찾다가 목동 더파크스파랜드 갔었는데" | Yes | LOW |
| 해피황토사우나 | katalk analysis | "시설 관리 잘 됨" | Yes | MEDIUM |

**커뮤니티에서 "동네 감성"이 직접 극찬된 BEST**: 청춘목욕탕, 레몬사우나, 갈곶목욕탕, 쉐레이, 영빈호텔, 난곡목욕탕, 영진목욕탕

> small-bath 타입 전체 25건은 모두 동네 목욕탕 후보. 위는 katalk/seed에서 감성이 직접 언급된 곳 위주.

---

## 6. 온천수/자연수 특화

키워드: 온천, 유황, 탄산, 암반수, 용천, 해수, mineral

| 시설명 | 소스 | 근거 인용 | DB 등록 | 신뢰도 |
|--------|------|-----------|---------|--------|
| 우리유황온천 | katalk analysis + detail | "유황 온천수" / "물ㅇ 미끌미끌하니 조아서 10회권 끊었어요" / "온천인데~" | Yes | HIGH |
| 능암탄산온천 | katalk analysis + detail | "천연 탄산온천" / "같은 금액에 사용가능시간 차감되는 형식에 바람세기도 강해서 좋았습니다" | Yes | HIGH |
| 산방산 탄산온천 | katalk detail | "어제 산방산 탄산 온천 다녀왔는데 너무 좋았어요" | Yes | HIGH |
| 국제광천수온천 | katalk detail | "진 온천이라 매우 청결했으며 특히 온천에 입장하면 히노끼 냄새가 기분좋게 코를 찌르는게 기" | Yes | HIGH |
| 금진온천 (호텔탑스텐) | katalk detail | "미네랄 온천수라 그런지 물이 정말 좋습니다. 탕에 몸을 담그고 나오면 피부가 한층 부드러워지고" | Yes | HIGH |
| 율암온천 | katalk detail | "온천수는 율암이 더 부드러운 느낌" / "샤워기 틀면 몸에 닿는 물이 달라서" | Yes | HIGH |
| 해피황토사우나 | katalk analysis | "냉수탕 지하암반수" | Yes | HIGH |
| 쉐레이 | katalk detail | "암반수 냉탕 수질 쵝오~" | Yes | HIGH |
| 초정약수원탕 | seed DB | "차가운 탄산온천은 몸과 정신이 번쩍 살아나게 만든다" | Yes | HIGH |
| 온양관광호텔 | seed DB | "역시 온양온천! 온천수와 노천탕이 이름값 한다" | Yes | HIGH |
| 한화리조트 산정호수 | seed DB | "온천물은 완전 최고!" | Yes | HIGH |
| 덕구온천스파월드 | seed DB | "일부러 찾아가볼만한 가치가 있는 자연용출온천" | Yes | HIGH |
| 설해원 | katalk analysis | 온천사우나 (시설명) | Yes | HIGH |
| 척산온천 | katalk analysis | "강원 온천 추천 세트" | Yes | MEDIUM |
| 필예온천 | katalk analysis | "강원 온천 추천 세트" | Yes | MEDIUM |
| 아라고나이트 고온천 | katalk 원본 | "디아넥스 아라고나이트 고온천 추천" / 수영장+노천탕+사우나 | Yes | HIGH |
| 신북온천 | katalk detail | 온천 (시설명) | Yes | HIGH |
| 해미안녹차해수사우나 | seed DB | "해수라서 좋음" | Yes | MEDIUM |
| 송도해수온천 송해온 | seed DB | "고농도 해수 온천수" | Yes | HIGH |
| 대영온천 | seed DB | "해수+민물 조합" | Yes | MEDIUM |
| 김녕용암해수사우나 | seed DB | 제주 해수 (시설명) | Yes | LOW |
| 제일유황온천 | seed DB | 유황 (시설명) | Yes | MEDIUM |
| 유성온천대온탕 | seed DB | "대전의 터줏대감 온천이 오랜 시간 위엄을 지켜온 이유" | Yes | HIGH |
| 유성온천불가마사우나 | seed DB | 유성 온천수 | Yes | MEDIUM |
| 봉일스파랜드 | seed DB | "수질 하나만 보고 가기엔 충분한 가치" | Yes | MEDIUM |
| 허심청 | katalk detail | "수질도 매끈하고요" / 부산 동래 온천 지역 | Yes | HIGH |
| 녹천탕 | seed DB | 부산 동래 온천 / "항상 흘러넘치는 물과 사람들 속에서 본질을 지켜온 부산의 원조 온천탕" | Yes | HIGH |

**수질이 직접 극찬된 BEST 후보**: 우리유황(유황+미끌), 국제광천수(히노끼), 금진온천(미네랄), 율암(부드러운물), 쉐레이(암반수쵝오), 초정약수원탕(탄산), 덕구온천(자연용출)

---

## 7. 타투프렌들리

키워드: 타투, 문신, tattoo, 커버

| 시설명 | 소스 | 근거 인용 | DB 등록 | 신뢰도 |
|--------|------|-----------|---------|--------|
| 더메디스파 | katalk analysis + detail | "타투 프렌들리로 언급" / "프리마 대비 타투 가능이 차별점" / tattoo-friendly 태그 | Yes | HIGH |
| 율암온천 | katalk detail | tattoo-friendly 태그 (한국 온천 중 명시) | Yes | HIGH |

### 일본 — tattoo-friendly가 특별한 의미를 가지는 시장

| 시설명 | 소스 | 근거 인용 | DB 등록 | 신뢰도 |
|--------|------|-----------|---------|--------|
| Sauna Tokyo | seed DB | tattoo-friendly 태그 | Yes | HIGH |
| TOTOPA | seed DB | tattoo-friendly 태그 | Yes | HIGH |
| Shibuya Saunas | seed DB | tattoo-friendly 태그 | Yes | HIGH |
| CYCL | seed DB | tattoo-friendly 태그 | Yes | HIGH |
| BOTANICAL POOL CLUB | seed DB | tattoo-friendly 태그 | Yes | HIGH |
| Hiki stargazing sauna | seed DB | tattoo-friendly 태그 | Yes | HIGH |
| Hotta-yu sento | seed DB | tattoo-friendly 태그 | Yes | HIGH |
| KIWAMI SAUNA Osu | seed DB | tattoo-friendly 태그 | Yes | HIGH |
| Kumeya Omihachiman | seed DB | tattoo-friendly 태그 | Yes | HIGH |
| Jungle Photo Land | seed DB | tattoo-friendly 태그 | Yes | HIGH |
| Osaka Sauna DESSE | seed DB | tattoo-friendly 태그 | Yes | HIGH |
| The Sauna | seed DB | tattoo-friendly 태그 | Yes | HIGH |
| Nukatoyuge | seed DB | tattoo-friendly 태그 | Yes | HIGH |
| TSUKAHARA KARAFURO | seed DB | tattoo-friendly 태그 | Yes | HIGH |
| Shiriuchi Onsen | seed DB | tattoo-friendly 태그 | Yes | HIGH |
| TREATMENT SAUNA STEAMS | seed DB | tattoo-friendly 태그 (여성전용) | Yes | HIGH |
| Aomoriya by Hoshino Resorts | seed DB | tattoo-friendly 태그 | Yes | HIGH |

### 주의 사항

| 시설명 | 소스 | 주의 내용 |
|--------|------|-----------|
| 프리마스파 | katalk analysis | seed에 tattoo-friendly 있으나 "문신 금지 정책 강화 중" — **제외 권장** |
| 리버사이드호텔 메디스파 | katalk analysis | "문신 금지 정책 강화 시작" — **제외 권장** |

> NOTE: 한국 시설 대부분(180건+)이 tattoo-friendly 태그 보유. 큐레이션 가치는 **일본 타투프렌들리 사우나** 또는 **타투 정책이 커뮤니티에서 화제가 된 곳**으로 좁히는 것이 실용적.

---

## 8. 도쿄 사우나

키워드: 도쿄, 東京, tokyo, 신주쿠, 시부야, 이케부쿠로, 롯폰기

| 시설명 | 소스 | 근거 인용 | DB 등록 | 신뢰도 |
|--------|------|-----------|---------|--------|
| Sauna Tokyo (사우나도쿄) | katalk analysis + seed | katalk 13회 언급 / "아우프구스 퍼포먼스 (여성 스태프)" / "남자 사우나에 여직원이 들어와서 비히타로 춤을 추고" / 사우나슐렝 2025 2위 | Yes | HIGH |
| TOTOPA Toritsu Meiji Koen | katalk analysis + seed | "디자인이 아주… 다 예쁘네요" / 핀란드 스타일 / 사우나슐렝 2025 5위 / 2024 1위 / 신주쿠구 소재 | Yes | HIGH |
| Shibuya Saunas | seed DB | 시부야구 소재 / 사우나슐렝 2023 6위 / 타임아웃 도쿄 BEST | Yes | HIGH |
| Janu Tokyo | seed DB | 아자부다이 미나토구 소재 / 사우나슐렝 2025 9위 | Yes | HIGH |
| Shinagawa Sauna | seed DB | 시나가와구 소재 / 사우나슐렝 2024 11위 | Yes | HIGH |
| TREATMENT SAUNA STEAMS | seed DB | 아카사카 미나토구 소재 / 사우나슐렝 2024 3위 (여성전용) | Yes | HIGH |
| Hotta-yu sento | seed DB | 아다치구 소재 / 타임아웃 도쿄 BEST 추천 | Yes | HIGH |

**도쿄 소재 확정: 7건** (katalk에서 직접 언급: Sauna Tokyo, TOTOPA)

---

## 9. 밥이 맛있는 사우나

키워드: 밥, 식당, 음식, 맛있, 식사, 먹, 라면, 비빔밥, food

### 음식이 직접 극찬/구체 언급된 곳 (큐레이션 최적)

| 시설명 | 소스 | 근거 인용 | DB 등록 | 신뢰도 |
|--------|------|-----------|---------|--------|
| 실로암사우나 | katalk detail | "사우나앞에 진우식당 백반 무조건" / food 태그 | Yes | HIGH |
| 허심청 | katalk detail | "허심청 가실거면 농심호텔1층 뷔페 추천드립니다" / food 태그 | Yes | HIGH |
| 숲속한방랜드 | seed DB | "목욕보다는 숯가마와 먹는 재미로 가는 체험형 찜질 공간" / food 태그 | Yes | HIGH |
| 도미인 | katalk detail + seed | food 태그 / 야식 라멘 서비스 유명 | Yes | HIGH |
| 홍삼스파 | katalk detail | "건너편에 해물칼국수 기가막힌집이 있었는데 폐업해서… 근처 통일동산쪽에 최고야짬뽕 맛있습니다" | Yes | MEDIUM |
| 로데오스파 | katalk analysis | "먹거리 다양" | Yes | MEDIUM |
| 네이처스파 | katalk detail + seed | food 태그 / 부대 시설 언급 | Yes | LOW |
| 휘경인삼사우나 | seed DB | food 태그 / "인삼 냄새" | Yes | LOW |

### food 태그 보유 시설 (seed DB 기준, 전체)

| 시설명 | 소스 | DB 등록 | 신뢰도 |
|--------|------|---------|--------|
| 24시인아사우나 | seed DB food 태그 | Yes | MEDIUM |
| 강변스파랜드 | seed DB food 태그 | Yes | MEDIUM |
| 금샘탕 | seed DB food 태그 | Yes | MEDIUM |
| 군불로 | seed DB food 태그 | Yes | MEDIUM |
| 더파크 스파랜드 | seed DB food 태그 | Yes | MEDIUM |
| 동양사우나 | seed DB food 태그 | Yes | MEDIUM |
| 라성보석사우나 | seed DB food 태그 | Yes | MEDIUM |
| 메가스파사우나 | seed DB food 태그 | Yes | MEDIUM |
| 백제불한증막 인삼사우나 | seed DB food 태그 | Yes | MEDIUM |
| 베뉴지아쿠아24 | seed DB food 태그 | Yes | MEDIUM |
| 봉개사우나 | seed DB food 태그 | Yes | MEDIUM |
| 봉일스파랜드 | seed DB food 태그 | Yes | MEDIUM |
| 산방산 탄산온천 | seed DB food 태그 | Yes | MEDIUM |
| 센텀 스파랜드 | seed DB food 태그 | Yes | MEDIUM |
| 쉐레이 | seed DB food 태그 | Yes | MEDIUM |
| 쉐르빌사우나 | seed DB food 태그 | Yes | MEDIUM |
| 오라카이 | katalk detail food 태그 | Yes | MEDIUM |
| 우리유황온천 | seed DB food 태그 | Yes | MEDIUM |
| 율암온천 | seed DB food 태그 | Yes | MEDIUM |
| 장흥 참숯가마 | seed DB food 태그 | Yes | MEDIUM |
| 통도참숯가마 | seed DB food 태그 | Yes | MEDIUM |
| 태화강참숯가마 | seed DB food 태그 | Yes | MEDIUM |
| 프리마스파 | seed DB food 태그 | Yes | MEDIUM |
| 하이디하우스 | katalk detail food 태그 | Yes | MEDIUM |
| 해미안 | katalk detail food 태그 | Yes | MEDIUM |
| 황금스파 | seed DB food 태그 | Yes | MEDIUM |
| 힐스파 | seed DB food 태그 | Yes | MEDIUM |
| 해미안녹차해수사우나 | seed DB food 태그 | Yes | MEDIUM |
| 클럽디오아시스 | seed DB food 태그 | Yes | MEDIUM |
| 클럽케이서울 | seed DB food 태그 | Yes | MEDIUM |
| 골드로즈사우나 | seed DB food 태그 | Yes | MEDIUM |
| 석천24시사우나 | seed DB food 태그 | Yes | MEDIUM |
| 핀크스 포도호텔 | seed DB food 태그 | Yes | MEDIUM |
| 나무향기 한증막 | seed DB food 태그 | Yes | MEDIUM |
| 덕구온천스파월드 | seed DB food 태그 | Yes | MEDIUM |
| 마포365구민센터 | seed DB food 태그 | Yes | MEDIUM |

**"밥 자체가 유명"으로 좁힌 BEST 후보**: 실로암(진우식당백반), 허심청(농심뷔페), 숲속한방랜드(먹는재미), 도미인(야식라멘)

> food 태그 보유 시설이 60건+로 매우 많음. 큐레이션 실용성을 위해 "음식이 직접 언급/극찬된 곳"으로 좁히는 것을 권장.

---

## 테마별 요약

| # | 테마 | 총 매칭 | katalk 직접 언급 | DB 등록률 | 큐레이션 BEST 후보 수 |
|---|------|---------|------------------|-----------|----------------------|
| 1 | 냉탕이 미친 사우나 | 18 | 5 (강변, 우이령, 더메디, 프리마, 덕구) | 100% | 8 (14도 이하) |
| 2 | 노천탕 있는 곳 | 50+ | 8 (설해원, 금천파크, 프리마, 신북, 해미안, 파크로쉬, 하이디, 클럽케이) | 100% | 8 |
| 3 | 24시간 사우나 | 16 | 2 (홍삼스파, 프리마) | 100% | 14 (seed Y 확정) |
| 4 | 세신 맛집 | 40+ | 4 (한별불가마, 웨스틴, 조선팰리스, 레몬) | 100% | 7 |
| 5 | 동네 목욕탕 감성 | 29+ | 5 (청춘, 레몬, 갈곶, 로데오, 골드로즈) | 100% | 7 |
| 6 | 온천수/자연수 특화 | 27+ | 7 (우리유황, 능암탄산, 국제광천수, 금진, 율암, 해피황토, 쉐레이) | 100% | 7 |
| 7 | 타투프렌들리 | 180+ (전체) / 19 (선별) | 1 (더메디스파) | 100% | 17 (일본) + 2 (한국) |
| 8 | 도쿄 사우나 | 7 | 2 (사우나도쿄, TOTOPA) | 100% | 7 |
| 9 | 밥이 맛있는 사우나 | 60+ | 4 (실로암, 허심청, 홍삼스파, 로데오) | 100% | 4 |

---

## Decision Points (확인 필요)

1. **냉탕 기준선**: 14도 이하(엄격 8건) vs 15도 포함(13건) vs 16도 포함(18건)?
2. **타투프렌들리**: 한국 시설 대부분 해당 → 일본 한정 or "타투 정책이 화제인 곳"만?
3. **밥이 맛있는 사우나**: food 태그 전체(60+) vs "음식 자체가 유명한 곳"(4건)?
4. **노천탕**: 50건+ → "노천탕이 특히 뛰어난 곳"으로 좁힐지? (설산뷰, 바다뷰 등)
5. **프리마스파 tattoo**: seed=tattoo-friendly, katalk="금지 강화" → 어느 쪽 우선?
6. **프리마스파 24시**: 남성만 24시간 → 리스트에 조건부 포함?
