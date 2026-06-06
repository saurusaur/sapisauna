-- =====================================================================
-- 029_log_blocks_merge.sql  (EXPAND — additive, 무중단)
-- 로그 스키마 통합 1단계: 새 컬럼/테이블 추가 + 백필. **기존 컬럼/ deep_logs 유지.**
-- → 지금 적용해도 현재 배포된 구앱은 그대로 동작 (RENAME/DROP 없음).
-- 설계: docs/po/로그_스키마_매핑_영향분석_20260605.md
--
-- 배포 순서 (expand-contract):
--   1) [지금] 029 적용 — 구앱 무영향
--   2) 새 코드 배포 (새 컬럼/log_blocks 사용)
--      └ 배포 직전, 029의 STEP 2·STEP 5 백필을 **한 번 더 실행**(gap 기간에 구앱이
--        옛 컬럼에 쓴 값/블록 없는 신규 로그를 동기화 — NOT EXISTS 가드로 idempotent)
--   3) [검증 후] 030_cleanup.sql — 옛 컬럼/deep_logs DROP
--
-- ADMIN_USER_ID = 23c431c3-9b23-4779-bb27-13472e58090a (통계 시드, 블록 백필 제외)
-- ⚠️ 적용 전 백업 + select('*').limit(1)로 컬럼 최종 확인
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- STEP 1. logs에 컬럼 ADD (전부 additive — 기존 컬럼 그대로 둠)
--   (가) 통일명 새 컬럼 (구: sauna_temp/jjim_temp/pause_time 은 030에서 DROP)
--   (나) deep→logs 이전 온도 / 신규 온도 3종
--   (다) deep_logs 흡수 필드
-- ---------------------------------------------------------------------
alter table logs
  -- (가) 통일명 (값은 STEP 2에서 구 컬럼 복사)
  add column if not exists dry_sauna_temp        int,
  add column if not exists bulgama_temp          int,
  add column if not exists rest_time             int,
  -- (나) deep→logs + 신규
  add column if not exists very_hot_bath_temp    int,
  add column if not exists ice_bath_temp          int,
  add column if not exists salt_sauna_temp         int,
  add column if not exists open_air_bath_temp      int,
  add column if not exists ice_room_temp           int,
  -- (다) deep_logs 흡수
  add column if not exists cleanliness           int,
  add column if not exists crowd                 text,
  add column if not exists companion             text,
  add column if not exists cost                  int,
  add column if not exists currency              text default 'KRW',
  add column if not exists memo                  text,
  add column if not exists scrub_types           text[] default '{}',
  add column if not exists scrub_cost            int,
  add column if not exists scrub_score           int,    -- 세신 만족도 (구 deep_logs.scrub_satisfaction)
  add column if not exists food_score            int,    -- 매점 점수 (구 deep_logs.store_score)
  add column if not exists food_memo             text;   -- 매점 메모 (구 deep_logs.store_memo)
-- 주: 구 sauna_temp/jjim_temp/pause_time, deep_logs(+has_*/food_eaten)는 030까지 유지.

-- ---------------------------------------------------------------------
-- STEP 2. 백필 (구앱이 계속 쓰는 옛 컬럼 → 새 컬럼 / deep_logs → logs)
--   ★ 코드 컷오버 직전 한 번 더 실행 (gap 동기화)
-- ---------------------------------------------------------------------
-- 2a. logs 내부: 옛 통일대상 컬럼 복사
update logs set
  dry_sauna_temp = coalesce(dry_sauna_temp, sauna_temp),
  bulgama_temp   = coalesce(bulgama_temp,   jjim_temp),
  rest_time      = coalesce(rest_time,      pause_time)
where sauna_temp is not null or jjim_temp is not null or pause_time is not null;

-- 2b. deep_logs → logs (has_* 게이팅)
update logs l set
  very_hot_bath_temp  = case when d.has_very_hot_bath then d.very_hot_bath_temp end,
  ice_bath_temp       = case when d.has_ice_bath      then d.ice_bath_temp      end,
  cleanliness         = d.cleanliness,
  crowd               = d.crowd,
  companion           = d.companion,
  cost                = d.cost,
  currency            = coalesce(d.currency, 'KRW'),
  memo                = d.memo,
  scrub_types         = coalesce(d.scrub_types, '{}'),
  scrub_cost          = case when d.has_scrub then d.scrub_cost end,
  scrub_score         = case when d.has_scrub then d.scrub_satisfaction end,
  food_score          = case when d.has_store then d.store_score end,
  food_memo           = case when d.has_store then d.store_memo end
from deep_logs d
where d.log_id = l.id;

