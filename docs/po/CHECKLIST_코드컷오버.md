# 코드 컷오버 체크리스트 (029 적용 완료 후)

대상: 029(expand) 적용된 DB 위에서 **한 배치로** 코드를 블록 모델로 전환.
근거: `로그_스키마_매핑_영향분석_20260605.md`(§11 영향 전수) · `supabase/029_*.sql` · `supabase/030_*.sql`.

> ⚠️ 이 문서는 **작업 전 1회 정독 + 작업 후 "완료 후 필수 검증"까지 실행**해야 끝난 것으로 친다.

---

## 0. 작업 원칙 (어기지 말 것)
- [ ] **한 배치 배포** — 증분 금지. 토대(A)→폼(B)→표시면(C) 한 PR.
- [ ] **하드코딩 금지** — 블록/시설/온도범위/카테고리/단위는 전부 `content.ts`의 `BLOCK_TYPES`(+`PLACE_SPECS`) 단일 출처. 컴포넌트에 블록 목록·라벨·범위 직접 박지 말 것.
- [ ] **데드코드는 "정말 안 쓰는지 grep 확인 후" 제거** — 추측 삭제 금지. 제거 전 `grep -rn` 으로 참조 0 확인.
- [ ] **결정 필요 항목은 유저 확인 후 진행** (맨 아래 "결정 필요" 목록).
- [ ] **캐시 컬럼은 블록에서 파생** — 입력은 log_blocks가 정(正), logs 온도/시간/score 컬럼은 저장 시 코드가 파생해서 채움(이중 입력 금지).

---

## A. 토대 (이 순서대로)

### A1. `src/constants/content.ts`
- [ ] `BLOCK_TYPES` SSOT 추가 (영향분석 §10 TS 그대로 — id/label/icon/category/tempRange/durUnit/cacheCol/evalOnly/custom). `BLOCK_TYPE_MAP`, `TRIBE_DEFAULT_BLOCKS`도.
- [ ] `PLACE_SPECS`: `food`→`snack` 개명, **`restaurant`(식당) 추가**(AMENITIES 또는 BEYOND, icon `restaurant`).
- [ ] `BLOCK_CATEGORIES`('heat'|'ice'|'rest'|'beyond') 상수.
- [ ] ⚠️ 기존 QUICK_LOG/DEEP_LOG 중 **블록 모델로 대체되는 부분만** 정리(트라이브 품질·청결·혼잡·메모·동행·세신·매점·기타온도). 남길 것(트라이브 품질 라벨/스텝 등)은 보존.

### A2. `src/types/index.ts`
- [ ] `deep_log` 중첩 타입 제거 → logs 평탄 필드로 흡수.
- [ ] `blocks: LogBlock[]` 추가 (id/seq/block_type/category/temp/duration_sec/score/cost/memo/norepeat).
- [ ] 컬럼명: `sauna_temp→dry_sauna_temp`, `jjim_temp→bulgama_temp`, `pause_time→rest_time`, `store_*→snack_*`, `scrub_satisfaction→scrub_score`, + `very_hot_bath_temp/ice_bath_temp/salt_sauna_temp/open_air_bath_temp/ice_room_temp/restaurant_*`.
- [ ] 제거: `food_eaten`, `has_*`(파생으로 대체).

