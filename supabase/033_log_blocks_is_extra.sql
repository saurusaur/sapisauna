-- =====================================================================
-- 033_log_blocks_is_extra.sql — 루틴 활동 vs 추가 온도 정보 구분 플래그
-- 작성 2026-06-13 / 실행: Supabase SQL 에디터 수동 / additive(무중단)
--
-- 배경: 더자세히 "시설 온도 추가"(temp-only 제보)와 deep 유래 백필 온도가
--       루틴 블록과 구분 없이 저장돼 타임라인·편집 복원에 루틴처럼 섞임.
-- 결정(2026-06-13, 유저 재확인):
--   · log_blocks.is_extra boolean — true = 루틴 외 시설 온도 제보.
--   · 유저 로그: 메인 루틴 온도만 루틴 — temp만 있고(시간·평가·가격·메모 없음)
--     트라이브 기본 루틴 시설(사우너=건식·습식·냉탕 / 목욕=온탕·열탕·냉탕 / 찜질=한증막)이
--     아닌 블록 → extra. (시간 있는 블록·세신/매점 등 평가 블록은 루틴 유지)
--   · 어드민 시드 로그: 루틴 아님 — **모든 온도 정보를 is_extra 블록으로 생성**
--     (기존 백필은 어드민 블록 생성을 제외했으므로 여기서 신규 생성)
-- =====================================================================

begin;

alter table log_blocks add column if not exists is_extra boolean not null default false;

-- 1. 유저 로그 레거시 마킹 (idempotent)
update log_blocks b set is_extra = true
from logs l
where b.log_id = l.id
  and l.user_id <> '23c431c3-9b23-4779-bb27-13472e58090a'
  and b.temp is not null
  and b.duration_sec is null and b.score is null and b.cost is null and b.memo is null
  and not (
       (l.tribe_id = 'saunner' and b.block_type in ('dry-sauna','steam-sauna','cold-bath'))
    or (l.tribe_id = 'bather'  and b.block_type in ('hot-bath','very-hot-bath','cold-bath'))
    or (l.tribe_id = 'jimi'    and b.block_type = 'bulgama')
  );

-- 2. 어드민 시드 로그: 모든 온도 캐시 → is_extra 블록 생성 (NOT EXISTS로 idempotent)
insert into log_blocks (log_id, seq, block_type, category, temp, norepeat, is_extra)
select l.id, t.seq, t.block_type, t.category, t.temp, true, true
from logs l
cross join lateral (values
  (1,  'dry-sauna',     'heat', l.dry_sauna_temp),
  (2,  'steam-sauna',   'heat', l.steam_sauna_temp),
  (3,  'hot-bath',      'heat', l.hot_bath_temp),
  (4,  'very-hot-bath', 'heat', l.very_hot_bath_temp),
  (5,  'bulgama',       'heat', l.bulgama_temp),
  (6,  'salt-sauna',    'heat', l.salt_sauna_temp),
  (7,  'open-air-bath', 'heat', l.open_air_bath_temp),
  (11, 'cold-bath',     'ice',  l.cold_bath_temp),
  (12, 'ice-bath',      'ice',  l.ice_bath_temp),
  (13, 'ice-room',      'ice',  l.ice_room_temp)
) as t(seq, block_type, category, temp)
where l.user_id = '23c431c3-9b23-4779-bb27-13472e58090a'
  and t.temp is not null
  and not exists (select 1 from log_blocks b where b.log_id = l.id and b.block_type = t.block_type);

commit;

-- 검증
-- V1. 분포 (유저/어드민 × is_extra)
select (l.user_id = '23c431c3-9b23-4779-bb27-13472e58090a') as is_admin, b.is_extra, count(*)
from log_blocks b join logs l on l.id = b.log_id group by 1, 2 order by 1, 2;
-- V2. 어드민 블록 중 루틴(is_extra=false) = 0이어야 함
select count(*) as admin_routine_blocks from log_blocks b join logs l on l.id = b.log_id
where l.user_id = '23c431c3-9b23-4779-bb27-13472e58090a' and b.is_extra = false;
-- V3. extra로 분류된 블록 타입 분포 (감각 점검 — 열탕/급냉/건식(비사우너) 등이어야 자연스러움)
select block_type, count(*) from log_blocks where is_extra group by 1 order by 2 desc;
-- V4. 루틴으로 남은 temp-only 블록 (트라이브 기본 시설인지 눈검증)
select l.tribe_id, b.block_type, count(*)
from log_blocks b join logs l on l.id = b.log_id
where b.is_extra = false and b.temp is not null
  and b.duration_sec is null and b.score is null and b.cost is null and b.memo is null
group by 1, 2 order by 1, 3 desc;
