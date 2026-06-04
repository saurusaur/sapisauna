# BACKLOG

> 이 파일이 태스크의 유일한 진실의 원천(SSOT)입니다.
> `/po add`, `/po done`, `/po rerank`으로 관리합니다.

## In Progress
- (없음)

## Backlog

<!-- 🎯 P0 최우선 — 모든 기록 기능의 기반 -->
- [ ] [아키텍처/데이터] **로그·스키마 구조 재검토 (최우선)** — F1(블록 탭 기록=누른 순서가 루틴) 등 신규 기록 모델이 현재 `logs`/`deep_logs` 컬럼형 스키마(온도=개별 컬럼)와 맞는지 근본 재검토. 루틴 시퀀스(블록 순서)·세트·트라이브 기본블록을 어떻게 저장할지 결정. **데이터 전체의 기반 — 여기가 흔들리면 전부 흔들림.** F1·F3·F5의 선행조건. 드래프팅 핸드오프: `docs/handoff/handoff_20260604_log_schema_redesign.md` | priority: P0 | added: 2026-06-04

<!-- 🧪 사-피 방향성 (구현스케치 `docs/po/사피_제안기능_구현스케치.html`, 2026-06-03) — 헤드라인만. 디테일 별도 플랜
     페이지별 강조 기능·UX 재검토·선행→위임 구조: `docs/po/UX_DIRECTION_page_emphasis_20260604.md` -->
- [ ] [기능+게임화] **F1 빠른 기록 = 블록 탭** — 누른 순서가 루틴(1건식→2냉탕→3휴식), 온도/세트는 상세 토글로 분리, "어땠어"(별로~최고), 나만의 루틴 저장/불러오기 + 트라이브 추천 루틴("토토노우 입문"). 마찰 0·데이터는 남게. ※"내 루틴 찾아가기(Routine Fit)" ①콜드스타트 흡수. 선행: 로그/스키마 재검토 | priority: P0 | added: 2026-06-04
- [ ] [UX/발견] **F2 트라이브 픽 필터 + 영업중·24시 토글** — 사우너픽/탕러픽/찜질러픽(트라이브 추천·로그집계) + 영업중·24시, 조합 시 실시간 카운트·핀 갱신. 시설칩 필터는 다음 단계. 수요근거: 사우나 추천=최대 미충족 니즈(질문38%). ※"지도 검색 흐름 개선"과 연계 | priority: P1 | added: 2026-06-04
- [ ] [기능] **F3 방문지 비교 → 개인 점수·인생 랭킹** — 둘씩 비교로 개인점수(0~10) 자동정렬(Beli식), 비교 누적=내 사우나 랭킹, 공개·비교→한 탭 SA리스트화(큐레이터 전환). 선행: 로그/스키마 재검토 | priority: P2 | added: 2026-06-04
- [ ] [게임화/수익화] **F4 사우나 도장판** — 방문(체크인)=트라이브 무드 도장, 월별·시즌 테마 스킨 꾸미기, 완성 시 사우나펫 아이템(때수건·식혜·맥반석란)+경품 추첨(브랜드 스폰서=제휴 수익화). ※"사우나 펫"·"칭호"와 리워드 통합 검토 | priority: P2 | added: 2026-06-04
- [ ] [UX] **F5 히스토리 캘린더 뷰 재설계** — 캘린더↔리스트 토글·KPI·인사이트·최근기록은 유지, '달력' 부분(주간 스트립/월 그리드)만 재설계 | priority: P2 | added: 2026-06-04
- [ ] [기능] **F6 저장 = 큐레이션(자동 리스트화)** — 저장 쌓이면 테마 자동감지→리스트화 제안(노천탕·24시·도쿄…)+이름 추천→한 탭 생성, 공개 시 구독 유도. 콜드 공백은 FEATURED 선충전. ※"큐레이션 리스트 시드"=콜드공백, "구독 리스트 지도" 연계. **완전 후순위** | priority: P3 | added: 2026-06-04

<!-- 🛠 어드민 페이지 — 스코핑 먼저 -->
- [ ] [기능/인프라] **어드민 페이지 구축** — 현재 place 등록·교정이 스크립트(katalk-*)로만 가능하고 큐레이션 is_featured 관리 UI도 없음 → 어드민 페이지 필요. **①구성·기능 스코핑 먼저(확인 필요)**: 후보 = 장소 등록/편집·병합 리뷰, place_sources/온도/시설 교정, is_featured 큐레이션 리스트 관리, 신고("다른 장소"/"폐업") 큐·폐업 배지, 수동 등록 리뷰 큐, 통계 대시보드. → ②구축. ※기존 "어드민 도구(P2)" 흡수. 큐레이션 시드(P0)·F6 운영의 기반. 스코핑: `docs/plans/PLAN_admin_page_scope.md` | priority: P1 | added: 2026-06-04

- [ ] [데이터] resort-spa 재분류 일괄 검토 — `PHASE_LOG.md` 메모의 워터파크/메가 데이온천 후보 15곳(아쿠아필드 고양/안성/하남·스파랜드류·이천 테르메덴·Therme Erding 등) 중 현재 public-bath/hotel-spa 잔존분을 026 정의에 맞춰 resort-spa로 전환 검토 | priority: P2 | added: 2026-06-04
- [ ] [데이터] DB 전수 재감사 — `katalk-db-full-audit.mjs` 재실행해 2026-06-01 기준 잔여 플래그(city-missing 114·g-name-mismatch 43·type? 18·ext-id-missing 9) 현재 수치 재확인·정리. 상세: `PHASE_LOG.md` | priority: P2 | added: 2026-06-04

<!-- P0 — 베타 출시 전 필수 -->
- [ ] [인프라] Sentry 소스맵 업로드 설정 — 코드+래퍼 구현 완료(c6adb35), DSN 환경변수 설정 완료. 남은 작업: ① sentry.io > Settings > Auth Tokens에서 토큰 생성 → Vercel에 `SENTRY_AUTH_TOKEN` 추가, ② sentry.io > Settings > General의 Organization Slug → Vercel에 `SENTRY_ORG` 추가, ③ sentry.io > Settings > Projects의 프로젝트명 → Vercel에 `SENTRY_PROJECT` 추가. 이 3개 설정하면 빌드 시 소스맵이 Sentry에 업로드되어 에러 스택트레이스에서 원본 코드 라인 확인 가능. 가이드: `docs/guides/SENTRY_GUIDE.md` | priority: P2 | added: 2026-02-28
- [ ] [콘텐츠] 큐레이션 리스트 시드 — 어드민 is_featured 리스트 5~8개 생성 (노천탕/24시/세신 등). ※F6 자동 리스트화의 콜드공백 선충전 역할 | priority: P0 | added: 2026-03-23