### A3. `src/lib/logs-service.ts` (가장 큼 — 꼼꼼히)
- [ ] `LOG_SELECT`: `deep_logs(*)` → `log_blocks(*)` (정렬 `order(seq)` 포함).
- [ ] `toLogWithPlace`: deep 조인 매핑 제거 → logs 평탄 필드 + `blocks` 배열 매핑.
- [ ] `insertLog`: 단일 행(세션 + 평탄 deep 필드) 저장 **+ `insertBlocks(logId, blocks)`**.
- [ ] `updateLog`: 동일 + 블록 전량 교체(delete-insert 또는 diff).
- [ ] **`saveOrUpdateDeepLog` 삭제** + quick↔deep **key-presence 협상 로직 삭제**(단일 소스라 불필요).
- [ ] **캐시 파생 함수 신설**(저장 시 블록→logs 캐시):
  - 온도 캐시(10종) = `cacheCol` 지정 블록의 대표 온도(같은 타입 다중이면 첫/대표 1개).
  - `heat_time`(분)=Σheat 사우나 duration_sec/60(**primary 사우나 귀속 규칙**), `ice_time`(초)=Σice duration_sec, `rest_time`(분)=Σrest/60, `repeat`=전역.
  - `primary_sauna_kind` = 메인 사우나 선택값(첫 블록 자동 ❌, B2 참조).
  - score 파생: 수면/휴식 블록→`rest_quality`, scrub/massage→`scrub_score`(+`scrub_cost`), `snack`→`snack_*`, `restaurant`→`restaurant_*`.
  - `scrub_types` = 블록 존재서 파생(scrub→'scrub', massage→'massage').
- [ ] **자동 시설태깅 블록 기준 재작성**: 온도/평가 블록 → `places.facilities` 태그(dry-sauna·…·**snack·restaurant**). 기존 has_* 기준 코드 제거.

---

## B. 입력 폼 (v6 디자인)

- [ ] `src/app/log/page.tsx` + `src/app/log/deep/page.tsx` → v6 단일 폼으로. deep 별도 저장 호출 제거(단일 insert).
- [ ] **B2. primary 메인 사우나 선택 UI**: 건식+습식 블록이 **둘 다** 있을 때만 노출(첫 블록 자동지정 금지).
- [ ] **B3. 시간 입력 단위**: 냉탕/급냉 **초**, 그외 **분** (`BLOCK_TYPES.durUnit`). UI 표기만 다르고 저장은 `duration_sec`(초)로 환산.
- [ ] **B4. 편집 진입**: 기존 로그 편집 시 `log_blocks` 로드 → 타임라인 재구성(레거시는 029 백필로 블록 있음).
- [ ] 더자세히: 기본=청결·혼잡·메모 / 선택=동행·세신·입장료·기타온도. **세신/매점/식당/수면 평가는 타임라인 행에서**(블록 score/cost/memo).
- [ ] 탕(`bath_gender`)은 `deriveBathGender` 자동 — 입력 UI 만들지 말 것.

---

## C. 표시면 (깨짐방지 먼저, 그다음 재작성)

### C1. 깨짐방지 (필수 — 안 하면 즉시 깨짐)
- [ ] `deep_log.x → x` 평탄화: `history/[id]`, `record-card.tsx`, `user-log-card.tsx`, `home-calendar.tsx`, `reward-service.ts`, `rewards.ts`.
- [ ] 컬럼 rename 반영(전 표시면): dry_sauna_temp/bulgama_temp/rest_time/snack_*/scrub_score.

### C2~C5. 재작성 (블록 렌더)
- [ ] **스토리 카드** `story/page.tsx` + `image-export.ts`: 고정 뱃지 → 블록 시퀀스 + 레이어 토글(루틴/+온도/+시간).
- [ ] **히스토리 상세** `history/[id]`: 고정 뱃지 → 리추얼 타임라인(블록별 온도·시간·순서·반복제외).
- [ ] **장소 상세** `explore/[id]`: `calcTempAvg` rename, very_hot/ice를 logs 참조로(deep 아님), **snack/restaurant + 신규 온도(소금/노천/아이스방) 집계** 추가.
- [ ] **통계** `history-stats.ts` + `insight-card.tsx`: rename. ⚠️ **`ice_time` 의미 변경**(냉탕 단발→ice 총 냉각시간) → 'ICE s' 라벨/계산 재검토.
- [ ] `utils.ts` `DETAIL_FIELDS`/`getDetailText`: 필드명 rename + rest_quality 경로.
- [ ] `sauna-temp-helpers.ts`: `dry_sauna_temp` 등 새 명.
- [ ] `log-edit-session.ts`: 필드 rename + 블록 포함하도록 확장.

