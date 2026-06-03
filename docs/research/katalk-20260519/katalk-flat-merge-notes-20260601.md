# 통합 CSV 생성 노트 (2026-06-01)

산출물: `katalk-extract-20260519-flat.csv` (144 국내 행, 15열)
생성 스크립트: `scripts/katalk-merge-flat.mjs` (재실행 가능, 온도 override 명시 인코딩)

## 1. 컬럼 (15)
`name, region, dry_temp_c, steam_temp_c, cold_bath_temp_c, hot_bath_temp_c, very_hot_bath_temp_c, facilities, scrub_cost_krw, entrance_cost_krw, source_chunk, source_record, raw_quote, notes, canonical_name`

- 기존 14열 규격 + **`canonical_name`(15열째)** 추가: 그룹 A/B alias→정식명 매핑. 원본 `name`(카톡 표기)은 보존(추적성). 미매핑은 빈값.

## 2. 행 수 회계
| 청크 | 원본 | 유지 | 제외 |
|---|---|---|---|
| 1 | 22 | 21 | 카마타온센(해외) |
| 2 | 28 | 27 | 쿠알라룸푸르 매리어트(말레이시아·해외) |
| 3 | 37 | 36 | 아리마 타이코노유(일본·해외) |
| 4 | 33 | 31 | 홍콩 리젠트, 토토켄(해외) |
| 5 | 30 | 29 | Recharged(베트남 다낭·해외) |
| **합** | **150** | **144** | **해외 6** |

> 핸드오프 v2는 "145행"으로 기재했으나 실제 chunk 파일 합은 150행(22/28/37/33/30). 해외 6 제외 → **국내 144행**.
> 해외는 "별도 유지" 결정에 따라 `overseas-facilities-review.md`(23개 검증 완료)에서 관리. CSV 미포함.

## 3. chunk-2·chunk-4 재정규화 (핵심)

기존 flat CSV의 컬럼 규격 위반을 원출추출 MD의 권위 온도로 교정:

- **chunk-2**: 13열(`very_hot` 컬럼 통째 누락). 온탕·열탕이 한 칸에 병합된 행 존재(예: 드래곤머큐어 "40-43"). 일부 행은 인접 record 값 오염(예: 청담프리마 rec2676은 노천탕42만 원문에 있는데 cold13/hot41이 들어가 있었음 → 제거). → `katalk-extract-chunk2.md §C` 기준 5개 온도 컬럼 전면 재기입.
- **chunk-4**: 컬럼 시프트(`dry` 컬럼 없음, 건식값 quote에만), 마지막 열이 notes가 아니라 신뢰도(HIGH/MEDIUM). → `katalk-extract-chunk4.md §D-1/§C` 기준 재기입. 신뢰도는 `notes`에 `[HIGH]` 형태로 이동.
- chunk-1/3/5: 14열 규격 유지, 그대로 사용.

검증된 행(스팟체크 통과): 르네상스(건90/습50/온39/열41), 드래곤머큐어(냉21/온40/열43), 웨스틴(건88/습53/냉18/온40/열43), 오라카이(온40/열44/냉20/습53/건90), 스타필드→아쿠아필드 하남.

## 4. canonical_name 매핑 (그룹 A/B, 27행 매핑)
프리마계열→프리마스파 / 우리유황(온천)→우리유황온천 / 더앤(현남·양양)→더앤리조트 스파 / 안토 / 노다지·프라임노다지→프라임노다지사우나 / 쉐레이→쉐레이암반수사우나 / 스파앳홈 T2 / #파주강남24시→강남24시사우나 / 송해원→송도해수온천 송해온 / 아늑 구로 루프 / 웨스틴 조선→웨스틴 조선 서울 / 해미안→해미안녹차해수사우나 / 하남 스타필드 스파→아쿠아필드 하남(그룹C 병합)

## 5. 미해결/한계 (DB 단계에서 처리 필요)
1. ~~AMBIG 부산 프리마~~ **해결(2026-06-01)**: 부산 프리마(c1 rec1173)는 청담 프리마스파와 **별개 시설**. canonical_name=`호텔 프리마 부산`, **facility_type=hotel-spa**. 청담 **프리마스파는 facility_type=public-bath**(대중목욕탕). 두 분류는 DB enrich(#18) 시 적용. (rec735 "프리마"/마포 표기는 region noise로, 청담 프리마스파로 매핑 유지.)
2. **chunk-3/5 열탕(쑥탕) 누락**: 컬럼 어긋남 아닌 *완전 누락*(예: 노다지 쑥탕41.8 미기재). raw_quote에 원문 보존 → DB enrich 시 quote에서 복구. CSV 온도값은 보수적.
3. **그룹 C 행 분리는 미적용**: 강변스파랜드 남/여 분리, 리버사이드 3시점 logs, 레몬 냉탕23 단일 등은 CSV 1행=1record 원칙 유지하고 **DB enrich(#18) 단계에서 적용**. (단 레몬 rec7154 냉탕23은 그룹C 결정값으로 이미 반영.)
4. **region 컬럼 신뢰도 낮음**: 기존 추출에서 region이 발화자 거주지와 시설 위치가 섞여 오염된 행 다수(예: "프리마스파"/"경기 구리"). DB 매칭 시 region 의존 금지, name+facilities 기준.
5. **오레브 rec6778 중복**: chunk3·chunk4 양쪽 등장(다른 시점 리뷰). DB 매칭 시 1개 place로 병합.

## 6. 다음 단계 (#16 DB cross-check)
- `places` 테이블과 144행 매칭. canonical_name 우선, 없으면 name.
- HIGH 매칭→enrich 후보 / 모호→유저 검토(16건 오매칭 재발 방지) / 신규→place 추가 후보.
- 해외 23건은 별도 트랙(overseas-facilities-review.md).
