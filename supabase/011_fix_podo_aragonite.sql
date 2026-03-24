/**
 * 포도호텔 → 아라고나이트 고온천 수정
 *
 * 문제: 카톡 추출 시 포도호텔과 아라고나이트 고온천을 같은 시설로 합침
 * - 포도호텔: 공용 목욕시설 없음, 리뷰 0건 → 삭제
 * - 아라고나이트 고온천: 디아넥스호텔 부대시설, 외부이용 가능 → 신규 등록
 */

-- 1. 기존 포도호텔의 관련 데이터 정리 (list_items, logs 등이 있을 수 있음)
-- 어드민 로그가 있으면 함께 삭제됨 (CASCADE)
DELETE FROM places WHERE name = '핀크스 포도호텔';

-- 2. 아라고나이트 고온천 신규 등록
INSERT INTO places (name, address, facility_type, bath_policy)
VALUES (
  '아라고나이트 고온천',
  '제주특별자치도 서귀포시 안덕면 산록남로 762번길 71',
  'hotel-spa',
  'gender-bath'
);

-- 3. place_sources 등록 (검색용)
INSERT INTO place_sources (place_id, source, name_original, address_original)
SELECT id, 'manual', '아라고나이트 고온천', '제주특별자치도 서귀포시 안덕면 산록남로 762번길 71'
FROM places WHERE name = '아라고나이트 고온천';
