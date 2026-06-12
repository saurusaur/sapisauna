-- =====================================================================
-- 029_backfill_rerun_gap.sql — 029 STEP2·5 재실행 전용 (gap 동기화 + 루틴 귀속 보강)
-- 작성 2026-06-12 / 실행: Supabase SQL 에디터 수동
--
-- 언제: ① 지금 1회 (idempotent — 여러 번 실행 안전)
--       ② main 머지(새 코드 배포) "직전" 1회 더 — 그 사이 구앱(main)이 쓴 gap 로그 동기화
--       ③ 이후 검증 → 030_cleanup.sql
--
-- 원본 029 STEP2·5와 차이 (그대로 재실행하면 안 되는 이유):
--   (1) STEP2b가 deep_logs 값을 무조건 덮어씀 → preview 새 폼으로 편집한 로그의
--       평탄 값(메모·청결 등)이 스테일 deep 값으로 회귀. → 전부 coalesce(새값 우선)로 변경.
--   (2) STEP5가 heat_time을 사우너(건식/습식)에만 귀속 → 목욕파/찜질파 레거시 로그가
--       블록 경로 heat 통계에서 0이 됨. → 귀속 보강(2026-06-12 확정):
--       · bather: hot-bath 우선, 없으면 very-hot-bath
--       · jimi:   bulgama
--       · 온도 없이 시간만 기록한 로그: temp null 블록 생성해 시간 보존 (ice_time도 동일)
--       가드: "이미 duration 있는 heat/ice 블록이 하나라도 있으면 건드리지 않음"
--             → 새 폼으로 쓴/편집한 로그는 절대 오염 안 됨.
--
-- ADMIN_USER_ID = 23c431c3-9b23-4779-bb27-13472e58090a (블록 백필 제외)
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- A. (구 STEP2a) logs 내부: 옛 통일대상 컬럼 → 새 컬럼 (coalesce = 새값 보호)
-- ---------------------------------------------------------------------
update logs set
  dry_sauna_temp = coalesce(dry_sauna_temp, sauna_temp),
  bulgama_temp   = coalesce(bulgama_temp,   jjim_temp),
  rest_time      = coalesce(rest_time,      pause_time)
where sauna_temp is not null or jjim_temp is not null or pause_time is not null;

-- ---------------------------------------------------------------------
-- B. (구 STEP2b, coalesce-safe) deep_logs → logs — l.* 값이 이미 있으면 보존
-- ---------------------------------------------------------------------
update logs l set
  very_hot_bath_temp = coalesce(l.very_hot_bath_temp, case when d.has_very_hot_bath then d.very_hot_bath_temp end),
  ice_bath_temp      = coalesce(l.ice_bath_temp,      case when d.has_ice_bath      then d.ice_bath_temp      end),
  cleanliness        = coalesce(l.cleanliness, d.cleanliness),
  crowd              = coalesce(l.crowd,       d.crowd),
  companion          = coalesce(l.companion,   d.companion),
  cost               = coalesce(l.cost,        d.cost),
  currency           = coalesce(l.currency,    d.currency, 'KRW'),
  memo               = coalesce(l.memo,        d.memo),
  -- 세신/마사지 분리 (구 scrub_types 라우팅): 둘 다=withmassage, 세신만/빈배열=basic, 마사지만=massage
  scrub_score        = coalesce(l.scrub_score, case when d.has_scrub and ('scrub' = any(d.scrub_types) or coalesce(array_length(d.scrub_types,1),0)=0) then d.scrub_satisfaction end),
  scrub_cost         = coalesce(l.scrub_cost,  case when d.has_scrub and ('scrub' = any(d.scrub_types) or coalesce(array_length(d.scrub_types,1),0)=0) then d.scrub_cost end),
  scrub_type         = coalesce(l.scrub_type,  case when d.has_scrub and 'scrub' = any(d.scrub_types) and 'massage' = any(d.scrub_types) then 'withmassage'
                                                    when d.has_scrub and ('scrub' = any(d.scrub_types) or coalesce(array_length(d.scrub_types,1),0)=0) then 'basic' end),
  massage_score      = coalesce(l.massage_score, case when d.has_scrub and 'massage' = any(d.scrub_types) and not ('scrub' = any(d.scrub_types)) then d.scrub_satisfaction end),
  massage_cost       = coalesce(l.massage_cost,  case when d.has_scrub and 'massage' = any(d.scrub_types) and not ('scrub' = any(d.scrub_types)) then d.scrub_cost end),
  snack_score        = coalesce(l.snack_score, case when d.has_store then d.store_score end),
  snack_memo         = coalesce(l.snack_memo,  case when d.has_store then d.store_memo end)
