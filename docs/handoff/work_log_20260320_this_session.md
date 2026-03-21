# 작업 내역 통합 (2026-03-20 ~ 03-21)

> 모든 터미널 세션 통합. 타임스탬프 기준 정렬.

---

## 01:37 — 딥로그 확장: 청결도 + 습식사우나 + 열탕 (`5ae862b`)
- deep_logs 테이블: cleanliness, has_wet_sauna/wet_sauna_temp, has_hot_bath/hot_bath_temp 추가
- 청결도 1-5 슬라이더 (모든 tribe 공통)
- 습식사우나 토글+온도 40-65°C (사우너파만)
- 열탕 토글+온도 38-46°C (사우너파+목욕파)
- 딥로그 UI 순서: 동행→청결도→혼잡도→비용→토글→메모
- place.facilities 자동태그 (습식/열탕 토글 ON 시)
- Explore 사-피 리포트: tribeSubMetrics에 습식/열탕, 더보기에 청결도
- History 딥로그 카드: 새 필드 표시

## 01:58 — 습식/열탕 토글 라벨 통일 (`6493c1c`)
- 습식 '이용' / 열탕 '기록' → 둘 다 '기록' / '기록 중'으로 통일

## 13:16 — 홈 화면 전면 재설계 (`5c702b4`)
- 캘린더 중심 → 추천/후기 중심 전환
- 레이아웃: Header → ProfileCard → 오늘의 기록 → 기록하기 CTA → 추천 → 커뮤니티 → BottomNav
- 신규: `user-log-card.tsx`, `use-home-recommendations.ts`
- `getCommunityFeed` + `useCommunityFeed` 추가
- `UserLogCard` 컴포넌트 추출 (explore/[id] 인라인 → 재사용)

## 15:06 — 찜질파 루틴 뱃지 전용화 (`11073e9`)
- 스토리/히스토리 뱃지: HEAT/PAUSE/RPT/SWEAT (찜질파 전용)
- 사우너/목욕파는 기존 HEAT/ICE/PAUSE/RPT 유지
- 찜질파 퀵로그 루틴에서 ICE 입력 제외

## 15:14 — 커뮤니티 피드 가로스크롤 (`828e1e4`)
- 사-피엔스의 흔적: 세로 리스트 → 가로 스크롤
- `UserLogCard`에 `compact` prop 추가

## 15:28 — 딥로그 순서 변경 + SWEAT /5 (`4471cb1`)
- 딥로그 입력/표시 순서: 동행→혼잡도→청결도→비용→토글→메모
- 찜질파 스토리 SWEAT 뱃지에 /5 suffix

## 15:44 — 찜질파 뱃지 3칸 축소 (`fc1b670`)
- SWEAT 상단 메트릭과 중복 → 뱃지에서 제거, 3칸으로

## 15:57 — 홈 CTA 스타일 통일 (`12693dc`)
- 인라인 스타일 → `btn-primary` 클래스

## 16:30 — 온탕/열탕 분리 (`2d0c8cd`)
- deep_logs: has_hot_bath→has_very_hot_bath, hot_bath_temp→very_hot_bath_temp rename
- 온탕(35-42°C): 사우너파 딥로그 입력 → logs.hot_bath_temp에 저장
- 열탕(38-46°C): deep_logs.very_hot_bath_temp
- autoTag: hot-bath(온탕), very-hot-bath(열탕) 분리

## ~17:00 — 시드 데이터 정리 시작 (이 터미널)
- PO 브리핑 → 보상뱃지 → 칭호 시스템으로 대체 확인 → BACKLOG Done 처리
- notion-seed-candidates.json gender 태그 전면 교정 (129건)
  - female-only/male-only → facility_type(gender-bath 등) + review_bath_gender 분리
  - theme_keyword 기반 매핑: 대중목욕탕→gender-bath, 호텔→gender-bath, 프라이빗→private-bath
  - 호텔 18건 웹서치 검증 → 전부 gender-bath 확인
  - hotel-sauna / resort-spa / gym-sauna 태그 추가

