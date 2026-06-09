-- =====================================================================
-- 031_places_data_tier.sql  (EXPAND — additive, 무중단)
-- 지도 2티어: places에 data_tier 칸 추가.
--   rich  = 검수 312곳 (온도·시설·트라이브픽·리뷰)  → 추천·픽·랭킹 대상
--   basic = 공공데이터 ~5천곳 (이름·주소·영업상태)   → 지도 커버리지용
-- 설계 무관(2티어는 결정 완료) → 개발자 5천 적재 전에 지금 적용 가능.
-- 030_cleanup와 독립. ⚠️ 적용 전 백업 + 라이브 DB에서 select * from places limit 1 로 칸 확인.
-- =====================================================================

begin;

alter table places
  add column if not exists data_tier text not null default 'rich';
-- 기본값 'rich' → 기존 312곳 자동 rich. 공공데이터는 data_tier='basic'로 INSERT.

do $$ begin
  alter table places add constraint places_data_tier_chk check (data_tier in ('rich','basic'));
exception when duplicate_object then null; end $$;

create index if not exists idx_places_data_tier on places(data_tier);

commit;

-- 쿼리 컨벤션(코드): 추천·트라이브픽·랭킹 = where data_tier='rich'.
--                    지도 마커 = 전체(rich+basic), 시각만 구분.
-- 검증: select data_tier, count(*) from places group by 1;   -- 기존 전부 rich 확인
-- =====================================================================