-- ---------------------------------------------------------------------
-- STEP 3. log_blocks (순서/반복/혼합/신규시설/평가의 정正)
-- ---------------------------------------------------------------------
create table if not exists log_blocks (
  id            uuid primary key default gen_random_uuid(),
  log_id        uuid not null references logs(id) on delete cascade,
  seq           int  not null,
  block_type    text not null,                 -- BLOCK_TYPES.id (content.ts SSOT)
  category      text not null,                 -- 'heat'|'ice'|'rest'|'beyond' (other=사용자선택)
  temp          int,
  duration_sec  int,                           -- 초 통일 (UI: 냉탕/급냉=초, 그외=분)
  score         int,                           -- 1-5: 세신만족/매점점수/휴식퀄 (의미는 block_type)
  cost          int,                           -- 세신 가격
  memo          text,                          -- 매점 메모 / 기타 설명
  norepeat      boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists idx_log_blocks_log_id on log_blocks(log_id);
create index if not exists idx_log_blocks_type   on log_blocks(block_type);

alter table log_blocks enable row level security;
create policy log_blocks_read on log_blocks for select
  using (exists (select 1 from logs l where l.id = log_blocks.log_id));
create policy log_blocks_write on log_blocks for all
  using      (exists (select 1 from logs l where l.id = log_blocks.log_id and l.user_id = auth.uid()))
  with check (exists (select 1 from logs l where l.id = log_blocks.log_id and l.user_id = auth.uid()));

-- ---------------------------------------------------------------------
-- STEP 4. user_routines (나만의 + 추천 시드)
-- ---------------------------------------------------------------------
create table if not exists user_routines (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,  -- NULL = 추천 시드
  tribe_id    text,
  name        text not null,
  icon        text,
  blocks      jsonb not null default '[]',
  is_featured boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_user_routines_user on user_routines(user_id);

alter table user_routines enable row level security;
create policy user_routines_read on user_routines for select
  using (user_id is null or user_id = auth.uid());
create policy user_routines_write on user_routines for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- TODO(별도): 트라이브 추천 루틴 시드 INSERT (user_id NULL, is_featured true)

-- ---------------------------------------------------------------------
-- STEP 5. log_blocks 백필 — 기존 "유저" 로그 합성 (편집 플로우 필수)
--   ★ 코드 컷오버 직전 한 번 더 실행 (gap 기간 신규 로그 포함; (log,type) NOT EXISTS로 idempotent)
--   · 어드민 시드 제외 / 순서=카테고리 캐노니컬 / 신규명 컬럼 사용
--   ⚠️ 합성 규칙 리뷰 필수 (heat_time 사우나 귀속, scrub_types 분기)
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

insert into log_blocks (log_id, seq, block_type, category, score, cost)
select id, 31, 'scrub', 'beyond', scrub_score, scrub_cost from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a'
  and ( 'scrub' = any(scrub_types)
        or ( coalesce(array_length(scrub_types,1),0) = 0
             and (scrub_score is not null or scrub_cost is not null) ) )
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'scrub');

insert into log_blocks (log_id, seq, block_type, category, score, cost)
select id, 32, 'massage', 'beyond', scrub_score, scrub_cost from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a' and 'massage' = any(scrub_types)
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'massage');

insert into log_blocks (log_id, seq, block_type, category, score, memo)
select id, 33, 'food', 'beyond', food_score, food_memo from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a'
  and (food_score is not null or food_memo is not null)
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'food');
-- salt-sauna/open-air/ice-room/aufguss/sleep-room/outdoor·indoor-rest/other = 레거시 없음 → 백필 없음.

commit;

-- =====================================================================
-- 적용 후 검증 (트랜잭션 밖, 수동)
-- =====================================================================
-- 구앱 무영향 확인:  구 컬럼 그대로 존재 → select sauna_temp,jjim_temp,pause_time from logs limit 1;
-- 백필 카운트:       select block_type,count(*) from log_blocks group by 1 order by 2 desc;
-- 누락 점검(유저):   select l.id from logs l
--   where l.user_id <> '23c431c3-9b23-4779-bb27-13472e58090a'
--     and (l.dry_sauna_temp is not null or l.cold_bath_temp is not null or l.rest_time is not null
--          or l.hot_bath_temp is not null or l.bulgama_temp is not null or l.steam_sauna_temp is not null)
--     and not exists (select 1 from log_blocks b where b.log_id = l.id);
--
-- → 다음: 새 코드 배포(배포 직전 STEP 2·5 재실행) → 검증 후 030_cleanup.sql
-- =====================================================================