from deep_logs d
where d.log_id = l.id;

-- ---------------------------------------------------------------------
-- C. (구 STEP5 그대로) gap 로그 블록 합성 — (log, block_type) NOT EXISTS로 idempotent
--    ※ 이미 블록 있는 로그(기존 합성·새 폼)는 전부 스킵됨
-- ---------------------------------------------------------------------
insert into log_blocks (log_id, seq, block_type, category, temp, duration_sec)
select id, 1, 'dry-sauna', 'heat', dry_sauna_temp,
       case when coalesce(primary_sauna_kind,'dry') = 'dry' then heat_time * 60 end
from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a' and dry_sauna_temp is not null
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'dry-sauna');

insert into log_blocks (log_id, seq, block_type, category, temp, duration_sec)
select id, 2, 'steam-sauna', 'heat', steam_sauna_temp,
       case when primary_sauna_kind = 'steam' then heat_time * 60 end
from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a' and steam_sauna_temp is not null
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'steam-sauna');

insert into log_blocks (log_id, seq, block_type, category, temp)
select id, 3, 'hot-bath', 'heat', hot_bath_temp from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a' and hot_bath_temp is not null
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'hot-bath');

insert into log_blocks (log_id, seq, block_type, category, temp)
select id, 4, 'very-hot-bath', 'heat', very_hot_bath_temp from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a' and very_hot_bath_temp is not null
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'very-hot-bath');

insert into log_blocks (log_id, seq, block_type, category, temp)
select id, 5, 'bulgama', 'heat', bulgama_temp from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a' and bulgama_temp is not null
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'bulgama');

insert into log_blocks (log_id, seq, block_type, category, temp, duration_sec)
select id, 11, 'cold-bath', 'ice', cold_bath_temp, ice_time from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a' and cold_bath_temp is not null
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'cold-bath');

insert into log_blocks (log_id, seq, block_type, category, temp)
select id, 12, 'ice-bath', 'ice', ice_bath_temp from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a' and ice_bath_temp is not null
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'ice-bath');

insert into log_blocks (log_id, seq, block_type, category, duration_sec, score)
select id, 21, 'rest', 'rest',
       case when rest_time is not null then rest_time * 60 end, rest_quality
from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a'
  and (rest_time is not null or rest_quality is not null)
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'rest');

insert into log_blocks (log_id, seq, block_type, category, score, cost, variant)
select id, 31, 'scrub', 'beyond', scrub_score, scrub_cost, scrub_type from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a'
  and (scrub_score is not null or scrub_cost is not null or scrub_type is not null)
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'scrub');

insert into log_blocks (log_id, seq, block_type, category, score, cost)
select id, 32, 'massage', 'beyond', massage_score, massage_cost from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a' and massage_score is not null
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'massage');

insert into log_blocks (log_id, seq, block_type, category, score, memo)
select id, 33, 'snack', 'beyond', snack_score, snack_memo from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a'
  and (snack_score is not null or snack_memo is not null)
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'snack');

