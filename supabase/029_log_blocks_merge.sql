-- =====================================================================
-- 029_log_blocks_merge.sql  (DRAFT — 검토/브랜치DB 테스트 후 적용)
-- 로그 스키마 통합: deep_logs → logs 흡수 + log_blocks(시퀀스) + user_routines
-- 설계 근거: docs/po/로그_스키마_매핑_영향분석_20260605.md
--
-- ⚠️ 적용 전 필수:
--   1) 라이브 DB 백업
--   2) 컬럼 존재/타입 select('*').limit(1)로 최종 확인
--   3) 코드 컷오버(rename/평탄화)와 같은 배포에 묶기 (캐시 컬럼 호환)
--   4) deep_logs DROP은 검증 후 별도 마이그레이션(여기서 안 함)
-- ADMIN_USER_ID = 23c431c3-9b23-4779-bb27-13472e58090a (통계 시드, 백필 제외)
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- STEP 1. 네이밍 통일 (RENAME 3건, 데이터 보존)
-- ---------------------------------------------------------------------
alter table logs rename column sauna_temp to dry_sauna_temp;   -- 건식 (id dry-sauna)
alter table logs rename column jjim_temp  to bulgama_temp;     -- 한증막 (id bulgama)
alter table logs rename column pause_time to rest_time;        -- 휴식 (category rest)

-- ---------------------------------------------------------------------
-- STEP 2. logs에 컬럼 추가
--   (가) deep_logs → logs 이전: 열탕/급냉 온도
--   (나) 신규 온도 캐시 3종: 소금/노천/아이스방
--   (다) deep_logs 흡수 필드 (평가/메타)
-- ---------------------------------------------------------------------
alter table logs
  add column if not exists very_hot_bath_temp  int,   -- (가) deep→logs
  add column if not exists ice_bath_temp        int,   -- (가) deep→logs
  add column if not exists salt_sauna_temp       int,   -- (나) 신규
  add column if not exists open_air_bath_temp    int,   -- (나) 신규
  add column if not exists ice_room_temp         int,   -- (나) 신규
  -- (다) deep_logs 흡수
  add column if not exists cleanliness           int,
  add column if not exists crowd                 text,
  add column if not exists companion             text,
  add column if not exists cost                  int,
  add column if not exists currency              text default 'KRW',
  add column if not exists memo                  text,
  add column if not exists scrub_types           text[] default '{}',
  add column if not exists scrub_cost            int,
  add column if not exists scrub_satisfaction    int,
  add column if not exists store_score           int,
  add column if not exists store_memo            text;
-- 주: has_very_hot_bath/has_ice_bath/has_scrub/has_store, food_eaten 는 흡수 안 함
--     (has_* = 값/블록 존재로 파생, food_eaten 폐기)

-- ---------------------------------------------------------------------
-- STEP 3. deep_logs → logs 백필 (has_* 게이팅 반영, 무손실)
-- ---------------------------------------------------------------------
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
  scrub_satisfaction  = case when d.has_scrub then d.scrub_satisfaction end,
  store_score         = case when d.has_store then d.store_score end,
  store_memo          = case when d.has_store then d.store_memo end
from deep_logs d
where d.log_id = l.id;

-- ---------------------------------------------------------------------
-- STEP 4. log_blocks (순서/반복/혼합/신규시설/평가의 정正) 생성
-- ---------------------------------------------------------------------
create table if not exists log_blocks (
  id            uuid primary key default gen_random_uuid(),
  log_id        uuid not null references logs(id) on delete cascade,
  seq           int  not null,                       -- 순서(= 루틴)
  block_type    text not null,                       -- BLOCK_TYPES.id (content.ts SSOT)
  category      text not null,                       -- 'heat'|'ice'|'rest'|'beyond' (other는 사용자선택)
  temp          int,                                 -- 온도 블록
  duration_sec  int,                                 -- 시간(초 통일) — UI는 냉탕/급냉=초, 그외=분
  score         int,                                 -- 1-5: 세신만족/매점점수/휴식퀄(의미는 block_type)
  cost          int,                                 -- 세신 가격
  memo          text,                                -- 매점 메모 / 기타(other) 설명
  norepeat      boolean not null default false,      -- 반복 제외(1회)
  created_at    timestamptz not null default now()
);
create index if not exists idx_log_blocks_log_id on log_blocks(log_id);
create index if not exists idx_log_blocks_type   on log_blocks(block_type);

alter table log_blocks enable row level security;
-- 읽기: 부모 log이 보이면(=logs RLS 통과) 블록도 보임 (explore 공개 피드 호환)
create policy log_blocks_read on log_blocks for select
  using (exists (select 1 from logs l where l.id = log_blocks.log_id));
-- 쓰기: 본인 log만
create policy log_blocks_write on log_blocks for all
  using      (exists (select 1 from logs l where l.id = log_blocks.log_id and l.user_id = auth.uid()))
  with check (exists (select 1 from logs l where l.id = log_blocks.log_id and l.user_id = auth.uid()));

