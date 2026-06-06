# 핸드오프: 로그 블록모델 재설계 — DDL 초안 완료, 적용·구현 단계 인계

작성 2026-06-05 / 브랜치 **preview** / **상태: 설계+029 DDL 초안 완료. DB 미적용. 다음=적용→코드 컷오버→스토리 카드.**

---

## 0. 한 줄 요약
"3-Click 사-첵" 블록 기반 로그로 재설계. `logs`+`deep_logs`를 **단일 logs로 병합** + 순서/반복/시간을 담는 **`log_blocks`** 신설 + **`user_routines`**. 설계·영향분석·DDL 초안까지 끝났고, **DB 적용과 코드 컷오버는 다음 세션**.

## 1. SSOT 문서 (먼저 읽기)
- **설계/영향/매핑 전부**: `docs/po/로그_스키마_매핑_영향분석_20260605.md`
  - §3 필드매핑 / §4 깨짐(B1~B12) / §6+§11 동반수정 파일(전수) / §8 단일테이블 목표안 / §10 BLOCK_TYPES SSOT(+TS초안) / §10-1 네이밍통일 / §10-2 평가입력 / §11 임팩트 재검증
- **DDL 초안**: `supabase/029_log_blocks_merge.sql` (트랜잭션 1 + 검증쿼리 + 롤백노트)
- **구동 와이어프레임**: `docs/po/로그_프로토타입_v4_20260604.html` (메인) · `데모_타임라인.html` · `데모_더자세히.html`
- 메모리 핀: `project_log_schema_redesign.md`

## 2. 확정된 설계 (변경 금지 — 결정 완료)
- **스키마**: 단일 `logs`(deep 흡수) + `log_blocks`(정) + `user_routines`.
  - `log_blocks`: seq, block_type, category(heat/ice/rest/beyond), temp, duration_sec, score, cost, memo, norepeat.
  - logs 캐시: 온도 10종 + heat_time/ice_time/rest_time + repeat + 트라이브품질(totono/water/sweat/rest) + scrub_*/store_*.
- **네이밍 통일(RENAME 3)**: `sauna_temp→dry_sauna_temp`, `jjim_temp→bulgama_temp`, `pause_time→rest_time`. block_type = PLACE_SPECS id(kebab), cache = `id_temp`.
- **시간단위**: 냉탕·급냉만 **초**, 그외 **분** → DB는 `duration_sec`(초) 통일.
- **BLOCK_TYPES 19종**(§10): 한증막=불한증막 통합(bulgama). 셀프뢰일리 제외(시설정보). **기타(other)** 추가(category 사용자선택+memo). 신규온도: 소금40-70/노천30-45/아이스방0-15.
- **세신·마사지·매점·수면 = 블록**(퀵 행동). **평가는 타임라인 행에서**(score/cost/memo). rest_quality는 수면/휴식 블록 score로 안착.
- **입력 흐름**: 블록(원형, ＋추가=전체시설) → 온도·시간=리추얼 타임라인(드래그·순서DnD·반복제외·블록별 평가) → 트라이브품질+또갈래요(완전 퀵) → 더자세히(청결·혼잡·메모 기본 / 동행·세신·매점·입장료·기타온도 선택). 탕은 `deriveBathGender` 자동(입력 X).

## 3. 다음 작업 순서 (우선순위)
1. **029 DDL 검증·적용**: 브랜치/스테이징 DB에서 실행 → §6 검증쿼리(블록 0개 누락행 0 확인) → 백업 후 프로덕션. ⚠️ 리뷰포인트: heat_time을 primary 사우나에만 귀속, scrub_types 분기, very_hot/ice has_* 게이팅.
2. **코드 컷오버**(같은 배포): `types/index.ts`, `constants/content.ts`(BLOCK_TYPES 추가), **`logs-service.ts`**(deep조인·key-presence·saveOrUpdateDeepLog 삭제 / insertLog+insertBlocks / toLogWithPlace 평탄+blocks / 캐시파생 / 자동태깅 블록기준). 표시면 rename + `deep_log.x→x` 평탄화 — 안 하면 깨지는 곳: history/[id], record-card, user-log-card, home-calendar, reward-service. (≈16파일, §11)
3. **스토리 카드 재작성** ★ stella 지정 다음 우선순위 — 뱃지→블록 시퀀스 + 레이어 토글(루틴/+온도/+시간). `story/page.tsx` + `image-export.ts`.
4. 히스토리 상세=리추얼 타임라인 렌더 / 장소 상세(explore/[id])=신규시설 온도+블록 집계.
5. user_routines 추천 시드 INSERT(토토노우 입문 등).
6. v4 프로토타입에 평가-행 UI(세신/매점/수면 score) 반영(현재 미반영).
7. `deep_logs` DROP → `030_drop_deep_logs.sql`(검증 후).

## 4. Watch-out (재작성 주의)
- 표시면(스토리/히스토리/장소)은 rename만이 아니라 **블록 렌더로 실질 재작성** 대상. 캐시 전략은 "무중단 배포"용이지 면제 아님.
- **편집 플로우**: 레거시 로그 편집 시 log_blocks 로드/재구성 필요 → 029 백필로 해소(유저 로그 블록 생성). 어드민 시드는 백필 제외(캐시만).
- **primary_sauna_kind**: 건식+습식 둘 다면 '첫 블록' 자동지정 ❌ → **메인 사우나 선택 UI** 필요.
- **ice_time 의미 변경**: 냉탕 단발 → ice 총 냉각시간. 스토리/통계 'ICE s' 라벨 재검토.
- 라이브 DB가 .sql과 일부 불일치 이력 있음 → 적용 전 `select('*').limit(1)`로 컬럼 최종 확인.

## 5. 이 커밋에 포함된 것
- `docs/po/로그_스키마_매핑_영향분석_20260605.md` (SSOT)
- `supabase/029_log_blocks_merge.sql` (DDL 초안, 미적용)
- `docs/po/로그_프로토타입_v4_20260604.html` 외 프로토타입/데모(v1~v4, 타임라인/더자세히)
- 본 핸드오프

## 6. 미포함(무관, 손대지 않음)
- `docs/research/katalk-20260519/overseas-register-dryrun-20260604.md` (기존 수정)
- `public/logo/` (별건)
