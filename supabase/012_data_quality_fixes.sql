/**
 * 데이터 품질 수정 — 2026-03-24
 *
 * 근본 원인: 카톡 추출 시 시설명/주소 교차검증 미수행
 * 발견: DB 스캔 38건 수상 + 주소 교차검증 (hotel-spa 40건)
 */

-- ─── 1. 삭제: 사우나 시설이 아닌 항목 ───

-- 온유재스파마사지 상무점: 마사지/에스테틱 업체, 사우나 아님
DELETE FROM places WHERE name = '온유재스파마사지 상무점';

-- ─── 2. 주소 수정 (교차검증 결과) ───

-- Aomoriya: "Horikirizawa-56" → 공식 주소에 Horikirizawa 없음
UPDATE places SET address = '56 Furumagiyama, Misawa, Aomori 033-0044'
WHERE name LIKE '%Aomoriya%';

-- 스파바이록시땅앳파크로쉬: "북평면" 누락
UPDATE places SET address = '강원특별자치도 정선군 북평면 중봉길 9-12 파크로쉬'
WHERE name LIKE '%파크로쉬%';

-- ─── 3. facility_type 재분류 (hotel 이름인데 public-bath로 등록된 것) ───

UPDATE places SET facility_type = 'hotel-spa' WHERE name = '소노캄 여수';
UPDATE places SET facility_type = 'hotel-spa' WHERE name = '수안보파크호텔';
UPDATE places SET facility_type = 'hotel-spa' WHERE name LIKE '%아난티%부산%';
UPDATE places SET facility_type = 'hotel-spa' WHERE name LIKE '%오라카이%청계산%';
UPDATE places SET facility_type = 'hotel-spa' WHERE name = '온양관광호텔';
UPDATE places SET facility_type = 'hotel-spa' WHERE name LIKE '%코오롱%호텔%';
UPDATE places SET facility_type = 'hotel-spa' WHERE name LIKE '%한화리조트%산정호수%';
UPDATE places SET facility_type = 'hotel-spa' WHERE name LIKE '%상관리조트%';

-- 반대: hotel-spa → public-bath
UPDATE places SET facility_type = 'public-bath' WHERE name = '이천 테르메덴';

-- ─── 4. 호텔탑스텐 금진온천: CSV 파싱 깨진 태그 복구 (확인 후 실행) ───
-- 금진온천: 외부 입장 가능, 대인 13,000원
-- UPDATE places SET memo = '천연온천. 대인 13,000원. 낚시+온천' WHERE name LIKE '%금진온천%';

-- ─── 5. 해외 주소 truncated 보완 (5건) ───

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
