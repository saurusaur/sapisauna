# 핸드오프: 로그 블록모델 재설계 — DDL 초안 완료, 적용·구현 단계 인계

작성 2026-06-05 / 브랜치 **preview** / **상태: 설계+029 DDL 초안 완료. DB 미적용. 다음=적용→코드 컷오버→스토리 카드.**

---

## ⏫ 2026-06-06 업데이트 (디자인 확정 + 컷오버 전략 변경)

- **현재 디자인 베이스 = `docs/po/로그_프로토타입_v6_20260606.html`** (도장 디자인 시스템 적용본). v4/v5는 구버전.
  - 적용된 룩/UX: 웜페이퍼+그레인, **도장(씰) 단일 선택 언어**, 흰보더 카드 제거 / 풀블리드 **페르소나 밴드**(트라이브컬러+영문, 곡선, SWITCH=TRIBE PICKS 카드) / 기본블록 + **'활동 전체보기'=카테고리 가로 스크롤 레인** / **내 루틴 토글** OFF(도장칩·선택순서·드래그)→ON(리추얼) / 리추얼=**도장 노드+연결선**(노드 탭=반복제외·드래그=순서), 평가=온도와 동일 슬라이더 패밀리, 세신류=만족도+₩가격, **열 너비 통일(좌64│1fr│우78)**.
  - **미정**: 페르소나 영문 문구(MODE / TODAY I'M A / LOGGING AS 비교 중).
  - 다른 창 룩 구현용 구조 프롬프트: `docs/po/PROMPT_로그입력_구조구현_20260606.md`.
- **029는 적용 OK 상태**(additive·idempotent). 유저가 웹 SQL 에디터로 적용 진행. ⚠️ 적용 전 프리플라이트: `deep_logs` 17컬럼 / `logs` 11컬럼 존재 확인(특히 `scrub_cost`/`scrub_satisfaction` 누락 이력).
- **★ 컷오버 전략 변경 (유저 지시)**: 증분 ❌ → **마이그레이션 완료 후 한 배포로 묶기**. 메인이 구 컬럼으로 잘 도니까 **지금 types/logs-service/폼 등 메인 코드 일절 손대지 않음**. 한 배치 = content.ts BLOCK_TYPES → types 평탄화+blocks → logs-service 단일행+insertBlocks+캐시파생 → 폼 v6화 → (배포 직전 029 STEP2·5 백필 재실행) → 검증 → 030 cleanup.

---

## 0. 한 줄 요약
"3-Click 사-첵" 블록 기반 로그로 재설계. `logs`+`deep_logs`를 **단일 logs로 병합** + 순서/반복/시간을 담는 **`log_blocks`** 신설 + **`user_routines`**. 설계·영향분석·DDL 초안까지 끝났고, **DB 적용과 코드 컷오버는 다음 세션**.

## 1. SSOT 문서 (먼저 읽기)
- **설계/영향/매핑 전부**: `docs/po/로그_스키마_매핑_영향분석_20260605.md`
  - §3 필드매핑 / §4 깨짐(B1~B12) / §6+§11 동반수정 파일(전수) / §8 단일테이블 목표안 / §10 BLOCK_TYPES SSOT(+TS초안) / §10-1 네이밍통일 / §10-2 평가입력 / §11 임팩트 재검증
- **DDL 초안**: `supabase/029_log_blocks_merge.sql` (트랜잭션 1 + 검증쿼리 + 롤백노트)
- **구동 와이어프레임**: `docs/po/로그_프로토타입_v4_20260604.html` (메인) · `데모_타임라인.html` · `데모_더자세히.html`
- 메모리 핀: `project_log_schema_redesign.md`
- **★ 코드 컷오버 체크리스트(작업 전 정독 + 완료 후 검증 필수)**: `docs/plans/CHECKLIST_코드컷오버.md`

## 2. 확정된 설계 (변경 금지 — 결정 완료)
- **스키마**: 단일 `logs`(deep 흡수) + `log_blocks`(정) + `user_routines`.
  - `log_blocks`: seq, block_type, category(heat/ice/rest/beyond), temp, duration_sec, score, cost, memo, norepeat.
  - logs 캐시: 온도 10종 + heat_time/ice_time/rest_time + repeat + 트라이브품질(totono/water/sweat/rest) + scrub_*/store_*.
- **네이밍 통일(RENAME 3)**: `sauna_temp→dry_sauna_temp`, `jjim_temp→bulgama_temp`, `pause_time→rest_time`. block_type = PLACE_SPECS id(kebab), cache = `id_temp`.
- **시간단위**: 냉탕·급냉만 **초**, 그외 **분** → DB는 `duration_sec`(초) 통일.
- **BLOCK_TYPES 19종**(§10): 한증막=불한증막 통합(bulgama). 셀프뢰일리 제외(시설정보). **기타(other)** 추가(category 사용자선택+memo). 신규온도: 소금40-70/노천30-45/아이스방0-15.
- **세신·마사지·매점·수면 = 블록**(퀵 행동). **평가는 타임라인 행에서**(score/cost/memo). rest_quality는 수면/휴식 블록 score로 안착.
- **입력 흐름**: 블록(원형, ＋추가=전체시설) → 온도·시간=리추얼 타임라인(드래그·순서DnD·반복제외·블록별 평가) → 트라이브품질+또갈래요(완전 퀵) → 더자세히(청결·혼잡·메모 기본 / 동행·세신·매점·입장료·기타온도 선택). 탕은 `deriveBathGender` 자동(입력 X).

## 3. 배포 모델 — expand-contract (동시배포 불가 → 미리 적용 가능)
029는 **additive(expand)** 라 **지금 프로덕션에 적용해도 구앱 무영향**(RENAME/DROP 없음, 새 컬럼/테이블만 추가 + 백필, 옛 컬럼·deep_logs 유지). ⚠️ 절대 한 트랜잭션에 RENAME/DROP 넣지 말 것.

순서:
1. **029 적용** (지금 OK): 브랜치 테스트 → 프로덕션. 구앱 그대로 돈다. ⚠️ 합성 리뷰: heat_time→primary 사우나 귀속, scrub_types 분기, very_hot/ice has_* 게이팅.
2. **코드 컷오버**(준비되면) — 내부 작업 순서:
   - (a) 토대: `types/index.ts`, `constants/content.ts`(BLOCK_TYPES), **`logs-service.ts`**(deep조인·key-presence·saveOrUpdateDeepLog 삭제 / insertLog+insertBlocks / toLogWithPlace 평탄+blocks / 캐시파생 / 자동태깅 블록기준)
   - (b) 표시면 깨짐방지: 신규 컬럼명 + `deep_log.x→x` 평탄화 (history/[id], record-card, user-log-card, home-calendar, reward-service 등 ≈16파일, §11)
   - (c) **★스토리 카드 재작성** — stella 지정 다음 우선순위. 뱃지→블록 시퀀스 + 레이어 토글(루틴/+온도/+시간). `story/page.tsx` + `image-export.ts`
   - (d) 히스토리 상세=리추얼 타임라인 / 장소 상세(explore/[id])=신규시설 온도+블록 집계
   - (e) user_routines 추천 시드 INSERT(토토노우 입문 등) / v4 프로토타입 평가-행 UI 반영
   - **배포 직전 029 STEP 2·5 백필 재실행**(gap 동기화)
3. **030_cleanup** (코드 검증 후): 옛 컬럼(sauna_temp/jjim_temp/pause_time) DROP + deep_logs DROP.

## 4. Watch-out (재작성 주의)
- 표시면(스토리/히스토리/장소)은 rename만이 아니라 **블록 렌더로 실질 재작성** 대상. 캐시 전략은 "무중단 배포"용이지 면제 아님.
- **편집 플로우**: 레거시 로그 편집 시 log_blocks 로드/재구성 필요 → 029 백필로 해소(유저 로그 블록 생성). 어드민 시드는 백필 제외(캐시만).
- **primary_sauna_kind**: 건식+습식 둘 다면 '첫 블록' 자동지정 ❌ → **메인 사우나 선택 UI** 필요.
- **ice_time 의미 변경**: 냉탕 단발 → ice 총 냉각시간. 스토리/통계 'ICE s' 라벨 재검토.
- 라이브 DB가 .sql과 일부 불일치 이력 있음 → 적용 전 `select('*').limit(1)`로 컬럼 최종 확인.

## 5. 이 커밋에 포함된 것
- `docs/po/로그_스키마_매핑_영향분석_20260605.md` (SSOT)
- `supabase/029_log_blocks_merge.sql` (expand=additive, 미적용) + `supabase/030_cleanup_deep_logs.sql` (contract, 코드 후)
- `docs/po/로그_프로토타입_v4_20260604.html` 외 프로토타입/데모(v1~v4, 타임라인/더자세히)
- 본 핸드오프

## 6. 미포함(무관, 손대지 않음)
- `docs/research/katalk-20260519/overseas-register-dryrun-20260604.md` (기존 수정)
- `public/logo/` (별건)