---

## D. 데이터 정합 (배포 전후)
- [ ] **배포 직전**: 029의 STEP 2(컬럼 백필)·STEP 5(블록 백필) **재실행** — 029~배포 gap 동안 구앱이 옛 컬럼에 남긴 데이터 동기화(idempotent).
- [ ] **`places.facilities` 'food'→'snack' 치환**(content.ts PLACE_SPECS 개명과 **동시**): `update places set facilities = array_replace(facilities,'food','snack') where 'food' = any(facilities);`
- [ ] 검증 쿼리(영향분석 §6): 유저 로그 중 온도/루틴 있는데 블록 0개인 행 → **0이어야 함**.

---

## E. 정리 (코드 검증 통과 후에만)
- [ ] **030_cleanup 실행 전** grep으로 잔재 0 확인 → 그 다음 `030_cleanup_deep_logs.sql`(옛 컬럼 + deep_logs DROP).
- [ ] 데드코드 제거(참조 0 grep 확인 후): `saveOrUpdateDeepLog`, deep form 잔재, `has_*`/`food_eaten` 참조, `store_*`/`scrub_satisfaction`/`sauna_temp`/`jjim_temp`/`pause_time` 잔재.
- [ ] 사용 안 하게 된 상수/헬퍼(QUICK_LOG/DEEP_LOG 일부) — **정말 안 쓰는지 확인 후** 제거.

---

## 🔴 결정 필요 (유저 확인 후 진행)
- [ ] **로그/딥로그 폼 통합 방식**: 한 파일로 합칠지, 라우트 유지하며 컴포넌트만 통합할지.
- [ ] **`ice_time` 라벨**: 의미가 "총 냉각시간"으로 바뀌는데 스토리/통계 표기 문구.
- [ ] **페르소나 밴드 영문 문구** (MODE / TODAY I'M A / LOGGING AS — v6 미정).
- [ ] **user_routines 추천 시드** 내용(토토노우 입문 등) — 시드 INSERT 전 확정.
- [ ] **장소 상세 신규 온도 노출 범위**(소금/노천/아이스방/식당까지 다 보여줄지).

---

## ✅ 완료 후 필수 검증 (반드시 실행 — "다 했다" 금지, 증거로 확인)
- [ ] `npm run build` / 타입체크 **통과**.
- [ ] **잔재 grep = 0** (아래 전부 hit 0, 단 029/030 SQL·주석·legacy 설명 제외):
      `grep -rn "sauna_temp\b\|jjim_temp\|pause_time\|store_score\|store_memo\|has_store\|scrub_satisfaction\|food_eaten\|deep_log\|saveOrUpdateDeepLog\|deep_logs" src`
- [ ] **실제 앱 동작**(verify): 트라이브 전환 → 블록 선택 → 온도·시간(타임라인) → 트라이브품질+또갈래요 저장 → 히스토리 상세 → 스토리 카드 → 장소 평균. 5상태(empty/loading/partial/error/ideal) 확인.
- [ ] **데이터 확인**: 새 로그 저장 시 `log_blocks` 행 생성 + logs 캐시 컬럼(온도/시간/score) 채워짐. 기존 로그 편집 시 블록 정상 로드.
- [ ] **하드코딩 점검**: 블록/시설/범위/단위가 컴포넌트에 직접 박힌 곳 없는지(전부 BLOCK_TYPES 경유).
- [ ] **030 전 안전 확인**: `deep_logs`/옛 컬럼 참조 0 재확인 → 030 실행 → `select * from deep_logs` 에러나면 정상.
- [ ] 작업 후 `docs/po/로그_스키마_매핑_영향분석_20260605.md` §11에 누락 발견분 있으면 반영(다음 사람 위해).