<!-- P1 — 베타 핵심 기능 -->
- [ ] [UX] 뉴비 유저 사우나 용어 설명 팝업 — 처음 보는 유저를 위해 사우나 용어(아우프구스/세신/토토노이/노천탕/한증막/온탕/열탕/냉탕/급냉탕/건식/습식 등) 클릭 시 설명 팝오버. 트리거 후보: 로그 폼 라벨 옆 ⓘ 아이콘 / 장소 상세 시설 칩 클릭 / 온보딩 첫 진입 시 1회 가이드. 용어 사전 단일 소스(content.ts에 GLOSSARY 상수) | priority: P1 | added: 2026-04-30
- [ ] [UX] 사우나 ID 유저 카드/페이지 — 유저 프로필 페이지를 '사우나 ID 카드' 컨셉으로 설계. 포함 정보: tribe, 선호 온도/시설유형, active 칭호, 방문 통계 등 (구성 아이디어 필요) | priority: P1 | added: 2026-04-07
- [ ] [인프라] 도메인 구매 — 정식 출시 시. 베타는 Vercel URL로 충분 | priority: P3 | added: 2026-02-28

<!-- P2 — 베타 중 개선 -->
- [ ] [UX] 장소 상세 '시설 정보' 표시 순서 재검토 — 상세 페이지 시설 정보 섹션의 항목 노출 순서가 사용자 정보 우선순위에 맞는지 점검·재배치 (예: 핵심 시설/탕 구분/부대시설 그룹핑·정렬) | priority: P2 | added: 2026-06-04
- [ ] [UX] 지도 검색 흐름 개선 (대작업) — 현재 지도뷰 검색이 불편: 상단 검색바가 이미 로드된 장소만 이름/주소로 클라이언트 필터링하고 지도는 결과로 이동/줌하지 않음, 지역·주소 검색·자동완성 없음. 개선 방향: ① 장소명/지역/주소 검색 시 지도 자동 센터링+줌 & 결과 마커 강조 ② "이 지역에서 검색"(지도 이동 시 현재 bounds 기준 재조회) 패턴 ③ 검색 자동완성(장소/지역). 기본 뷰가 지도로 바뀌면서(2026-06-03) 검색 진입 빈도↑ → 우선순위 상향 검토 | priority: P2 | added: 2026-06-03
- [ ] [기능] 구독 리스트 지도 통합 보기 — 구독한 리스트 장소를 지도에 표시. Naver Map(국내)/Mapbox(해외) 검토. 마커+클러스터링+바텀시트. 플랜: `docs/plans/PLAN_sa_list_renewal.md` 섹션 E | priority: P2 | added: 2026-04-13
- [ ] [기능] 어드민 도구 — 병합 리뷰 + 수동 등록 리뷰 큐 + "다른 장소에요"/"폐업했어요" 신고 + 폐업 배지. ⚠️"어드민 페이지 구축"으로 통합 — 거기서 스코핑 | priority: P2 | added: 2026-03-02
- [ ] [기능] 회원 탈퇴 — 이메일 요청(sapi.sauna@gmail.com). 개인정보처리방침에 명시됨, 법적 대응 필요 | priority: P2 | added: 2026-03-20
- [ ] [디자인] UI 최종 검증 — Phase 11 | priority: P2 | added: 2026-02-28
- [ ] [리팩토링] safeParse 패턴 재검토 — 상세: `REVIEW_safeParse_errors.md` | priority: P2 | added: 2026-03-04
- [ ] [리팩토링] 폼 플로우 일관성 감사·모듈화 — short-log/deep-log/place add/place edit의 save/cancel/edit/dirty/error/CTA 흐름을 비교해 기능 손실 없이 공통화. 우선 후보: 공용 `PlaceFacilityEditor`(시설유형·탕구분·시설칩·타투 커버·24h), unsaved-change confirm 헬퍼, save error/spinner CTA 패턴, history→log edit session builder. 날짜/시간 선택·currentLog handoff·merge flow·story navigation은 동작 보존 최우선, 제거 후보는 사용처 확인 후만. | priority: P2 | added: 2026-04-30
- [ ] [버그] Google 지도 URL 폴백 dead code — `explore/[id]/page.tsx:266-268`에서 `place.latitude` 삼항 분기 true/false가 동일 결과. 좌표 있을 때 `query=<lat>,<lng>` 로 핀 정확도 개선 필요 | priority: P2 | added: 2026-04-20