-- ---------------------------------------------------------------------
-- D. 루틴 귀속 보강 (2026-06-12 확정 — bather/jimi heat_time, 시간만 로그, ice_time)
--    공통 가드 no_heat_dur: duration 있는 heat 블록이 이미 있으면 전부 스킵
--    (새 폼 로그/사우너 합성분 보호 — heat_time을 이중 귀속하지 않음)
-- ---------------------------------------------------------------------
-- D1. bather: 기존 hot-bath 합성 블록에 duration 채움
update log_blocks b set duration_sec = l.heat_time * 60
from logs l
where b.log_id = l.id and l.user_id <> '23c431c3-9b23-4779-bb27-13472e58090a'
  and l.tribe_id = 'bather' and l.heat_time is not null
  and b.block_type = 'hot-bath' and b.duration_sec is null
  and not exists (select 1 from log_blocks h where h.log_id = l.id and h.category = 'heat' and h.duration_sec is not null);

-- D2. bather 폴백: hot-bath 블록이 없으면 very-hot-bath에
update log_blocks b set duration_sec = l.heat_time * 60
from logs l
where b.log_id = l.id and l.user_id <> '23c431c3-9b23-4779-bb27-13472e58090a'
  and l.tribe_id = 'bather' and l.heat_time is not null
  and b.block_type = 'very-hot-bath' and b.duration_sec is null
  and not exists (select 1 from log_blocks hb where hb.log_id = l.id and hb.block_type = 'hot-bath')
  and not exists (select 1 from log_blocks h where h.log_id = l.id and h.category = 'heat' and h.duration_sec is not null);

-- D3. jimi: bulgama 블록에 duration 채움
update log_blocks b set duration_sec = l.heat_time * 60
from logs l
where b.log_id = l.id and l.user_id <> '23c431c3-9b23-4779-bb27-13472e58090a'
  and l.tribe_id = 'jimi' and l.heat_time is not null
  and b.block_type = 'bulgama' and b.duration_sec is null
  and not exists (select 1 from log_blocks h where h.log_id = l.id and h.category = 'heat' and h.duration_sec is not null);

-- D4. 시간만 기록(타깃 블록 자체가 없음) → temp null 블록 생성
--     bather → hot-bath / jimi → bulgama / saunner → primary(기본 dry) 사우나
insert into log_blocks (log_id, seq, block_type, category, temp, duration_sec)
select l.id, 3, 'hot-bath', 'heat', null, l.heat_time * 60
from logs l
where l.user_id <> '23c431c3-9b23-4779-bb27-13472e58090a'
  and l.tribe_id = 'bather' and l.heat_time is not null
  and not exists (select 1 from log_blocks b where b.log_id = l.id and b.block_type in ('hot-bath','very-hot-bath'))
  and not exists (select 1 from log_blocks h where h.log_id = l.id and h.category = 'heat' and h.duration_sec is not null);

insert into log_blocks (log_id, seq, block_type, category, temp, duration_sec)
select l.id, 5, 'bulgama', 'heat', null, l.heat_time * 60
from logs l
where l.user_id <> '23c431c3-9b23-4779-bb27-13472e58090a'
  and l.tribe_id = 'jimi' and l.heat_time is not null
  and not exists (select 1 from log_blocks b where b.log_id = l.id and b.block_type = 'bulgama')
  and not exists (select 1 from log_blocks h where h.log_id = l.id and h.category = 'heat' and h.duration_sec is not null);

insert into log_blocks (log_id, seq, block_type, category, temp, duration_sec)
select l.id,
       case when l.primary_sauna_kind = 'steam' then 2 else 1 end,
       case when l.primary_sauna_kind = 'steam' then 'steam-sauna' else 'dry-sauna' end,
       'heat', null, l.heat_time * 60
from logs l
where l.user_id <> '23c431c3-9b23-4779-bb27-13472e58090a'
  and l.tribe_id = 'saunner' and l.heat_time is not null
  and not exists (select 1 from log_blocks b where b.log_id = l.id
                  and b.block_type = case when l.primary_sauna_kind = 'steam' then 'steam-sauna' else 'dry-sauna' end)
  and not exists (select 1 from log_blocks h where h.log_id = l.id and h.category = 'heat' and h.duration_sec is not null);