## 17:31 — 습식사우나 온도 상한 65→70°C (`ccddeb2`)

## 17:57 — 습식 70°C 라벨 복원 (`fcb9106`)
- 극한→찜기

## ~18:00 — 시드 데이터 소스별 검증
- notion-candidates 105건: 시설 실존 웹서치 검증 (4개 에이전트 병렬)
  - confirmed 101 / not-sauna 4 / unknown 9 / 중복 19
  - 제외: 마포365구민센터(공공), 버핏그라운드(피트니스) → 태그 교정
  - 석정휴스파, 솔샘온천 → resort-spa
- csv 46건: 닉네임 vs 실제 시설 구분
  - confirmed 33 / nickname 1(뜨끈란온천) / unknown 9
- seed-data 90건: 한국 44 + 해외 48건 시설태그 웹서치 추출
- simple-review 37건: JSON 변환

## ~19:00 — 성별 전용시설 감사
- male-only 7건: サウナ東京, 品川サウナ, 호텔더디자이너스, DESSE, KIWAMI, ウェルビー栄, わがまち
- female-only 2건: SteaMs., 보리사우나
- mixed 18건 (해외)
- 한국 mixed-bath 18건 → gender-bath 교정 (통합 스크립트 오류)

## ~20:00 — 4개 소스 통합 → seed-data-unified.json
- 229건 (중복 제거 35건, 제외 10+건)
- 제외: 드래곤힐스파(폐업), 뜨끈란온천(닉네임), 한남사우나, 청수탕, 백두산랜드, 연지사우나, 에가톳, 덕산/도고/가조/오색온천(지역명)
- 웨스틴 조선 서울 수동 추가 (스텔라 리뷰)

## 20:17 — facility_type + bath_policy 분리 (`f004186`)
- facility_type: small-bath, public-bath, hotel-spa, private-sauna, special, gym-sauna
- bath_policy: gender-bath(기본), male-only, female-only, mixed
- deriveBathGender()를 bath_policy 기반으로 전환
- 장소 등록/편집 UI: 시설유형 + 탕구분 2섹션 분리
- Explore 필터/배지: bath_policy 참조

## 20:27 — deriveBathGender에 facility_type 반영 (`aef2669`)
- private-sauna → private/private_male/private_female 처리
- localStorage selectedPlace에 facilityType도 전달

## ~20:30 — 시드 데이터 필드명 통일 + 온도 정제
- warm_temp→hot_bath_temp, hot_temp→very_hot_bath_temp, cold_temp→cold_bath_temp 등
- 온도 텍스트→숫자 변환 421건, 삭제 100건
- 습식/건식 혼동 교정 5건 (솔로사우나레포, 난곡, 성수탕, 오션스파, 율암)
- 온탕/열탕 스왑 3건 (네이처스파, 삼부건강랜드, 코오롱호텔)
- memo 합성: theme_keyword + one_liner + 카톡 키워드

## ~21:00 — venue_type(→facility_type) 분류 + 검증
- facility_type별 전수 리뷰 (스텔라 교차확인):
  - bulgama-house → 4건 (탕 없는 불가마 전문만)
  - private-sauna → 7건 (SATOYAMA/kolme 재검증 → public-bath)
  - hotel-spa → 3만원+ 또는 호텔명 또는 프리미엄 지정
  - small-bath → 스텔라 직접 확인 25건
  - public-bath → 나머지
- special: 불가마 6 + 면역공방 + Nuka to Yuge = 8건

## 21:14 — 시설유형 UI 정리 + 타투 커버 모달 (`afe0d12`)
- 시설유형: 대중목욕탕, 동네목욕탕, 호텔/프리미엄, 개인사우나, 특수(불가마,효소 등)
- 헬스장사우나: UI 숨김 (DB 유지, API 자동매핑용)
- 타투 칩 → 모달: tattoo-cover / tattoo-friendly 분기
- Explore 필터: tattoo-friendly 선택 시 tattoo-cover도 매칭