<!-- P3 — 장기 -->
- [ ] [성능] 지도뷰 마커 명령형화(#3) — 현재 모든 장소가 @vis.gl AdvancedMarker(React 컴포넌트)로 마운트돼 줌아웃(전국 보기)·첫 진입 시 마운트 총량이 큼. 비저장(일반) 핀을 markerclusterer 네이티브 마커(순수 DOM, createClusterElement 방식)로 그리고 선택/저장 등 인터랙티브한 소수만 React 마커로 유지하면 reconcile 대상이 238→수 개로 감소. #1(메모이제이션)·#2(뷰포트 컬링)으로 클릭·팬 비용은 해결됐고, 이건 줌아웃 마운트 총량 근본해결용 | priority: P3 | added: 2026-06-02
- [ ] [기능] 사우나 펫(Sauna Pet) — v2.5.1 정식 기획서 기반. 3종 정령(사우나돌/물두꺼비/맥반석란) × L1-L3 진화 + 첫 사-피엔스 베타 통합. **Phase 0 결정 완료 (2026-05-19)**: D1 펫종 자유선택 / D2 기존 XP 그대로 (임계값 L2=200·L3=1200~1500) / D3 칭호=펫배지 통합 / D4 베타 직후 출시 / D5 V1엔 추천인코드만, 로윌리·인앱알림 V1.5 / D6 홈 위젯+풀스크린 / D7 jimi 칭호 "맥반석란" 통일 (마이그레이션 025 완료) / D8 L3 9 variant 풀로드. **V1 예상 ~80-85h / 7-9주 솔로**. 잔여 Phase 0 블로커: 디자인 리소스 결정(15 캐릭터+19 코스튬+4 Lottie). 작업 계획: `docs/plans/PLAN_sauna_pet_v2.md` / 원본 스펙: `docs/plans/SPEC_sauna_pet_v2.5.1.md` (참고용 한글본: `docs/plans/REF_사피_사우나펫_Part2_기획서_v2.5.1.md`) / v1 초안 deprecated: `docs/plans/archive/PLAN_sauna_pet.md`. ⚠️리워드(아이템·경품) 획득 경로는 F4 사우나 도장판과 통합 검토 | priority: P3 | added: 2026-05-18
- [ ] [기능] 내 루틴 찾아가기 (Routine Fit) — 수요 근거: 먼데이사우나 톡방에서 루틴 화제의 26%가 "스탠다드가 뭐예요?/13도 몇분?" 식 *기준·캘리브레이션 질문*(자랑·공유 아님). 분석: `docs/research/katalk-20260519/topic-analysis.md`. **소셜이 아니라 self-discovery 루프**로 설계. 입력변수(HEAT/ICE/PAUSE/REPEAT)+결과변수(토토노우·만족도·또갈래요)가 이미 스키마에 있음. 단계: ① **콜드스타트**(입문자용 기본 루틴 템플릿, 크로스유저 밀도 불필요 → 지금도 가능, P2) → ② **개인 수렴**(내 로그 기반 "고만족 세션 패턴" 피드백, 내 로그 수십개면 됨 → 중기, P3) → ③ **크로스유저/장소 평균**(유저 수백+ 게이트 → 장기, P3). 진짜 "옵티마이제이션"은 ②③의 개인화 추천 = 기록앱→루틴코치 전환점. ⚠️①콜드스타트(입문 루틴 템플릿)는 F1로 흡수 — 본 항목은 ②개인수렴·③크로스유저만 잔존 | priority: P3 | added: 2026-05-30
- [ ] [기능] 소셜 — 공유 링크 + 팔로우 + 크로스 소스 매칭(네이버↔구글) | priority: P3 | added: 2026-02-27
- [ ] [기능] API 카테고리→시설유형 자동매핑 — 유저 인풋 보조. 상세: `PLAN_venue_type_auto_mapping.md` | priority: P3 | added: 2026-03-20
- [ ] [기능/데이터] 유저 시설 기여·요청 플로우 — 장소 상세 "시설 추가/수정 제안" → 어드민 검수 큐 유입 → 반영 시 recognition(이중가치 루프). 어드민 A 리포트의 "요청 시설 집계"·완성도 개선의 데이터 소스. 우선 잔여 4건(유림탕/유진/주신/필례)도 이 경로로 흡수. 스코프: `docs/plans/PLAN_admin_page_scope.md` A·D | priority: P3 | added: 2026-03-21
- [ ] [인프라] PWA 오프라인 + 동기화 | priority: P3 | added: 2026-02-27
- [ ] [기능] 커머스 — 특가/한정 공구 | priority: P3 | added: 2026-02-28
- [ ] [리마인더] 베타테스터 사용자 행동 분석 | priority: P3 | added: 2026-02-28

## Done

### 2026-06-04
- [x] [데이터] 카톡 DB Sync **Phase 4 완료 (국내 40 + 해외 16)** — (1) **국내 NEW 40건 등록**(places 256→296, naver+mapx_mapy, 어드민 logs/deep_logs. NEW 48→실신규 40: −5 silent중복 프록시미티검출 −3 좌표병합. 온도위반0·중복0) + enrich(NULL보강6·신규로그4·facilities/memo)·깨진 facilities 42곳·jjim Phase5·deep_log memo 손상 7건 (2) **해외 신규 16건 등록**(places 296→**312**, source=google·external_id=place_id·coordinate_source=google, cc JP14/US1/HK1. 23건 중 7건은 기존 시드라 제외). **핸드오프 전제 교정 3건**: ①7건 이미존재(시드)→신규16 ②`hotel-spa`는 026서 폐기→`hotel-premium`(INSERT CHECK 회피) ③16건 시설·온도·정식명 사용자 전수검토 반영(코코로노=Hotel Furukawa, 아리마/fuua=resort-spa 재분류, 아리마 건식94 enrich). 산출: `katalk-overseas-register.mjs`·`overseas-register-dryrun-20260604.md`·`overseas-existing7-verify-20260604.md` | priority: P1 | added: 2026-06-02 | done: 2026-06-04
- [x] [정리] katalk 데이터 동기화 산출물 대청소 — "검수된 최종 품질보장본만 잔존" 기준. 완료 phase 일회성/중간 산출물 77삭제(git 복구가능), katalk 스크립트 32→6(merge-flat·master-reference·db-full-audit·register류), research 디렉토리 ~62→15(raw·chunk·flat·최종등록입력·decisions·README). 핸드오프 3+PLAN_phase4 archive, 와이어프레임 7 archive. **`PHASE_LOG.md` 신설**(수치·결론·교훈·미적용항목 통합 — resort-spa 재분류 후보 15곳·DB 잔여 플래그 등 메모 보존). README/PHASE_LOG 참조 정합성 정리 | priority: P2 | done: 2026-06-04

### 2026-06-03
- [x] [기능+UX] 탐색(사우나 찾기) 지도뷰 전면 개편 — (1) 탭명 '탐색'→'사우나 찾기', 기본 뷰 list→map, 위치 없을 때 남산공원(N서울타워) 기준 뷰 (2) 핀 재디자인: 비선택 심플 물방울 핀 / 선택 확대+사-피 로고 증기(BMP→potrace 벡터, 14px)+은은한 그림자 / 찜 머리중앙 미니 하트 / 비선택·클러스터 그림자 제거 (3) 클러스터: radius 40·maxZoom 15 튜닝, 빨강채움+흰숫자 30px, 클릭 시 getBoundsZoom+moveCamera rAF로 한 번에 자연 줌인(250ms, maxZoom+1 캡 → 딱 분리될 만큼) (4) 선택 마커가 하단 정보카드에 가리지 않게 PanToSelected, 줌 컨트롤 제거. 시안: `docs/wireframes/MOCK_map_pins_24h.html`. 선택+찜 동시 표시(하트 배지)는 보류 | priority: P2 | done: 2026-06-03
- [x] [데이터] DB 품질 검수 + 교정 — 기등록 데이터 정합성 점검. (1) **마스터 매칭 파일 신설** `docs/research/MASTER_place_matching_reference.md`(255곳, DB정식명↔place_id↔주소↔카톡표기↔노션표기, 재생성가능 `scripts/katalk-master-reference.mjs`) — 향후 검수 시 원본↔정식명 조회용 (2) **카톡/노션 원본 대조 검수**(`katalk-source-crossaudit-20260603.md`, 노션 160블록 파싱) (3) **온도 교정**: 클럽케이(건84→95/습68→56/열+42)·봉일스파랜드(건99→95/습54→69)·할매탕(냉10→24)·아쿠아필드(습70→45)·북한산온천 비젠(온30/열40 추가) — 전부 노션/카톡/블로그 원본 확인 후 (4) **facilities/이름**: 그린대중목욕탕(그린사우나→정식명·jjimjil오태깅 제거, Naver 옛 찜질방 리스팅 오등록)·북한산온천(jjimjil제거+parking/탕/사우나 추가) (5) **검증만(정상)**: C 이름변경 6건 전부 DB=현재 Naver정식명 일치, jjimjilbang 67곳 대부분 정상(그린/북한산만 오태깅). 한계: 크로스오딧 파서가 노션 다중값/범위에서 오탐 → 개별 원본확인으로 걸름 | priority: P1 | done: 2026-06-03

### 2026-06-02
- [x] [데이터] 카톡 DB Sync Phase 1~3 완료 — (1) **통합 CSV 생성**(144 국내행, chunk2/4 재정규화 + chunk1/3/5 칸밀림 8건 교정: 건식↔습식/온탕↔열탕 추출오류) (2) **DB 크로스체크**(MATCHED 40/AMBIGUOUS 16 전건확정/NEW 63, region=발화자noise 판명) (3) **facility_type 7종 확장**(026·027: `hotel-spa`→`hotel-premium` 리네임 + **`resort-spa` 신설**, 럭셔리=premium·캐주얼메가/워터파크=resort-spa·불가마효소=special) (4) **DB 전수검수 255곳**(Google+Naver 대조, country/주소/이름 오류 0) (5) **city 보강 123건**(028: Google 영문 locality, KR광역시 admin1, **도쿄 23특별구→'Tokyo' 룰** address-builder 반영) (6) **트리니티스파 제거**(마사지샵) (7) **온도 sanity 검수**(229로그, 실오류 2건만: 할매탕 냉10→24·아쿠아필드 습70→45 교정. 나머지는 Notion출처/표시온도/다른시점) (8) **아라고나이트** manual→google 업그레이드 (9) **enrich**: 어드민로그 22개 신규(UPDATE보강7+INSERT 5/19로그19+그룹C3, 온도범위검증·중복가드, 기존 시드값 보존). 마이그레이션 026·027·028 적용됨. 핸드오프 §11. Phase4(NEW 등록)는 In Progress | priority: P1 | added: 2026-05-29 | done: 2026-06-02
- [x] [기능+UX] 탐색·tribe 정렬 UX 개편 — 정렬 동적 기본값(위치 있음→가까운 순 / 없음→추천 순, 권한 확정 후 1회 자동 선택, 사용자 수동 변경 시 덮어쓰지 않음 override 추적), 정렬 탭 '가까운' 최좌측, **인기순 탭 제거**(가까운/추천만, 탐색·tribe 공유 FilterControls). tribe(PICKS)에 위치 배선 신규 추가(useUserLocation·distanceMap·nearby 정렬 분기·granted 자동 위치획득·거리 라벨) — 기존엔 tribe '가까운' 탭이 동작 안 하던 죽은 탭이었음. granted면 프롬프트 없이 즉시 위치 반환, 미허용은 자동 프롬프트 안 띄움(iOS 이슈 회피) (b751c9a, f5b2fff, 5bd3ac2) | priority: P1 | done: 2026-06-02
- [x] [버그] 스토리 카드 export 폰트 폴백 회귀 — next/font 전환 후 캔버스가 literal "Oswald"를 참조하나 해시 패밀리명(__Oswald_xxxx)과 불일치해 export 시 시스템 폰트로 폴백되던 회귀. 런타임에 `--font-oswald`를 읽어 프리뷰와 동일 페이스를 캔버스에 적용, 사용 weight 멱등 프리로드(추가 다운로드 없음) 후 렌더 (876a2db) | priority: P1 | done: 2026-06-02
- [x] [버그] 로딩 시 아이콘 폰트 FOUT — 웹폰트 로드 전 ligature 원본 글자("progress_activity")가 노출돼 스피너 대신 텍스트가 도는 현상. ContentLoader를 순수 CSS 원형 스피너로 교체 + Material Symbols `display=swap`→`block` + preconnect (8766515) | priority: P2 | done: 2026-06-02
- [x] [성능] 탐색 지도뷰 INP 개선 — 마커 클릭 시 selectedPlaceId 변경이 전체 마커(약 238개)를 동기 리렌더해 INP 3.5s(render 3,490ms). SaunaPin/PlaceMarker React.memo화 + handleSelect ref 기반 안정 콜백으로 선택/해제된 2개만 리렌더, 뷰포트 컬링(화면+20% 패딩 내 장소만 마운트). #3(비저장 마커 명령형화)은 줌아웃 마운트 총량 근본해결용으로 별도 P3 백로그 등록 (5e32023) | priority: P2 | done: 2026-06-02
- [x] [UX] 필터 패널 닫기 X 이전 — 상단 섹션 헤더의 작은 X가 누르기 어려워 24시 영업 행 오른쪽 끝으로 이전, 토글은 라벨 옆에 배치 (0a107ca) | priority: P2 | done: 2026-06-02
- [x] [버그] SA-리스트 공유 링크(slug) 로딩 실패 — 공유 링크는 8자리 slug를 쓰는데 getListItems·isSubscribed·toggleSubscription이 slug를 UUID 컬럼에 직접 쿼리해 "invalid input syntax for type uuid" 에러. resolveListId() 헬퍼로 slug→UUID 해석 후 쿼리(getListById 패턴과 동일). 인스타 DM 등 외부 공유 링크 진입에서만 발생하던 버그 (68bad2a) | priority: P0 | done: 2026-06-02
- [x] [기능] 장소 탐색 강화 — '내 주변' 거리순 정렬(geolocation) + Explore에서 직접 장소 등록. 거리순 정렬은 탐색·tribe 동적 기본값으로 완성, 직접 등록은 빈 상태/검색결과 없음 CTA(/place/add)로 제공 | priority: P1 | added: 2026-03-04 | done: 2026-06-02
- [x] [기능] 탐색 탭 → 지도 뷰 전환 — Google Maps 지도뷰(리스트/지도 토글), 사우나 핀(김/하트)·내 이모지·링 클러스터 마커, 위치기반 거리정렬, 로드 실패 fallback (35c4f43, ef3f1ed 등) | priority: P2 | added: 2026-04-18 | done: 2026-06-02

### 2026-05-19
- [x] [데이터] jimi 트라이브 첫 로그 마일스톤 "구운달걀" → "맥반석란" 통일 — 사우나펫 v2.5.1 도입 사전 작업. `user_titles.title`+`base_title`+`users.active_title` UPDATE, `rewards.ts:64` 상수 변경. 마이그레이션 025 | priority: P2 | added: 2026-05-19 | done: 2026-05-19

### 2026-05-18
- [x] [기능+리팩토링] 사우너 quick log 습식 사우나 + primary 명시 + wet→steam 전면 통일 — quick log 사우너 폼에 인라인 ✓ 토글 + × 클리어 + 슬라이더 단일(active 토글에 따라 dry/steam 편집). 둘 다 입력 시 같은 라인에 "주 이용 사우나를 선택해주세요" 안내. 첫 입력 시 그쪽 자동 주황 ✓ + primary_sauna_kind 자동, 둘 다 입력 후 ✓ 클릭으로 주 이용 전환. DB: 마이그레이션 024로 deep_logs.wet_sauna_temp→steam_sauna_temp RENAME 후 logs로 백필+이동, logs에 primary_sauna_kind 컬럼 추가, places.facilities 'wet-sauna'→'steam-sauna' array_replace. 코드 wet→steam 전면 리네임(타입/서비스/상수/시드 JSON 114건/스크립트 2종). ΔT 정책 = primary_sauna_kind 기반(둘 다 있어도 primary 쪽만 표시, 라벨 분기 "STEAM TEMP DELTA"/"습식 온도차"). Story card / History detail / Stats 인사이트 모두 primary 기반 메인 메트릭. Stats 인사이트 카드 "평균 온도차"에 건식/습식 인라인 토글 추가(디폴트 = 해당 기간 primary 다수결). Helper getPrimarySaunaTemp/getPrimaryTempDelta 신설. 플랜: `docs/plans/PLAN_steam_sauna_quick_log.md`, mocks: `docs/wireframes/MOCK_quick_log_*.html`, `docs/wireframes/MOCK_stats_steam_toggle.html` | priority: P1 | added: 2026-04-12 | done: 2026-05-18

### 2026-04-30
- [x] [버그] 비로그인 랜딩·SA-리스트 구독 카운트·공개 owner 프로필 수정 — 루트(`/`) 비로그인 진입을 `/home`으로 변경, 구독 토글을 `toggle_list_subscription` RPC(023)로 이동해 `subscriber_count`를 RLS에 막히지 않게 동기화, 피드/상세에서 로그인·비로그인 구독 상태 처리 및 카운트 즉시 반영. 리스트 owner 정보는 `users` 직접 조인 대신 `public_profiles` 조회+병합으로 전환해 비로그인에서도 닉네임/프로필 이모지/색상 표시. SA-PI 공개 프로필 값 확인(nickname `SA-PI`, emoji `♨️`, hue `0`) 및 fallback 유지 (25977cd) | priority: P1 | added: 2026-04-30 | done: 2026-04-30

### 2026-04-21
- [x] [UX] 섹션 헤더 스타일 전체 통일 — 페이지별 4가지 혼재(text-sm semibold 500 / text-sm bold 600 / text-[11px] bold 500 / text-base bold 600) → 단일 규칙. 섹션 헤더 `text-sm font-bold text-stone-600`, 카드 서브 라벨(KpiRow/RoutineCard) `text-xs font-bold text-stone-500`. 8 파일 정리 (4c65f45) | priority: P1 | added: 2026-04-21 | done: 2026-04-21
- [x] [UX] 로딩 UI 전체 통일 — 공용 `<ContentLoader>` 프리미티브 생성(size=small/default), Z3 게이트(헤더·네비 유지, main만 스피너) 패턴 적용. 홈/사-리스트홈 초기 로딩 게이트화, 섹션별 "로딩 중..." 텍스트 제거(story/page, page, settings/titles, save-bottom-sheet, user-context). DataState 내부도 ContentLoader 재사용. MESSAGES.HOME.LOADING 상수 삭제 | priority: P1 | added: 2026-04-21 | done: 2026-04-21
- [x] [UX] 홈 SA-PI FEATURED 섹션 alignment + 헤딩 + 폰트 보정 — main p-4(16) + 내부 px-5(20)=36 이중 들여쓰기 해소(compact 모드 px-4 + 호출부 -mx-4 래퍼), "SA-PI FEATURED" → "이런 사우나는 어때요?" (title prop 신설), 이모지 26→32px·제목 13→15px·설명 10→11px·섹션 헤더 text-sm→text-base (520717d) | priority: P1 | added: 2026-04-20 | done: 2026-04-21
- [x] [UX] 장소 상세 '연관 사-리스트' 섹션 + 시각 분리 — 사-피 리포트와 사-피엔스의 흔적 사이에 신설. 공개 리스트만 subscriber_count desc, 카드 2개 + 더보기 인라인 확장(최대 10). 사-피엔스 흔적 섹션과 시각 구분 위해 primary 5% alpha rounded 배경 패치(옵션 C). 0건이면 섹션 hide (839e342, 2caa460, 44973a8) | priority: P2 | added: 2026-04-13 | done: 2026-04-21
- [x] [UX] 비로그인 홈에 큐레이션 캐러셀 노출 + 트라이브 활성 칩 살짝 키움 — 기존엔 '더 보러가기' 텍스트 링크만 떠서 트라이브 픽 다음이 뜬금없음. FeaturedSaListCarousel(compact)을 비로그인에도 노출, 활성 칩 scale-105→110 (66f46ac) | priority: P1 | added: 2026-04-21 | done: 2026-04-21
- [x] [UX] 인기 사-리스트 피드에 featured 리스트 포함 — 기존엔 캐러셀 중복 회피 목적으로 is_featured 제외했으나, featured와 인기는 별개 발견 경로라 양쪽 노출이 자연스러움. 비로그인/로그인 동일 (cdf7e48) | priority: P1 | added: 2026-04-21 | done: 2026-04-21
- [x] [UX] 탐색 BEYOND 필터에 '세신' + '찜질방' 추가 — EXPLORE_FILTERS.BEYOND가 PLACE_SPECS와 동기화 누락. 찜질파/세신 유저 필터링 편의 (94b3286, 2caa460) | priority: P2 | added: 2026-04-21 | done: 2026-04-21
- [x] [UX] 탐색 검색 결과 없음 → 장소 추가 유도 — 0건 UI에 search_off 아이콘 + "직접 장소 추가" CTA 링크로 /place/add 연결 (c046e9b, 4/20 구현 — 백로그 정리 누락분) | priority: P1 | added: 2026-04-14 | done: 2026-04-21
- [x] [기능] SA-LIST 리워드 — XP list_created(30) 즉시 부여 + 마일스톤 6종(큐레이터/컬렉터/백과사전/안내자/촌장/사플루언서). 즉시 트리거(생성·장소추가) + lazy 트리거(getMyLists 시 구독자 수 체크). 칭호 사유 라벨을 base_title 기반 구체 사유로 개선 (38e34b9) | priority: P1 | added: 2026-03-23 | done: 2026-04-21
- [x] [UX] 트라이브 선택 버튼 디자인 통일 — 온보딩+비로그인 홈을 사-리스트 TRIBE PICKS 스타일(컬러 풀필 + 박스 안 이모지/영문)로 통일 (224b4d5) | priority: P1 | added: 2026-04-20 | done: 2026-04-21
- [x] [인프라] 로컬 빌드 SSL 에러 — build 스크립트도 NODE_EXTRA_CA_CERTS 적용해 dev와 일관 (08585ce) | done: 2026-04-21

### 2026-04-20
- [x] [리팩토링] Geocoding 마이그레이션 — Text Search formatted_address 파싱 제거 → Google Geocoding API reverse(10K/월 무료) + address_components 재조립. places.city 컬럼 추가(022), country_code 오염 교정 246건, JP 블록 번지 복원(premise+sublocality_level_3/4/5), POI 필터(숫자 0+4자+) 적용. lat/lng 누락 2건 forward Geocoding으로 보강. 플랜: archive/PLAN_geocoding_migration.md | done: 2026-04-20
- [x] [UX] TRIBE PICKS 탐색탭→사-리스트 홈 이동 + SA-PI FEATURED 리네이밍 — URL 이동(/explore/type/[t] → /sa-list/tribe/[t]), 탐색 섹션 제거, 3카드 Variant A(컬러 풀필+그림자), 서브설명 추가. 탐색탭은 향후 지도뷰 전환 대비 (2b4a1fb) | done: 2026-04-20
- [x] [UX] 장소 상세 사우너 메트릭에 급냉탕 평균 추가 (f0b5637) | done: 2026-04-20
- [x] [기능] 급냉탕 온도 필드 추가 — deep_logs.has_ice_bath/ice_bath_temp (0~20°C), 탕 온도 섹션 4번째 슬라이더, 히스토리 상세 표시, autoTags 'ice-bath' 연동. 마이그레이션 021 (53b516f) | done: 2026-04-20
- [x] [UX] 공개 pill 클릭 시 공개 설정 뷰 바로 오픈 — ListManageSheet initialView prop 추가, 3-dot과 분기 (6bd5420) | done: 2026-04-20
- [x] [UX] 사-리스트 상세 헤더 상단 여백 통일 pt-12→pt-8 — 네비-이모지 호흡 확보 (cc48f8a) | done: 2026-04-20
- [x] [버그] 인기 태그 검색 시 사-리스트 미노출 — feedSearch 모드에서 is_featured 필터 해제 (4941cca) | done: 2026-04-20
- [x] [버그] place_count 실시간 싱크 — SavePlaceContext SSOT로 통합, useMyLists 훅 제거, toggle 후 loadMyLists 호출 (4941cca) | done: 2026-04-20

### 2026-04-19
- [x] [리팩토링] 컬러 저장 hex → hue(int)로 DB/코드 전면 전환 — OKLCH 기반 perceptual-uniform 톤, hexToHue/hexToOklchHue 역산 함수 제거, 020 SQL로 hex 컬럼 drop · 뷰 재생성. 플랜: archive/PLAN_color_hue_migration.md | done: 2026-04-19
- [x] [UX] SA-리스트 상세 J 레이아웃 — visitor 구독 outline pill(커버 내부), owner 공개 네비 pill, 크리에이터+소셜+통계 한 줄 통합, PlaceCard 메모 수정 중복 제거 | done: 2026-04-19
- [x] [디자인] 커버 컬러피커 OKLCH 전환 — 라임/시안 눈부심 근본 해결 (perceptual uniform) | done: 2026-04-19
- [x] [i18n] 크리에이터 소셜 링크 라벨 한글화 — 인스타그램/네이버 블로그/스레드 | done: 2026-04-19
- [x] [버그] 상세 페이지 owner 프로필 이모지 미표시 — getListById에서 mapListWithOwner 미사용으로 profile_emoji 누락 | done: 2026-04-19
- [x] [UX] 이모지 피커 탭 대표 아이콘 변경 — 액티비티 🎊, 사물 🫧 | done: 2026-04-19
- [x] [UX] 내 사-리스트 카드 공개/비공개 배지 상단 정렬 | done: 2026-04-19
- [x] [UX] Featured 카드 설명 글씨 크기 12→13px | done: 2026-04-19
- [x] [UX] 상세 페이지 와이어프레임 v2 작성 — 커버+통계+크리에이터+장소카드 레이아웃 재설계 | done: 2026-04-19

### 2026-04-18
- [x] [기능] SA-LIST 리뉴얼 Phase 1+2 — 홈 탭→단일 스크롤(Featured/내 리스트/인기태그/피드), 전체보기(/sa-list/my), 검색+태그 칩 필터, DB RPC(017) | done: 2026-04-14
- [x] [디자인] SA-LIST featured 카드 & 페이지 레이아웃 다듬기 — 구독 pill(아웃라인), 그라데이션 제거→inner shadow, 설명 2줄 min-height, 커버 팔레트 어두운 원색, 프로필 톤 맑은 파스텔 | done: 2026-04-17
- [x] [기능] SA-LIST 리뉴얼 Phase 3 — 상세 커버 헤더(cover_color+이모지 48px), 크리에이터 섹션(아바타+닉네임+통계), 태그 칩, Owner 메모수정/제거 버튼, Featured 구독 토글 연결 | done: 2026-04-18
- [x] [기능] SA-LIST 리뉴얼 Phase 4 — 크리에이터 소셜 링크(인스타/네이버/쓰레드, DB 018), 폼 플랫폼 선택 UI, 상세 소셜 아이콘, 공유 문구("[이모지] [제목] | SA-PI에서 보기") | done: 2026-04-18
- [x] [버그] window.confirm → ConfirmModal 교체 — 6곳(sa-list/my, list-manage-sheet x2, save-flow, explore/type, use-list-actions) | done: 2026-04-18
- [x] [UX] 검색 결과 선택 배경색 레드→그레이 | done: 2026-04-17
- [x] [UX] 섹션 헤더 문구 변경 — Featured→사-피 픽, 내 리스트→내 사-리스트, 인기 리스트→인기 사-리스트 | done: 2026-04-17
- [x] [UX] 이모지 피커 액티비티 탭 대표 이모지 🏃→🧖 | done: 2026-04-17

### 2026-04-12
- [x] [기능+UX] 나의 기록 대시보드 — History 캘린더 뷰 대시보드 고도화: KPI 행, 루틴 카드, 인사이트 카드, WEEK/MONTH 토글, 딥로그 링, empty state 블러 | done: 2026-04-12
- [x] [UX] 홈 프로필 카드 리디자인 — 히트 링 + 총기록/방문장소 3칸 그리드, 레벨 프로그레스바 | done: 2026-04-12
- [x] [UX] 이모지 피커 스크롤 앵커링 수정 + 대표 이모지 변경 — 라벨 매칭+closest 방식으로 정확한 섹션 이동 | done: 2026-04-12
- [x] [UX] 설정 아이콘 편집 심볼 palette → sticker 변경 | done: 2026-04-12
- [x] [기능] ICE 입력 분→초 단위 전환 — 10~90초 step 10, DB CHECK 완화+마이그레이션 | done: 2026-04-12
- [x] [UX] 루틴 뱃지 단위 suffix 추가 — 스토리/상세/이미지 내보내기에 m/s/set 표기 | done: 2026-04-12
- [x] [UX] 기록 카드 딥로그 표기 통일 — stacks 심볼 → 달력 스타일 스톤 점/링 | done: 2026-04-12
- [x] [기능] 트라이브별 루틴 기본값 — saunner/bather: HEAT 12m ICE 60s PAUSE 5m, jimi: HEAT 15m PAUSE 10m | done: 2026-04-12
- [x] [UX] 기록 페이지 기본 랜딩 메인 트라이브 + 탭 순서 유저 선호순 + 전체 맨 끝 | done: 2026-04-12

### 2026-04-11
- [x] [UX] TRIBE PICKS 카드 — 비로그인 홈에 트라이브 선택 유도 카드 (3초 오토 스크롤, 트라이브별 설명+CTA, /explore/type 연결) | done: 2026-04-08
- [x] [UX] 비로그인 홈 디테일 — ProfileCard 게스트 미리보기(SA-PIEN, 예비 사-피엔스), explore/[id] 기록하기 숨김, 홈 CTA "오늘 사우나 기록하기", 전체보기 숨김 | done: 2026-04-08
- [x] [UX] LoginPromptModal UX — WELCOME SA-PIEN 헤딩, "멤버 전용 기능이에요" 문구, "3초 로그인" 버튼 | done: 2026-04-11
- [x] [인프라] public_profiles 뷰 — 비로그인에서도 닉네임/칭호 표시 (gender 등 비공개 컬럼 차단) | done: 2026-04-08
- [x] [UX] 이모지 피커 카테고리 탭 바 — 섹션 간 빠른 이동, ETag 캐시 무효화 | done: 2026-04-08
- [x] [UX] 컬러 슬라이더 채도 상향 — 45→55% (탁함 개선) | done: 2026-04-08

### 2026-04-07
- [x] [보안] OAuth 에러 핸들링 — signInWithOAuth try-catch 추가, 네트워크 실패/OAuth 에러/callback 에러 통합 UI | priority: P0 | added: 2026-03-06 | done: 2026-04-07
- [x] [보안] 비로그인 경험 + Auth 가드 — /home·/sa-list 공개, LoginPromptModal로 찜/구독/생성/히스토리/설정 가드, 프로필 유도카드, 홈 CTA "로그인하고 기록하기", SA-LIST 내리스트 칭 숨김 | priority: P0 | added: 2026-02-28 | done: 2026-04-07
- [x] [최적화] Google Fonts next/font 전환 — Oswald/Libre Franklin/Noto Sans KR 셀프호스팅, no-page-custom-font 워닝 제거 | priority: P3 | added: 2026-03-06 | done: 2026-04-07
- [x] [UX] PlaceCard 시설칩 최대 2개 + 1줄 고정 — flex-nowrap overflow-hidden, whitespace-nowrap, slice(0,2) | done: 2026-04-07
- [x] [UX] 이모지 피커 개선 — 사람/몸·기호·깃발 카테고리 제거(API 프록시 필터링), 섹션 제목→구분선, 이모지 28px 확대, 6열 | done: 2026-04-07
- [x] [UX] 컬러 슬라이더 톤 조정 — 채도 75→45%, 밝기 55→62% 머티드 파스텔. COVER_TONE+coverHex() 상수 통일 | done: 2026-04-07
- [x] [인프라] verify-gate hook 버그 수정 — find에 -type f 추가, .json 디렉토리 오인 방지 | done: 2026-04-07
- [x] [기능] SA-LIST UI 리디자인 — 헤더 "SA-LIST" 통일, 필터칩 Chip 교체+이모지 제거, 섹션 헤더 통일, Featured 카드 정사각형+글래스 쉐도우, Hue 슬라이더 커버 색상, Frimousse 이모지 피커(lazy-load), default 리스트 ♨️ 고정+glass-card 구분, 내 리스트 정렬(default 상단 고정) | done: 2026-04-07
- [x] [버그] PlaceCard 시설칩 아이콘 누락 — FACILITY_ICON_MAP 연결 + cold-bath 따옴표 오염 데이터 44건 정리 + 방어 로직 추가 | done: 2026-04-06
- [x] [기능] 프로필 아이콘 커스터마이징 — DB profile_color/profile_emoji 추가, 설정 > 아이콘 편집 페이지, ProfileCard 레이아웃 D(왼쪽 아이콘+닉네임+칭호), HueSlider+Frimousse 재사용, 기본값 트라이브 컬러+이모지, EmojiPickerField 공용 컴포넌트 추출 | done: 2026-04-07

### 2026-04-06
- [x] [데이터] 신규 시설 9건 등록 + 온도 보강 4건 — 한림탕/리버사우나/소금강스파/봉래탕/서울사우나/인천조탕/라파사우나/동아온천사우나/씨메르. 노다지·아쿠아필드·워커힐·오레브 온도 보강. 습식 CHECK 65→75 통일 (012) | done: 2026-04-06

### 2026-04-04
- [x] [UX] 사-리스트 피드 재구성 — 상단 칩(내 리스트·최신·인기) 단일 스크롤 필터, 기본 탭 **인기**; 구독 목록을 「내 리스트」 화면 안 「구독 중」 섹션으로 통합; `is_featured`만 가로 캐러셀, 세로 피드는 피처 제외로 중복 방지; 본인 공개 리스트는 구독 버튼 없음 | done: 2026-04-04
- [x] [기능] lists.cover_emoji + ListFormSheet 커버 이모지(선택) — 마이그레이션 `013_lists_cover_emoji.sql`, 생성/편집·`createList`/`updateList` 반영; `getPublicLists(sort: popular|recent)` + `getFeaturedPublicLists()`; `usePublicLists`/`useFeaturedPublicLists`(탭별 fetch 스킵) | done: 2026-04-04
- [x] [리팩토링] 사-리스트 UI 컴포넌트 분리 — `featured-sa-list-card`, `sa-list-feed-row`, `sa-list-filter-chip`; 피처 카드 `aspect-[5/4]`·단일 이모지; 커버 색 팔레트 고채도 팔레트로 교체 | done: 2026-04-04
- [x] [문서] CLAUDE.md — 이모지 허용 범위에 리스트 커버·사-리스트 필터 칩 라벨 명시 | done: 2026-04-04
- [x] [데이터] DB 품질 대규모 수정 (011) — 포도호텔→아라고나이트 분리, Kumeya 오매핑, 시설유형 재분류 11건, 해외 주소 40건 정리, country_code 11건, 온도 이상치 5건, 그린사우나/관악 이름 수정 | done: 2026-03-27
- [x] [데이터] 카톡 재추출 + DB 교차검증 — 2600줄 신규 대화 분석, 온도/시설/장문리뷰 추출, DB 크로스체크(MISMATCH 9건), 호텔 부대시설 조사, 리서치 문서 체계화(RESEARCH_INDEX.md) | done: 2026-03-27
- [x] [데이터] 큐레이션 리스트 후보 정리 — 13개 테마(냉탕/노천/24시/세신/동네/온천/타투/도쿄/밥/슐렝2023-2025/SPA!대상), 사우나슐렝 전체 리스트 조사, Spa Alps 밥맛집 확인 | done: 2026-03-24

### 2026-03-23
- [x] [기능] SA-LIST 전체 구현 — DB 스키마(010) + 서비스 + 인스타식 저장 UX + 리스트 생성(태그+장소+메모) + 구독/해지 Undo + 어드민 추천(is_featured) + 발견 탭 캐러셀 | done: 2026-03-23
- [x] [리팩토링] Devil's Advocate 이슈 해결 — usePlaces→usePlaceSearch, N+1→RPC, 구독 guard, 스낵바 ref, share/visibility 중복 추출, DB 트리거→코드 이동 | done: 2026-03-23

### 2026-03-21
- [x] [기능] 딥로그 탕/사우나 온도 통합 — 온탕/열탕/냉탕 토글 통합섹션 + 건식/습식 tribe별 분기 + 점수 미선택/재클릭 해제 | done: 2026-03-21
- [x] [기능] 세신/마사지 리뉴얼 — scrub_types 칩(복수선택) + scrub_cost + 만족도. DB: scrub_types TEXT[], scrub_cost INT | done: 2026-03-21
- [x] [기능] 어드민 로그 비가시화 — 홈 피드/장소 카드/트라이브 통계에서 제외. 온도/비용 집계만 포함. RPC 어드민 제외 | done: 2026-03-21
- [x] [콘텐츠] 카톡 원본 재추출 + DB 반영 — 60건 태그/온도/메모 보강 + orphan 3건 통합 | done: 2026-03-21
- [x] [UX] 홈 라이브/추천 UI 정리 — 카드 폭 통일, compact 4줄 고정, 문구/모달 통일 | done: 2026-03-21
- [x] [정리] 시드 작업 파일 아카이브 — 플랜 11개 + 리서치 19개 아카이브, 스크립트 16개 삭제, rename | done: 2026-03-21

### 2026-03-20
- [x] [콘텐츠] 시드 데이터 230건 벌크 등록 — 4소스 통합, API 매칭, 지도명 sync, 오매칭 수정, 어드민 로그 생성 | done: 2026-03-20
- [x] [기능] DB 스키마 대규모 개편 — facility_type 6종 + bath_policy 분리 + 온탕/열탕 분리 + 딥로그 확장(청결도/습식/열탕) | done: 2026-03-20
- [x] [기능] 시설유형 UI + 타투 커버 — 시설유형 5종 칩 + 탕구분 칩 + JP 타투 커버 모달 + tattoo-cover 태그 | done: 2026-03-20
- [x] [UX] 홈 화면 전면 재설계 — 캘린더→추천/커뮤니티 피드 + UserLogCard + 찜질파 뱃지 전용화 | done: 2026-03-20
- [x] [UX] 스토리 카드 + 내보내기 — 하단 칭호/닉네임 + 찜질파 SWEAT 뱃지 + 베타 칭호 플래그 | done: 2026-03-20
- [x] [법률] 이용약관 + 개인정보 처리방침 — 초안 + 로그인 동의 문구 + 페이지 라우팅 | done: 2026-03-20

### 2026-03-13
- [x] [기능] 칭호 시스템 — XP/레벨 + 마일스톤/랜덤(340종) + 프로필 + 설정 관리 | done: 2026-03-13
- [x] [기능] 스토리 Canvas 렌더러 + 사-피 리포트 개편 + 장소 정보 수정 | done: 2026-03-13
- [x] [리팩토링] 온보딩·로그·딥로그 UI 정리 + DB bath_gender 이동 + sweat/purposes 정리 | done: 2026-03-13
- [x] [UX] 탐색 더보기 + 글래스 카드 + 트라이브 필터 + 장소 소셜 설계 | done: 2026-03-13

### 2026-03-08~10
- [x] [기능] 기록 핵심 — 날짜/시간 편집 + 비용 통화 선택 + 기록 흐름 수정 + 스토리 에디터 | done: 2026-03-10
- [x] [UX] 네비게이션 — 하단 바 + 병합 모달 + 기록→장소 링크 + 이탈 워닝 | done: 2026-03-08
- [x] [버그] 달력 1일 밀림 + Naver 지도 링크 + 삭제 후 stale + 딥로그 복원 | done: 2026-03-10

### 2026-03-01~06
- [x] [인프라] DB 기반 완성 — Supabase 연동 + places DB 전환 + CRUD + 타입 동기화 + 레거시 정리 | done: 2026-03-04
- [x] [리팩토링] 중복 로직 제거 + TribeId 통합 | done: 2026-03-08