-- D5. ice_time: 기존 cold-bath 블록에 채움 / 블록 없으면 temp null 생성
update log_blocks b set duration_sec = l.ice_time
from logs l
where b.log_id = l.id and l.user_id <> '23c431c3-9b23-4779-bb27-13472e58090a'
  and l.ice_time is not null
  and b.block_type = 'cold-bath' and b.duration_sec is null
  and not exists (select 1 from log_blocks i where i.log_id = l.id and i.category = 'ice' and i.duration_sec is not null);

insert into log_blocks (log_id, seq, block_type, category, temp, duration_sec)
select l.id, 11, 'cold-bath', 'ice', null, l.ice_time
from logs l
where l.user_id <> '23c431c3-9b23-4779-bb27-13472e58090a'
  and l.ice_time is not null
  and not exists (select 1 from log_blocks b where b.log_id = l.id and b.block_type = 'cold-bath')
  and not exists (select 1 from log_blocks i where i.log_id = l.id and i.category = 'ice' and i.duration_sec is not null);

-- ---------------------------------------------------------------------
-- E. 스테일 vocab 정리 (V5에서 'store' 5건 발견, 2026-06-12)
--    구버전 029가 합성한 block_type='store' → 표준 'snack'으로.
--    같은 로그에 snack이 이미 있으면(이번 재실행 C가 생성) store는 중복 → 삭제.
-- ---------------------------------------------------------------------
delete from log_blocks b
where b.block_type = 'store'
  and exists (select 1 from log_blocks s where s.log_id = b.log_id and s.block_type = 'snack');

update log_blocks set block_type = 'snack' where block_type = 'store';

commit;

-- =====================================================================
-- 검증 (트랜잭션 밖, 결과를 공유해주세요)
-- =====================================================================
-- V0. 스테일 vocab 잔존 = 0이어야 함 (표준 20종 외 block_type)
select block_type, count(*) from log_blocks
where block_type not in ('dry-sauna','steam-sauna','hot-bath','very-hot-bath','bulgama','salt-sauna','open-air-bath',
                         'cold-bath','ice-bath','ice-room','rest','outdoor-rest','indoor-rest',
                         'aufguss','sleep-room','scrub','massage','snack','restaurant','other')
group by 1;

-- V1. 블록 없는 유저 로그(루틴/온도/평가 입력이 있는데) = 0이어야 함
select count(*) as missing_blocks from logs l
where l.user_id <> '23c431c3-9b23-4779-bb27-13472e58090a'
  and (l.dry_sauna_temp is not null or l.steam_sauna_temp is not null or l.hot_bath_temp is not null
       or l.very_hot_bath_temp is not null or l.bulgama_temp is not null or l.cold_bath_temp is not null
       or l.ice_bath_temp is not null or l.heat_time is not null or l.ice_time is not null
       or l.rest_time is not null or l.scrub_score is not null or l.snack_score is not null)
  and not exists (select 1 from log_blocks b where b.log_id = l.id);

-- V2. heat_time 있는데 heat 블록 duration이 전혀 없는 유저 로그 = 0이어야 함 (귀속 보강 확인)
select count(*) as heat_unrouted from logs l
where l.user_id <> '23c431c3-9b23-4779-bb27-13472e58090a' and l.heat_time is not null
  and not exists (select 1 from log_blocks h where h.log_id = l.id and h.category = 'heat' and h.duration_sec is not null);

-- V3. ice_time 미귀속 = 0이어야 함
select count(*) as ice_unrouted from logs l
where l.user_id <> '23c431c3-9b23-4779-bb27-13472e58090a' and l.ice_time is not null
  and not exists (select 1 from log_blocks i where i.log_id = l.id and i.category = 'ice' and i.duration_sec is not null);

-- V4. 평탄 캐시 채움 현황 (deep_logs 대비 구멍 확인 — 0이어야 함)
select count(*) as flat_gap from logs l join deep_logs d on d.log_id = l.id
where (d.cleanliness is not null and l.cleanliness is null)
   or (d.cost is not null and l.cost is null)
   or (d.memo is not null and l.memo is null);

-- V5. 블록 타입별 분포 (감각 점검용)
select block_type, count(*) from log_blocks group by 1 order by 2 desc;
