/**
 * 데이터 품질 수정 — 2026-03-24
 */

-- ─── 1. 포도호텔 → 아라고나이트 고온천 분리 ───
-- 카톡 원본 확인: 포도호텔은 리뷰 0건, 공용 목욕시설 없음 → 삭제
-- 아라고나이트 고온천은 별도 시설 (디아넥스호텔 부대시설, 외부이용 가능)

DELETE FROM places WHERE name = '핀크스 포도호텔';

INSERT INTO places (name, address, facility_type, bath_policy)
VALUES (
  '아라고나이트 고온천',
  '제주특별자치도 서귀포시 안덕면 산록남로 762번길 71',
  'hotel-spa',
  'gender-bath'
);

INSERT INTO place_sources (place_id, source, name_original, address_original)
SELECT id, 'manual', '아라고나이트 고온천', '제주특별자치도 서귀포시 안덕면 산록남로 762번길 71'
FROM places WHERE name = '아라고나이트 고온천';

-- ─── 2. 온유재스파마사지: hotel-spa → private-sauna ───

UPDATE places SET facility_type = 'private-sauna'
WHERE name = '온유재스파마사지 상무점';

-- ─── 3. 주소 수정 — 교차검증 MISMATCH 2건 ───

UPDATE places SET address = '56 Furumagiyama, Misawa, Aomori 033-0044'
WHERE name LIKE '%Aomoriya%';

UPDATE places SET address = '강원특별자치도 정선군 북평면 중봉길 9-12 파크로쉬'
WHERE name LIKE '%파크로쉬%';

-- ─── 4. 해외 주소 truncated 보완 5건 ───

UPDATE places SET address = '1-chome-4-18 Nipponbashi, Chuo Ward, Osaka 542-0073'
WHERE name LIKE '%Onyado Nono%';

UPDATE places SET address = '3-13-12 Sakae, Naka Ward, Nagoya, Aichi 460-0008'
WHERE name LIKE '%Wellbe Sakae%';

UPDATE places SET address = '614 Tanigawa, Minakami, Tone District, Gunma 379-1619'
WHERE name LIKE '%Bettei Senjyuan%';

UPDATE places SET address = '257 Tano, Kokonoe, Kusu District, Oita 879-4911'
WHERE name LIKE '%Kannojigoku%';

UPDATE places SET address = '154 Noboribetsu Onsencho, Noboribetsu, Hokkaido 059-0592'
WHERE name LIKE '%Noboribetsu Grand%';

-- ─── 5. facility_type 재분류 9건 ───

-- public-bath → hotel-spa (8건)
UPDATE places SET facility_type = 'hotel-spa' WHERE name = '소노캄 여수';
UPDATE places SET facility_type = 'hotel-spa' WHERE name = '수안보파크호텔';
UPDATE places SET facility_type = 'hotel-spa' WHERE name LIKE '%아난티%부산%';
UPDATE places SET facility_type = 'hotel-spa' WHERE name LIKE '%오라카이%청계산%';
UPDATE places SET facility_type = 'hotel-spa' WHERE name = '온양관광호텔';
UPDATE places SET facility_type = 'hotel-spa' WHERE name LIKE '%코오롱%호텔%';
UPDATE places SET facility_type = 'hotel-spa' WHERE name LIKE '%한화리조트%산정호수%';
UPDATE places SET facility_type = 'hotel-spa' WHERE name LIKE '%상관리조트%';

-- hotel-spa → public-bath (1건)
UPDATE places SET facility_type = 'public-bath' WHERE name = '이천 테르메덴';

-- ─── 6. 해외 주소 검증 — MISMATCH 수정 4건 ───

-- Kumeya: 완전 오매핑 — 이자카야 주소가 등록됨. 실제 사우나는 오카야마현
UPDATE places SET
  name = 'Kumeya',
  address = '156-1 Nakaute, Mimasaka, Okayama 707-0413'
WHERE name LIKE '%Kumeya%';

-- Hiki stargazing sauna: 우편번호 오류 730-0852 → 730-0051
UPDATE places SET address = '8-17 Nekoyacho, Naka Ward, Hiroshima 730-0051'
WHERE name LIKE '%Hiki%stargazing%';

-- SATOYAMA TERRACE: 번지 898 → 898-1
UPDATE places SET address = '898-1 Tabara, Futtsu, Chiba 299-1755'
WHERE name LIKE '%SATOYAMA TERRACE%';

-- Kuusijärvi: 호수 이름만 기재 → 도로명 주소로 수정
UPDATE places SET address = 'Kuusijärventie 3, 01260 Vantaa, Finland'
WHERE name LIKE '%Kuusijärvi%';
