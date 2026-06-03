# Phase 4 NEW 등록 — 시설별 확정 결정 (2026-06-03)

8건 플래그를 유저와 하나씩 확인하며 확정. 명확 30건은 facilitytype 제안표 기준.
온도 매핑: 건식사우나=sauna_temp(50-130) / 한증막·숯가마·불가마=jjim_temp(70-130, tribe='jimi') / 족욕=필드없음→memo.
가격 필드(라이브 DB 확인): deep_logs `cost`=입장료, `scrub_cost`=세신가격, `scrub_types[]`=세신종류. (※ supabase/*.sql엔 없지만 라이브에 실재 → 라이브 스키마가 정답)

---

## A. 광주 숯가마 → **새광주참숯가마** ✅
- 원문(케빈, 2026-03-07): "고수들만 모이는 숯가마... 숯가마 91·95·138도 + 외기 숯... 3분 삼겹살". 앞 발화 "경광주는 가까운데" → **경기 광주** 확정.
- 정식명 `새광주참숯가마` / 주소 경기 광주시 경충대로 1507-17 / 좌표 37.4025081,127.2678322 (naver) / 카테고리 찜질방
- `facility_type=special`, city=**광주시(경기)** (광주광역시 'Gwangju' 아님 — city버그 교정)
- 어드민 로그: `tribe_id='jimi'`, **`jjim_temp=130`** (유저 지정; 138은 130 cap)
- deep_log memo: "숯가마 91·95·138도 + 외기 숯, 최고 130-140도, 식당(삼겹살)"

## B. 파라곤 → **파라곤스파** ✅
- 원문: "[목동 파라곤] 건식/습식만 있음, 파우더룸 깔끔, 수질관리 굳굳". 열탕48도?(불확실).
- 유저 추가(출처 blog ohhzi/224211816773; 블로그 본문 로드 실패→유저 제공값 사용): 찜질방·주차·24시간·식당·수면실·세신 3만원.
- 정식명 `파라곤스파` / 주소 서울 양천구 목동서로 155 105동 지하6층 / city=Seoul / 좌표 naver(등록시 확보)
- `facility_type=public-bath`, **`is_24h=true`**
- facilities: `dry-sauna, steam-sauna, jjimjilbang, parking, sleep-room, food, scrub`
- 어드민 로그: `has_scrub=true`, **`scrub_cost=30000`**(세신 3만원 — 전용 필드). 온도 없음(열탕48 불확실+범위초과 → omit, 유저 동의).
- deep_log memo: "건식/습식, 찜질방, 주차, 24시간, 식당, 수면실, 수질관리 좋음. 열탕 약48도(불확실, 제외)"

---

## ✅ 라이브 스키마 검증 완료 (2026-06-03, SQL Editor pg_constraint 조회)
온도 CHECK 전부 일치: cold 0-30 / hot 30-46 / sauna(건식) 50-130 / steam(습식) 40-75 / very_hot(열탕) 38-46 / **jjim(한증막) 70-130** / ice(급냉) 0-20.
enum: facility_type 7종 · bath_policy(gender-bath/male-only/female-only/mixed) · coordinate_source(naver/google/manual) · tribe_id(bather/saunner/jimi) · bath_gender 8종 · primary_sauna_kind(null/dry/steam).
→ vt() 범위(enrich-apply)와 등록 매핑 모두 라이브 확정. 컬럼 위치: steam은 logs / very_hot·ice·scrub_cost·scrub_types는 deep_logs / jjim은 logs.
[[reference_live_schema_authoritative]]

## C. 스파앗홈 인천공항 제1터미널점 ✅
- Naver 지도 정식명 `스파앳홈 인천공항 제1터미널점`(앗→앳 철자!) / 인천 중구 공항로 271 / 목욕탕·사우나 / 좌표 37.4496,126.4528 (naver)
- T2(제2터미널대로446, 기존DB 5d9f65bb)와 별개 확인. `facility_type=public-bath`, city=Incheon

## D. 스페이스본휘트니스 · 르네상스휘트니스사우나 → 둘 다 **public-bath** ✅
(유저: gym-sauna 아님. 온탕/냉탕/찜질방/불한증막 갖춘 대중사우나)
- **스페이스본휘트니스**(rec5293, 광화문/종로): sauna(건식)83·steam(습식)53·cold20·hot40·very_hot(열탕)42. facilities: dry-sauna,steam-sauna,jjimjilbang,bulgama(불한증막). memo: 이벤트탕·안마탕 37도. tribe=saunner. ⚠️좌표 Naver"스페이스본휘트니스"로 재확보(Google스크린골프 오매칭).
- **르네상스휘트니스사우나**(rec2344, 송파 오금로307 르네상스빌): sauna90·steam50·hot39·very_hot41. facilities: dry-sauna,steam-sauna,jjimjilbang(황토방),hot-bath. memo: 황토방, 관리좋음, 가격 약간 비쌈. tribe=saunner.

## E. 아트리파라다이스 → **hotel-premium** (유저 유지) ✅
- rec1999, 용인 보정동(Google: 보정로 32). "호텔식 사우나"(단 숙박X, 헬스+수영+사우나 복합, 일일권 18,900). ⚠️"파라다이스 계열" 발언은 rec2023에서 정정→그룹 무관, 브랜드 사용 금지.
- 온도(여탕기준): sauna(건식)98·very_hot(열탕)43·**cold(냉탕)22**(유저). 온탕=facility만(온도없음). **습식80은 CHECK 75초과 → memo 보존**(유저: 메모만).
- facilities: indoor-rest(내기욕), scrub(세신), hot-bath, cold-bath, dry-sauna, very-hot-bath. 운동시설(헬스+수영)·비치베드2 → memo. has_scrub=true. cost=18,900. tribe=saunner.

## F. 예산 덕산 온천탕 → **덕산온천탕** (public-bath) ✅
- 표준대로 Notion 대조: "덕산면 온천단지3로 45-7"는 **스플라스(워터파크, 기존DB)** → F 아님. F는 별개.
- 정식명 `덕산온천탕` / 충남 예산군 덕산면 **온천단지2로 97-16** / 좌표 36.6890,126.6616(naver) / 목욕탕·사우나
- 카톡(rec2906): sauna(건식)85·cold(냉탕)23. memo: "85도 고온방, 냉탕 23-4도, 주말에도 안붐빔". city=예산군, tribe=saunner.

## G1. 남해 쏠비치 사우나 → **resort-spa** (유저: 인피니티풀) ✅
- rec1908, 남해군. sauna(건식)70(FIX135 교정분). facilities: open-air-bath/인피니티 온수풀. memo: "인피니티 온수풀 뷰, 시설 깔끔, 건식70라 땀 적음". city=남해군, tribe=saunner.

## G2. 팔공산 심천랜드 → **public-bath** (+주차) ✅
- rec10889, 대구 팔공산 온천랜드. sauna(건식)80. facilities: open-air-bath(노천탕)·outdoor-rest(외기욕)·cold-bath(노천냉탕)·**parking(주차)**. memo: "노천탕 온도 좋음, 노천 냉탕 차가움". city=Daegu, tribe=saunner.

## H. 청계산글램핑장 뇨끼사우나 → **private-sauna** ✅
- rec6187, 서울 서초 청계산. 예약제 텐트/프라이빗 사우나(오라카이청계산=호텔/기존DB와 별개).
- **정식명(지도명 우선)**: Naver/Google 핀 = `서울서초글램핑청계산장`(글램핑 venue) — 뇨끼사우나는 그 안의 예약제 사우나 → name_original=서울서초글램핑청계산장, memo에 "뇨끼사우나(예약제 프라이빗)" 명시. 좌표 37.4501,127.0473.
- sauna(건식)**83**(기록대로) · cold(냉탕)**19**(유저). facilities: hinoki·**parking(주차)**·**self-loyly(셀프 로울리)**. memo: "뇨끼 예약제 프라이빗 사우나, 양모 사우나 모자, 라운지 샤워, 계란/음료, 두타임 예약 추천". city=Seoul, tribe=saunner.

---

## ✅ Step 3 완료 — 40건 facility_type 전부 확정 (A~H 8플래그 + 명확 32건)
분포: hotel-premium / public-bath / resort-spa / special / private-sauna / small-bath(기린) 혼합.
특수 처리 반영: 기린=small-bath+jjimjilbang / 새광주참숯가마=special+jjim_temp130 / 휘트니스2=public-bath / 스파앗홈T1 / 덕산온천탕(스플라스와 별개).
다음: **Step 4 — 등록+enrich (검증게이트 통과, 5건 dry-run→apply 배치)**. 등록 전 좌표 재확보 필요: 스페이스본휘트니스·새광주참숯가마·덕산온천탕·스파앗홈T1 등 Naver 재지오코딩.

---

## ✅ CSV facility 토큰 → DB 태그 정규화 맵 (2026-06-03 유저 확정)
40 NEW는 15토큰만 사용(미정의 0). 잡다(sunbed·water_bath·indoor_bath·bubble_spa·capsule_hotel)은 NEW에 없음.
- dry_sauna→**dry-sauna** / wet_sauna→**steam-sauna** / cold_bath→**cold-bath** / warm_bath→**hot-bath**(온탕) / hot_bath→**very-hot-bath**(열탕)
- jjimjil→**jjimjilbang** / scrub→**scrub** / salt→**salt-sauna** / outdoor→**outdoor-rest**(외기욕)
- **hinoki→hot-bath**(온탕, 미반영시 추가) / **event_bath→hot-bath**(동일) / **cool_room→ice-room**(스노우룸/냉각방)
- **enzyme→memo**(효소, DB태그 없음, special이 커버) / **private→DROP**(시설특성 아님: 사람없어 혼자 쓴 정황 or 오추출)
- **nap→케이스별**:
  - 기린온천사우나(8501) "수면방" → **sleep-room**
  - 아늑 시그니처 구로(11002) "내기욕 선베드" → **indoor-rest** (+outdoor→outdoor-rest)
  - 아트리파라다이스(1999) "비치베드 2개" → **indoor-rest**(유저 확정)
  - 시수하우스(10075) nap 맥락없음→스킵 / private=타입반영됨 / hinoki→hot-bath / cool_room→ice-room
- 개별: 웨스틴 파르나스(9220) **"혼탕 40"=온탕 오타 확정→hot_bath=40**(mixed 아님), private DROP / 이비스 명동(10682) private DROP, outdoor→**open-air-bath**(노천탕)