## 21:21 — 타투 커버 모달 일본만 (`20ac9d3`)
- JP 장소만 모달, 그 외는 바로 tattoo-friendly

## 21:29 — 홈 커뮤니티 카드 장소명+이모지 같은 라인 (`dfcae82`)

## 21:33 — 홈 추천 더보기 축소 + 문구 변경 (`a46cc3d`)
- '다음에 어디갈지 찾아보기' → '다음 사우나 찾아보기'
- 하단 간격 pb-24→pb-20

## 21:43 — 찜질파 SWEAT 뱃지 복원 (`367e9bd`)
- 루틴 뱃지 4칸 복원: HEAT/PAUSE/RPT/SWEAT(/5)
- 상단 메트릭: row1=REST_QUALITY만 (SWEAT는 뱃지로 이동)

## 21:56~22:04 — 스토리 카드 하단 레이아웃 (`defa1a1`, `b5680fe`)
- JOIN THE SA-PIENS → 칭호pill + 닉네임으로 대체
- 윗줄: tribe dot + 이름 / 아랫줄: SA-PI SAUNA(좌) + 칭호+닉네임(우)

## ~22:00 — shampoo-bodywash 태그 정리
- 134→41건: 한국 대중목욕탕 제거 (무료 제공 아님), 해외 미확인 제거
- 유지: 호텔/리조트/프라이빗/프리미엄찜질방 + 해외 확인된 곳
- 해외 12건 추가 확인 (사우나이키타이 + 공식사이트)

## 22:24 — 스토리 내보내기 반영 + 베타 칭호 플래그 (`4b9e5b6`)
- 내보내기에 userNickname, userTitle, sweatQuality 전달
- 찜질파 내보내기 뱃지: HEAT/PAUSE/RPT/SWEAT(/5)
- IS_BETA 플래그 → true: '첫 사-피엔스' 고정

## 22:31~22:47 — 스토리 내보내기 정렬 보정 (`3910b71`~`5011f37`)
- 칭호pill 텍스트 -4px, SWEAT /5 -8px 보정

## 22:59 — 탐색 필터 탕구분 한글 라벨 (`6d82449`)
- FACILITY_LABEL_MAP/ICON_MAP에 PLACE_BATH_POLICY 추가
- male-only→남성전용, female-only→여성전용, mixed→혼탕

## 23:16 — 홈 툴팁 탭 시 사라짐 (`563b053`)

## 23:30 — 홈 더보기 넓이 + 설정 인스타 링크 (`5af98e6`)
- 더보기 min-w 50→70px, 한 줄 표시
- 설정 페이지: @sapi.sauna 인스타 링크 추가

## 23:49 — 법률 문서 초안 (`4f314fd`)
- 개인정보 처리방침 + 이용약관 (docs/legal/)

## 23:57 — 로그인 약관 동의 + 법률 페이지 (`e6dcc59`)
- 로그인 페이지: "로그인하면 이용약관과 개인정보 처리방침에 동의하게 돼요" + 링크
- /legal/terms, /legal/privacy 페이지 추가
- 설정 페이지: 약관/처리방침 버튼에 라우팅 연결

## 00:11 (03-21) — 홈 더보기 쉐브론 레드 (`81b02e7`)

## ~00:30 — 타투 정책 검증
- 한국 182건: 전부 tattoo-friendly (한국 대중탕은 타투 이슈 없음)
- 해외 48건: サウナイキタイ + 공식사이트 교차 검증
  - OK 25건, COVER 4건 (kolme kylä, 太閤の湯, 野乃なんば, スパメッツァ仙台)
  - NG 8건, UNKNOWN 6건
  - イキタイ ○/×/− 정확 해석 (이전 에이전트 오류 교정)