-- ---------------------------------------------------------------------
-- STEP 5. user_routines (나만의 + 추천 시드)
-- ---------------------------------------------------------------------
create table if not exists user_routines (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,  -- NULL = 추천 시드
  tribe_id    text,
  name        text not null,
  icon        text,
  blocks      jsonb not null default '[]',   -- [{type,temp?,dur?,norepeat?,score?,cost?,memo?}]
  is_featured boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_user_routines_user on user_routines(user_id);

alter table user_routines enable row level security;
create policy user_routines_read on user_routines for select
  using (user_id is null or user_id = auth.uid());   -- 시드(공개) + 본인
create policy user_routines_write on user_routines for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- TODO(별도): 트라이브 추천 루틴 시드 INSERT (토토노우 입문, 찜질 풀코스 …) — user_id NULL, is_featured true

-- ---------------------------------------------------------------------
-- STEP 6. log_blocks 백필 — 기존 "유저" 로그를 합성 블록으로 (편집 플로우 필수)
--   · 어드민 시드(238)는 제외 (편집 대상 아님, 통계는 캐시로)
--   · 순서 = 카테고리 캐노니컬(heat→ice→rest→beyond). 진짜 순서는 원래 없음.
--   · 각 INSERT는 (log, block_type) 단위 idempotent (NOT EXISTS 가드)
--   · duration: heat_time(분)→sec는 사우나(primary)에만, ice_time(이미 sec)→냉탕, rest_time(분)→휴식
--   ⚠️ 합성 규칙은 리뷰/테스트 필수 (특히 heat_time 사우나 귀속, scrub_types 분기)
-- ---------------------------------------------------------------------

-- heat: 건식 (사우나 — primary면 heat_time 귀속)
insert into log_blocks (log_id, seq, block_type, category, temp, duration_sec)
select id, 1, 'dry-sauna', 'heat', dry_sauna_temp,
       case when coalesce(primary_sauna_kind,'dry') = 'dry' then heat_time * 60 end
from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a' and dry_sauna_temp is not null
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'dry-sauna');

-- heat: 습식
insert into log_blocks (log_id, seq, block_type, category, temp, duration_sec)
select id, 2, 'steam-sauna', 'heat', steam_sauna_temp,
       case when primary_sauna_kind = 'steam' then heat_time * 60 end
from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a' and steam_sauna_temp is not null
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'steam-sauna');

-- heat: 온탕/열탕/한증막 (탕·방 — heat_time 미귀속)
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

-- ice: 냉탕 (ice_time 이미 초) / 급냉탕
insert into log_blocks (log_id, seq, block_type, category, temp, duration_sec)
select id, 11, 'cold-bath', 'ice', cold_bath_temp, ice_time from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a' and cold_bath_temp is not null
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'cold-bath');

insert into log_blocks (log_id, seq, block_type, category, temp)
select id, 12, 'ice-bath', 'ice', ice_bath_temp from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a' and ice_bath_temp is not null
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'ice-bath');

-- rest: 휴식 (rest_time 분→초, 휴식 퀄=rest_quality→score)
insert into log_blocks (log_id, seq, block_type, category, duration_sec, score)
select id, 21, 'rest', 'rest',
       case when rest_time is not null then rest_time * 60 end,
       rest_quality
from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a'
  and (rest_time is not null or rest_quality is not null)
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'rest');

-- beyond: 세신 (만족도→score, 가격→cost)
insert into log_blocks (log_id, seq, block_type, category, score, cost)
select id, 31, 'scrub', 'beyond', scrub_satisfaction, scrub_cost from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a'
  and ( 'scrub' = any(scrub_types)
        or ( coalesce(array_length(scrub_types,1),0) = 0
             and (scrub_satisfaction is not null or scrub_cost is not null) ) )
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'scrub');

-- beyond: 마사지
insert into log_blocks (log_id, seq, block_type, category, score, cost)
select id, 32, 'massage', 'beyond', scrub_satisfaction, scrub_cost from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a' and 'massage' = any(scrub_types)
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'massage');

-- beyond: 매점 (점수→score, 메모→memo)
insert into log_blocks (log_id, seq, block_type, category, score, memo)
select id, 33, 'store', 'beyond', store_score, store_memo from logs
where user_id <> '23c431c3-9b23-4779-bb27-13472e58090a'
  and (store_score is not null or store_memo is not null)
  and not exists (select 1 from log_blocks b where b.log_id = logs.id and b.block_type = 'store');

-- 주: salt-sauna/open-air-bath/ice-room/aufguss/sleep/outdoor-rest/indoor-rest/other 는
--     레거시 데이터 없음(신규 컬럼/블록) → 백필 없음.

commit;

-- =====================================================================
-- 적용 후 검증 (수동 실행, 트랜잭션 밖)
-- =====================================================================
-- 1) 컬럼 확인:        select * from logs limit 1;
-- 2) 백필 카운트:      select count(*) from log_blocks;
--                      select block_type, count(*) from log_blocks group by 1 order by 2 desc;
-- 3) 무손실 점검:      유저 로그 중 온도/루틴 있는데 블록 0개인 행 없어야 함
--    select l.id from logs l
--    where l.user_id <> '23c431c3-9b23-4779-bb27-13472e58090a'
--      and (l.dry_sauna_temp is not null or l.cold_bath_temp is not null
--           or l.rest_time is not null or l.hot_bath_temp is not null
--           or l.bulgama_temp is not null or l.steam_sauna_temp is not null)
--      and not exists (select 1 from log_blocks b where b.log_id = l.id);
-- 4) 어드민 시드 캐시 보존: select count(*) from logs
--      where user_id = '23c431c3-9b23-4779-bb27-13472e58090a' and dry_sauna_temp is not null;
--
-- 코드 컷오버(같은 배포): types/content/logs-service + 표시면 rename·평탄화 (docs §11)
-- deep_logs DROP: 검증 후 030_drop_deep_logs.sql 로 분리
-- 롤백: log_blocks/user_routines DROP + 컬럼 RENAME 역수행 + ADD 컬럼 DROP
-- =====================================================================
