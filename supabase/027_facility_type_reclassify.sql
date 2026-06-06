-- 027: facility_type 전수검수 재분류 2차 (026 후속)
-- 배경: DB 전수검수(255) + 유저 개별 결정. hotel-premium = 럭셔리/프리미엄 구분 태그(숙박 무관),
--       resort-spa = 캐주얼 대형 온천리조트/스파/워터파크, public-bath = 대중 사우나/목욕/온천.
-- 참고: docs/research/katalk-20260519/katalk-db-full-audit-20260601.md, katalk-reclassify-candidates-20260601.md

-- → resort-spa (7): 대형 온천리조트/스파
UPDATE places SET facility_type = 'resort-spa', updated_at = NOW()
WHERE id IN (
  '72dba5ca-1c84-4acb-ba51-2ed9a32bf324', -- 센텀 스파랜드 (부산)
  '7a76b1ea-9ef1-4c15-a34d-778ae95e7fff', -- 더앤리조트스파 (양양)
  '0a53b809-64db-4baf-8746-8c5809c80ddc', -- 석정온천휴스파 (고창)
  '78998a61-18d9-4228-aa25-65849fa91845', -- 신북온천 리조트 (춘천)
  '5e62bc5c-a107-42c6-abd1-b768b034cf0b', -- 스파리조트 안단테
  '317665c5-034b-4b50-98a7-f4e953b7cde3', -- 소노벨청송 솔샘온천
  '9ac220df-2a42-4b1d-8969-4e0b57830f82'  -- Elamus Spa (EE)
);

-- → hotel-premium (3): 일본 료칸/프리미엄 (public-bath에서 이동)
UPDATE places SET facility_type = 'hotel-premium', updated_at = NOW()
WHERE id IN (
  '87791b43-5818-4d17-82af-ea423597c34c', -- Midorinokaze Resort Kitayuzawa (JP)
  'c0bd8983-6e5f-49f7-b17d-b2ae4a9d5c17', -- Shiriuchi Onsen Kokyu no Ma (JP)
  '94b7a83a-d1da-42df-9115-1b2a30d2efc5'  -- SATOYAMA TERRACE (JP)
);

-- → public-bath (2): 숙박없는/럭셔리아닌 사우나 전문 (hotel-premium에서 이동)
UPDATE places SET facility_type = 'public-bath', updated_at = NOW()
WHERE id IN (
  'df948f6a-f514-4e6b-b3fa-7462efbdf873', -- 프리마스파 (청담)
  'ca118a6e-453d-4240-a4ba-d7f36b12187a'  -- Wellbe Sakae (JP)
);

-- 확인용:
-- SELECT facility_type, COUNT(*) FROM places GROUP BY facility_type ORDER BY 2 DESC;
