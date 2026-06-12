-- =====================================================================
-- 034_heat_routing_fix.sql — 레거시 heat_time 귀속 교정 + 세신 variant 정규화
-- 작성 2026-06-13 / 근거: docs/po/마이그레이션_무손실_대조리포트_20260613.md
--
-- 대조검사 발견 3건(아트리파라다이스·죽전누리=jimi, 킹스호텔=bather):
-- 029 원본이 primary_sauna_kind(기본 dry)를 트라이브보다 우선해 heat_time을
-- 건식 블록에 귀속 → 트라이브 라우팅 확정안(jimi=한증막, bather=온탕→열탕)대로 이동.
-- 조건 기반이라 동일 패턴 전부 교정 + 멱등. 시간 총합 불변(이동만).
-- =====================================================================

begin;

-- 1. jimi: 건식 블록의 duration → 한증막 블록으로 이동 (둘 다 존재할 때만)
update log_blocks tgt set duration_sec = src.duration_sec
from log_blocks src, logs l
where l.id = tgt.log_id and src.log_id = l.id
  and l.tribe_id = 'jimi'
  and src.block_type = 'dry-sauna' and src.is_extra = false and src.duration_sec is not null
  and tgt.block_type = 'bulgama' and tgt.duration_sec is null;

update log_blocks src set duration_sec = null
from logs l
where l.id = src.log_id and l.tribe_id = 'jimi'
  and src.block_type = 'dry-sauna' and src.is_extra = false and src.duration_sec is not null
  and exists (select 1 from log_blocks t where t.log_id = l.id and t.block_type = 'bulgama' and t.duration_sec = src.duration_sec);

-- 2. bather: 건식 블록의 duration → 온탕(없으면 열탕) 블록으로 이동
update log_blocks tgt set duration_sec = src.duration_sec
from log_blocks src, logs l
where l.id = tgt.log_id and src.log_id = l.id
  and l.tribe_id = 'bather'
  and src.block_type = 'dry-sauna' and src.is_extra = false and src.duration_sec is not null
  and tgt.duration_sec is null
  and tgt.block_type = case when exists (select 1 from log_blocks h where h.log_id = l.id and h.block_type = 'hot-bath')
                            then 'hot-bath' else 'very-hot-bath' end;

update log_blocks src set duration_sec = null
from logs l
where l.id = src.log_id and l.tribe_id = 'bather'
  and src.block_type = 'dry-sauna' and src.is_extra = false and src.duration_sec is not null
  and exists (select 1 from log_blocks t where t.log_id = l.id and t.block_type in ('hot-bath','very-hot-bath') and t.duration_sec = src.duration_sec);

-- 3. duration을 넘기고 temp도 없는 건식 블록 → 잔재 정리 (temp-only도 아니고 빈 껍데기인 경우)
delete from log_blocks
where block_type = 'dry-sauna' and is_extra = false
  and temp is null and duration_sec is null and score is null and cost is null and memo is null;

-- 4. (표현 정규화) 세신 variant null → 'basic' — 코드상 동등이나 일관화
update log_blocks set variant = 'basic' where block_type = 'scrub' and variant is null;

commit;

-- 검증
-- V1. 비(非)사우너 로그에 duration 있는 루틴 건식 블록 = 0이어야 함
select count(*) from log_blocks b join logs l on l.id = b.log_id
where l.tribe_id <> 'saunner' and b.block_type = 'dry-sauna' and b.is_extra = false and b.duration_sec is not null;
-- V2. 교정 대상 3건 확인 (아트리파라다이스 등) — bulgama/hot-bath에 duration 있어야 함
select l.tribe_id, b.block_type, b.duration_sec, b.temp
from log_blocks b join logs l on l.id = b.log_id
where l.id in ('4c37eb4e-8b49-40eb-8a1b-c1896edd8572')
   or b.log_id in (select id from logs where heat_time in (12, 15) and tribe_id in ('jimi','bather'))
order by b.log_id, b.seq;
-- V3. variant null 세신 = 0
select count(*) from log_blocks where block_type = 'scrub' and variant is null;