## ~01:00 — 24시 시설 확인
- 이름에 24시: 6건 (인아, 도봉산, 동양, 베뉴지아쿠아, 석천, 옥정)
- 메모에 24시: 2건 (네이버한방스파, 더파크스파랜드)
- 웹서치 확인: 8건 추가 (라성, 골드로즈, 삼호궁전, 스파디움, 스파렉스동묘, 클럽케이, 황금스파, 힐스파)
- 실로암사우나: 24시 아님 (05:00~22:00) — 에이전트 오류 교정
- 총 is_24h: 16건

## ~01:30 — 벌크 등록 스크립트 + 실행
- seed-places.ts: Naver/Google API 검색 → 좌표 + external_id 확보 → DB INSERT
- SEARCH_OVERRIDES: 수동 매칭 14건 (오매칭 방지)
- dry-run 테스트 → 실제 등록 229건 성공, 실패 0
- 어드민 로그 229건 생성 (온도/가격/메모)
- 결과: seed-registration-result.json (이름↔UUID 매핑)

## ~02:00 — 오매칭 수정 + DB 정합성
- Shiriuchi Onsen: Utopia Warakuen → 知内温泉 좌표로 수정
- TOTOPA: 일본어→로마자 (TOTOPA Toritsu Meiji Koen)
- 5건 수동 재매칭: 더메디스파→더 리버사이드 호텔, 안토, 워커힐, 더앤온천, 히든베이

## ~02:30 — 지도명 sync (DB + JSON 통일)
- sync-names.ts: 229건 Naver/Google 재검색 → name_original 업데이트
- 76건 변경, 15건 오매칭 차단 → fix-mismatched.ts로 재검색
- 오매칭 16건 개별 수정 (스파마린, AIRE 바르셀로나+뉴욕 분리 등)
- 한국 3건 google→naver 소스 전환 (단오풍정, 동양사우나, 천호목욕탕)
- katalk 27건 → naver 소스 통일
- AIRE Ancient Baths: 바르셀로나+뉴욕 2지점 등록 → 230건

## ~03:00 — 어드민 로그 노출 차단 + 카드 높이 (`d3e598d`, `e909c55`)
- explore/[id]: ADMIN_ID 로그 → 트라이브 통계 + 카드 목록에서 제외
- 온도/비용/청결도 집계에는 포함 유지
- user-log-card: min-h-[120px] 고정
- LogWithPlace 타입에 user_id 추가
- logs-service: toLogWithPlace에 user_id 매핑

---

## 변경 파일 요약

### 신규 생성
- `supabase/007_deep_log_expand.sql` — 딥로그 확장 마이그레이션
- `supabase/008_very_hot_bath_rename.sql` — 열탕 rename
- `supabase/009_facility_type_bath_policy_split.sql` — 시설유형/탕구분 분리
- `src/components/features/user-log-card.tsx` — 유저 로그 카드 컴포넌트
- `src/hooks/use-home-recommendations.ts` — 홈 추천 훅
- `src/app/legal/terms/page.tsx` — 이용약관 페이지
- `src/app/legal/privacy/page.tsx` — 개인정보 처리방침 페이지
- `public/legal/terms.md`, `public/legal/privacy.md` — 법률 문서
- `docs/legal/privacy-policy.md`, `docs/legal/terms-of-service.md` — 법률 원본
- `docs/research/legal-review-beta.md` — 법률 검토
- `scripts/seed-places.ts` — 벌크 등록 스크립트
- `scripts/sync-names.ts` — 지도명 sync 스크립트
- `scripts/fix-mismatched.ts` — 오매칭 수정 스크립트
- `scripts/unify-seed-data.py` — 4소스 통합 스크립트
- `scripts/seed-data-unified.json` — 통합 시드 데이터 230건
- `scripts/seed-registration-result.json` — place_id 매핑
- `scripts/seed-manual-review.json` — 수동 확인 목록
- `scripts/010_curated_lists_DRAFT.sql` — 큐레이션 테이블 드래프트
- `docs/plans/PLAN_*.md` — 7개 구현 플랜
- `docs/research/*.md` — 15+개 검증 리서치 문서

