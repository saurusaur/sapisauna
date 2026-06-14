# 핸드오프: 로그 블록 컷오버 — ✅ 전체 마감 (2026-06-13)

> **마감**: 029~034 마이그레이션 + 코드 컷오버 + 표시면 평탄화 + main 배포(PR #17·18·19) + 030 contract까지 완료.
> 무손실 검증 = `docs/po/archive/마이그레이션_무손실_대조리포트_20260613.md` (LOSS 0).
> 잔여 후속은 BACKLOG 참조 (032 건별검증·식당/메모 프로덕션 검증·루틴 섹션 재설계 P1).
> 아래 본문은 역사 기록.

작성 2026-06-07 / 최종갱신 2026-06-12 / 브랜치 **preview** (프로덕션 main 미머지) / **상태: 029 + 코드 컷오버 1~4단계 + 입력 폼 디자인 + 5단계 표시면 평탄화 7/7 완료 (2026-06-12, 감사 SSOT `docs/po/archive/로그_표시면_평탄화_매핑감사_20260612.md`). 같은 날: 리워드 분화(log+routine/detail), ice_time=침수만, heat=블록 계산, explore 신규온도 B안. 잔여=§3 #4(고아 정리)·#5(백필 재실행→030→머지)·루틴 섹션 재설계(BACKLOG P1). ✅스토리 연결 완료(2026-06-13, handoff_20260610_story_redesign.md 마감 — 카드 v3.5+Canvas+페이지 크롬 v3.6). ✅추가(2026-06-12): 온도 슬라이더 숫자 좌·라벨 우 스왑 + 평가 씰 좌·코멘트 우 정렬(slider.tsx, 시안 docs/po/archive/로그_루틴_슬라이더정렬_시안). 구버전 프로토타입(v2~v5·interactive·와이어프레임)은 docs/wireframes/archive/ — 디자인 기준은 v6 유일.**

> ⭐ **최종 디자인·구현 요약은 맨 아래 §12 참조** (이 세션 다듬기 완료분). 디자인 기준은 메모리 `feedback-ui-spacing-rule`(10/40)·`feedback-typography-scale`.

> SSOT: `docs/po/archive/PLAN_로그_컷오버_20260606.md` (컷오버 정본) · `docs/po/로그_스키마_매핑_영향분석_20260605.md` (스키마) · 디자인 `docs/wireframes/[final]_로그_프로토타입_v6_20260606.html` · 메모리핀 `project-log-schema-redesign`

---

## 0. ⚠️ 작업 시 반드시 지킬 규칙 (유저가 반복 강조)

1. **컬러 하드코딩 절대 금지.** hex(`#fff` 포함) 금지, 신규 색 금지. **앱 기존 토큰만**:
   - `var(--color-primary)`(빨강 도장/CTA) · `--color-primary-light`(틴트) · `--color-muted`(슬롯 채움) · `--color-border` · `--color-card`(카드) · `--color-muted-fg` · `TRIBE_COLORS[tribe]`(=`--color-saunner/bather/jimi`) · 텍스트 `text-stone-*` · 배경 `bath-tile-bg`.
   - page.tsx 상단 `T` 객체에 토큰 매핑돼 있음.
   - 그림자/연결선도 토큰·Tailwind(`shadow-md/lg`, `bg-stone-300`)만.
2. **기존 컴포넌트·패턴 재사용 우선.** 새 컴포넌트 남발 금지. (예: 공유 `Slider`에 `seal`/`stamp` 변형 추가해서 재사용 — 별도 컴포넌트 X)
3. **v6 레이아웃 그대로 구현.** 특히 리추얼 = **단일 행** `[도장 노드+라벨 | 온도 또는 평가 | 시간 또는 메모]` + 노드 사이 연결선. (세로 스택 X)
4. **메인(main) 안 건드림.** preview에서만 구현·검증. 프리뷰 = 유저 테스트 전용이라 **dual-write 생략**(구 컬럼 sauna_temp 등 안 씀). 머지는 마이그레이션·검증 후 한 배치.
5. 결정 포인트는 유저에게 확인. 도메인(사우나) 판단 추론 금지. 코드 변경 전 "이게 최선인가" 비판적 검토.

---

## 1. 완료된 코드 (preview 푸시 완료)

커밋: `a509f2b`(토대) → `af4a936`(폼) → `dc6b265`(룩) → `3f9eeeb`(평가/온도 v6) → `4501fbb`(단일행) → `49fa564`(드래그/옵셔널/통화).

| 파일 | 내용 |
|---|---|
| `src/constants/content.ts` | **BLOCK_TYPES SSOT**(20 block_type + `scrub-withmassage`=마사지세신 카탈로그), `BLOCK_TYPE_MAP`, `TRIBE_DEFAULT_BLOCKS`, `BLOCK_CATEGORY_META`. heat 순서 dry/steam/salt/hot/very-hot/bulgama/open-air. beyond 빈도순(세신·마사지세신·마사지·매점·식당·수면·아우프구스·기타). jimi 기본=bulgama/ice-room/snack/sleep-room/rest |
| `src/types/index.ts` | `LogBlock` 타입 + `LogWithPlace`에 평탄 캐시 23필드 + `blocks` (전부 additive) |
| `src/lib/logs-service.ts` | `LOG_SELECT`에 `log_blocks(*)`, `toLogWithPlace` blocks·캐시 매핑, **`insertLogWithBlocks`/`updateLogWithBlocks`** + `buildLogCaches`(캐시 파생) + `autoTagFromBlocks`(건강세신=scrub만). 구 `insertLog`/`saveOrUpdateDeepLog`는 **남겨둠**(아직 삭제 X) |
| `src/lib/log-edit-session.ts` | `CurrentLogPayload`에 `blocks` + 상세필드(cleanliness/crowd/companion/cost/currency/memo) — 편집 유실 방지 |
| `src/app/log/page.tsx` | **v6 블록 단일 폼** 전면 재작성 (상세 §2) |
| `src/components/slider.tsx` | `seal`(도장 씰)·`stamp`(통일 온도바) 변형 추가 |

---

## 2. log/page.tsx 구현 현황 (디자인 디테일)

- **페르소나 밴드**(풀블리드, 트라이브컬러, `LOGGING AS / SAUNNER` 영문, **바꾸기** 버튼) → 트라이브 카드(홈 TRIBE PICKS 비주얼: 이탤릭 Oswald+크롭 이모지, **shadow-lg**+선택 링 오버레이).
- **장소 요약 + 변경**: 변경 누르면 인라인 확장 → 커스텀 달력+시간 칩그리드(복원) + **탕(bath_gender) override 드롭다운**(자동 기본) + **장소 다시 선택**(입력 있으면 경고 모달).
- **블록 선택**: 트라이브 기본 칩 + **활동 전체보기**=카테고리 가로 레인(HEAT/ICE/PAUSE/BEYOND). 도장 칩(선택=빨강+흰 이중링+순번).
- **메인 사우나 선택**: 건식+습식 둘 다면 노출.
- **내 루틴 토글**(`온도·시간 기록하기`): OFF=칩 묶음 / ON=**리추얼 단일 행**.
  - 리추얼 행 = `[노드+라벨 | 온도/평가 | 시간/메모]`, 연결선(stone-300 3px).
  - **순서변경 = 포인터 드래그**(터치 지원, `nodePointerDown/Move/Up` + `data-rrow` + `elementFromPoint`), 드롭 마커(빨간 선), 드래그 중 반투명. **노드 탭=반복제외**.
  - **온도/시간 옵셔널**: 기본 미입력(`＋온도`/`＋시간`), 입력 후 `×` 초기화 (`tempCell`/`timeCell` 헬퍼).
  - 평가=도장 씰(`Slider variant=seal`, 코멘트 앞+씰 끝정렬). 온도=`Slider variant=stamp`(드래그+D2 라벨).
  - **세신/마사지** 만족도+가격(우측), **매점/식당** 맛+메뉴(우측). 맛 스텝 2글자(맛없/아쉽/평범/맛남/맛집), 세신=별로/아쉽/만족/시원/극락.
  - **기타(other)**: 카테고리 드롭다운(HEAT/ICE/PAUSE/BEYOND, `Picked.category`) + 메모 + 옵셔널 시간.
  - 반복 N세트(블록 2+).
- **평가**: 트라이브 품질(토토노우/수질/땀) + 또갈래요. **둘 다 0(미선택) 시작.** **저장 활성 = 활동 1개↑ && 또갈래요 입력.** 토토노우·루틴은 선택.
- **더 자세히**: 청결도 씰 / 동행·혼잡도·입장료·메모 — **전부 `[62px 라벨 | 1fr]` 정렬**(씰 시작선과 일치). 입장료=**통화 자동감지(country-to-currency)+검색 드롭다운**(deep 로직 복원) + 금액칸 `min-w-0`(오버플로 방지).
- **저장**: `insertLogWithBlocks`/`updateLogWithBlocks` → 리워드 → `/story`. 편집 시 log_blocks 복원. 취소 확인 모달(기록/편집).

---

## 3. ⏳ 남은 작업 & 주의

1. **포인터 드래그 실기기 검증** — 모바일 터치로 잡힘/드롭마커/스크롤 안 밀림. 어색하면 임계값(6px)·마커 위치 조정.
2. ~~**5단계 표시면 평탄화**~~ ✅ **완료(2026-06-12)** — `toLogWithPlace` 한 곳서 "새 캐시 ?? 레거시" coalesce, 표시면 전부 평탄 필드만 읽음. 상세·disjoint 15건 = `docs/po/archive/로그_표시면_평탄화_매핑감사_20260612.md`. 블록 시퀀스 렌더(히스토리 상세 타임라인)는 BACKLOG P1로 분리.
3. **기타 시설 온도 토글**(더자세히) — 아직 안 함. 새 모델에선 *루틴 외 시설 온도만 빠르게* 용도, **temp-only 블록**으로 저장 예정(유저 확인 필요). 활동 전체보기로 블록 추가해도 온도 기록은 됨.
4. ~~**`/log/deep` 페이지 고아**~~ ✅ **삭제 완료(2026-06-12)** — deep 페이지 + 구 `insertLog`/`updateLog`/`saveOrUpdateDeepLog` + `buildDeepEntrySession`/`_deepOnly` + `LogWithPlace.deep_log` 중첩 + 고아 타입(QuickLogData/DeepLogData) 제거. deep_logs는 toLogWithPlace 폴백 읽기 전용으로만 잔존(030서 제거).
5. **배포(main 머지) 전**: 029 STEP2·5 백필 **재실행**(gap 동기화) → 검증 → `030_cleanup`(구 컬럼 sauna_temp/jjim_temp/pause_time + scrub_types + deep_logs DROP). dual-write 여부 재검토.
6. 디자인 미세조정 계속 (유저가 "디자인 마저 다듬고 다음 작업" 예정).

---

## 4. 스키마 핵심 (029 적용 완료)

- logs 캐시: 온도10(dry/steam/hot/very_hot/bulgama/salt/open_air/cold/ice/ice_room `_temp`) + heat_time(분)/ice_time(초)/rest_time(분)/repeat + totono/water/sweat/rest_quality + revisit + cleanliness/crowd/companion/cost/currency/memo + **scrub_score/scrub_cost/scrub_type(basic|withmassage)** + **massage_score/massage_cost** + **snack_score/snack_memo** + **restaurant_score/restaurant_memo** + primary_sauna_kind/bath_gender.
- `log_blocks`: seq·block_type·category·temp·duration_sec·score·cost·memo·**variant**·norepeat.
- **마사지세신** = block_type `scrub` + variant `withmassage`(별도 block_type 아님). 자동태깅 scrub만.
- 통화 = 세션 1개(도시 자동), 항목별 변경 없음. food_eaten 폐기(메모로).
- 구 컬럼·deep_logs = 030까지 유지. `scrub_types[]` 폐기됨(재적용 시 drop+log_blocks 재생성).

---

## 12. ✅ 입력 폼 최종 디자인·구현 (2026-06-08 다듬기 완료)

§3의 #1(드래그)·#3(시설 온도)·#6(미세조정)은 **완료**. 잔여는 #2(표시면)·#4(고아/구함수)·#5(030/머지)·스토리 연결.

**상단(헤더)** — 트라이브 컬러 풀블리드 + **홈과 동일 SVG 곡선 바닥**(`M0,0 H393 V8 C300,21 110,21 0,11 Z`, 가운데 볼록). 중앙정렬: `LOGGING AS` / 트라이브명+**⇄ 스왑** / 사우나명 / `날짜·시간·탕`+**✎ 연필**. 트라이브 선택·날짜/시간/탕 변경 = **컬러 영역 내 인라인 펼침**(반투명 흰 컨트롤, `max-h` 트랜지션), **영역 밖 클릭 시 닫힘**(headerRef). '장소 다시 선택' 제거. 탕 드롭다운=자동값 중복 옵션 숨김.

**블록 선택** — `오늘 어떻게 즐겼나요?` + (우측) **초기화 · 활동 전체보기/접기**. 전체보기=카테고리 가로 레인(HEAT/ICE/PAUSE/BEYOND), **오른쪽 그라데이션 페이드**(mask-image, 넘칠 때만), **등장빈도순 정렬**(`TEMP_ORDER`: 온탕·열탕·냉탕·건식·습식·소금·한증막·급냉·노천·아이스방). 칩 라벨 nowrap.

**루틴**(온도·시간 토글 ON) — 노드=**44px 원에 아이콘+한글 라벨 내부**, 연결선=**노드 사이 갭만**(진빨강 4px, 관통X). **라이브 드래그 리오더**(손가락 위 행으로 즉시 이동 + 고스트, 맨끝 이동 가능). **노드 탭=루틴↔1회**(점선). 온도=`Slider stamp`(흰 트랙+빨강 채움+**채움 위치 따라 글씨색 자동 전환**, 핸들=평가 씰과 동일 24px). 시간=스테퍼(박스X·**동그라미 ±**·블록별 기본값[heat 10분/냉탕 60초/얼음방 3분/휴식 7분]·**0이하면 미입력 복귀**). 평가 도장=히트존 `flex-1+py-1.5`. 세트=**별도 '루틴' 노드 행**(점선 구분, 행동단계 아닌 카운터)+카운터+**가이드 박스**(루틴→탭↔→1회). **주 사우나 선택=건식·습식 온도 둘 다 입력 시만 노출·필수**(`needPrimary`). 숫자=Oswald.

**평가** — 토토노우/또갈래요/**메모(옵션)**. 라벨 13px·`60px` 칸 정렬, 도장은 칸 가득 채움.

**더 자세히 기록하실래요?(선택, 좌측정렬)** — 청결·동행·혼잡·입장료(**커스텀 통화 드롭다운**, 목록 max-h 120px≈3칸) + **시설 온도 추가**(루틴 외 시설 **temp-only 블록**, `facTemps`→buildBlocks 병합). 행 정렬·패딩 통일.

**사-첵 완료** — 홈 로고(`/logo/sapi-chek-logo.svg`) **도장 버튼을 폼 맨 끝 인플로우**로 박음(플로팅 아님). 150px, **왼쪽 15도 틸트**(`translate(62px,-15px) rotate(-15deg)` 인라인), 살짝 우측. 비활성=`grayscale opacity-30`(연한 그레이, 쉐도우 없음 — 메모칸 톤). 활성=레드+입체 쉐도우 + **`.fab-pop`**(globals.css, 6초마다 담백한 단일 팝 `scale 1→1.07→1`, keyframe에 틸트/위치 포함해 에셋 전체가 팝, reduced-motion 가드). `canSave`=활동≥1 && 또갈래요 && (주사우나 필요시 선택).

**공통** — 모바일 입력 포커스 시 `scrollIntoView`(키보드 위), 토글 열 때 화면 **중앙**으로 스크롤. 간격=10/40 규칙, 폰트=타입 스케일(메모리 표준).

**변경 파일**: `src/app/log/page.tsx`, `src/components/slider.tsx`, `src/constants/content.ts`, `src/app/globals.css`(`.fab-pop`) (전부 preview 푸시 완료, fb32f5b~46bc59c). content.ts: 습식 온도범위 40→80, 노천탕 steps 5단계, 혼잡도 '혼잡', 평가 '아쉽'.

> **로그 입력 폼 디자인 다듬기 = 여기서 마무리(2026-06-09).** 다음은 §3 잔여(표시면 평탄화·030·머지·스토리 연결).
