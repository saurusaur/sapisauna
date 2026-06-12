-- =====================================================================
-- 032_food_to_restaurant.sql — places.facilities 구 'food' 태그 일괄 치환
-- 작성 2026-06-12 / 실행: Supabase SQL 에디터 수동
--
-- 결정(2026-06-12): 구 'food'(앱 라벨 "매점") → 일괄 'restaurant'(식당) 치환 후,
-- 유저가 건별로 검증해 매점인 곳만 'snack'으로 수정. (일괄 snack 아님 — 유저 확정)
-- =====================================================================

-- 0. 치환 전 현황
select count(*) as food_tagged from places where 'food' = any(facilities);

-- 1. 일괄 치환 (idempotent — food 없으면 no-op)
begin;
update places
set facilities = array_replace(facilities, 'food', 'restaurant')
where 'food' = any(facilities);
commit;

-- 2. 치환 후 확인 (food=0, restaurant=치환 전 food 수 이상)
select
  count(*) filter (where 'food' = any(facilities))       as food_left,
  count(*) filter (where 'restaurant' = any(facilities)) as restaurant_tagged,
  count(*) filter (where 'snack' = any(facilities))      as snack_tagged
from places;

-- 3. 건별 검증용 목록 — restaurant 태그 장소 전체 (매점인 곳을 찾아 snack으로 수정)
select p.id, ps.name_original, p.facility_type, p.facilities
from places p
join place_sources ps on ps.place_id = p.id
where 'restaurant' = any(p.facilities)
order by ps.name_original;

-- 4. 건별 수정 템플릿 (매점으로 판명된 장소)
-- update places set facilities = array_replace(facilities, 'restaurant', 'snack') where id = '<place_id>';