### 주요 수정
- `src/app/home/page.tsx` — 전면 리라이트
- `src/app/log/deep/page.tsx` — 청결도/습식/온탕/열탕 토글 추가 + 순서 변경
- `src/app/log/page.tsx` — deriveBathGender → bath_policy 기반
- `src/app/story/page.tsx` — 하단 레이아웃 + 찜질파 뱃지
- `src/lib/image-export.ts` — 내보내기에 닉네임/칭호/SWEAT 반영
- `src/lib/logs-service.ts` — 딥로그 필드 + 시설 자동태그 + user_id 매핑
- `src/lib/places-service.ts` — bath_policy 추가
- `src/app/place/add/page.tsx` — 시설유형+탕구분 분리 + 타투 모달
- `src/app/place/[id]/edit/page.tsx` — 동일
- `src/app/explore/page.tsx` — 필터 bath_policy 기반
- `src/app/explore/[id]/page.tsx` — 배지 + 어드민 로그 필터링
- `src/app/history/[id]/page.tsx` — 딥로그 표시 + 찜질파 뱃지
- `src/app/login/page.tsx` — 약관 동의 문구
- `src/app/settings/page.tsx` — 약관/처리방침 라우팅 + 인스타 링크
- `src/components/features/place-card.tsx` — bath_policy 배지
- `src/components/features/user-log-card.tsx` — min-h-[120px] 고정
- `src/components/features/filter-controls.tsx` — 한글 라벨
- `src/types/index.ts` — FacilityType/BathPolicy 타입 + user_id + deep_log 필드
- `src/constants/content.ts` — PLACE_VENUE_TYPE/BATH_POLICY + DEEP_LOG 확장
- `src/constants/rewards.ts` — IS_BETA 플래그
- `src/app/onboarding/page.tsx` — 베타 칭호 분기

### DB 마이그레이션 (Supabase에서 실행됨)
1. `007` — deep_logs: cleanliness, wet_sauna, hot_bath 컬럼 추가
2. `008` — deep_logs: hot_bath→very_hot_bath rename
3. `009` — places: bath_policy 추가 + facility_type 값 변경 + constraint 교체
- wet_sauna_temp CHECK 40-70 업데이트
- facility_type에 special 추가, bulgama-house 제거

### DB 데이터 변경 (스크립트 실행)
- places 230건 INSERT (시드 데이터)
- place_sources 230건 INSERT (Naver/Google 매칭)
- logs 229건 INSERT (어드민 시드 로그)
- deep_logs 229건 INSERT (온도/가격/메모)
- is_24h 16건 UPDATE
- name_original 76건 UPDATE (지도명 sync)
- 오매칭 16건 좌표/이름 개별 수정
- AIRE Ancient Baths 뉴욕 지점 추가 등록

---

## 미완료 / 다음 세션

### 코드 구현 대기
- `PLAN_venue_type_auto_mapping.md` — API 카테고리→시설유형 자동매핑
- `PLAN_tattoo_cover_ui.md` — 타투 커버 모달 (구현 완료, 플랜만 대기?)

### 데이터 보강
- 시설 태그 정확도: 리뷰어 태깅 오류 있음 (태화강 등). 유저 기여로 보완 예정
- 태그 없는 한국 시설 9건: 반도온천, 블루오션, 선수촌, 유림탕, 유진, 유천, 주신, 척산, 필예
- 해외 48건 주소: 벌크 등록 시 Google 좌표 확보됨, 상세 주소는 일부 미확인
- manual-review 26건: 이름 차이 건 (대부분 정상, 수동 확인 권장)

### 큐레이션
- 사우나슐렝/올해의사우나 등 큐레이션 리스트: UUID 매핑 완료, 기능 구현 시 DB 연결
- `scripts/010_curated_lists_DRAFT.sql` 준비됨
