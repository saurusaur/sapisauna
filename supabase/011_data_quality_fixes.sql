/**
 * 데이터 품질 수정 — 2026-03-24
 *
 * DB 구조: places에는 name/address 없음. 이름/주소는 place_sources 테이블에서 관리.
 * → place_sources.name_original / address_original 으로 조회/수정
 */

-- ─── 1. 포도호텔 → 아라고나이트 고온천 분리 ───

-- 포도호텔 삭제 (CASCADE로 place_sources, list_items, logs 함께 삭제)
DELETE FROM places WHERE id IN (
  SELECT place_id FROM place_sources WHERE name_original LIKE '%포도호텔%'
);

-- 아라고나이트 고온천 신규 등록 (DO 블록으로 id 안전 연결)
DO $$
DECLARE new_id UUID;
BEGIN
  INSERT INTO places (facility_type, bath_policy, country_code)
  VALUES ('hotel-spa', 'gender-bath', 'KR')
  RETURNING id INTO new_id;

  INSERT INTO place_sources (place_id, source, name_original, address_original)
  VALUES (new_id, 'manual', '아라고나이트 고온천', '제주특별자치도 서귀포시 안덕면 산록남로 762번길 71');
END $$;

-- ─── 2. 온유재스파마사지: facility_type 변경 ───

UPDATE places SET facility_type = 'private-sauna'
WHERE id IN (
  SELECT place_id FROM place_sources WHERE name_original LIKE '%온유재스파%'
);

-- ─── 3. 주소 수정 — 한국 MISMATCH 2건 ───

UPDATE place_sources SET address_original = '강원특별자치도 정선군 북평면 중봉길 9-12 파크로쉬'
WHERE name_original LIKE '%파크로쉬%';

UPDATE place_sources SET address_original = '56 Furumagiyama, Misawa, Aomori, Japan'
WHERE name_original LIKE '%Aomoriya%';

-- ─── 4. 전체 해외 주소 정리 ───
-- Google API formatted_address 포맷: "번지, 구, 도시, 현, 국가명"
-- short_address: 콤마 뒤에서 2개 → "현, Japan" 또는 "도시, Country"

-- 일본 hotel-spa
UPDATE place_sources SET address_original = '1-4-18 Nipponbashi, Chuo-ku, Osaka, Japan' WHERE name_original LIKE '%Onyado Nono%';
UPDATE place_sources SET address_original = '3-13-12 Sakae, Naka-ku, Nagoya, Aichi, Japan' WHERE name_original LIKE '%Wellbe Sakae%';
UPDATE place_sources SET address_original = '614 Tanigawa, Minakami, Gunma, Japan' WHERE name_original LIKE '%Bettei Senjyuan%';
UPDATE place_sources SET address_original = '257 Tano, Kokonoe, Oita, Japan' WHERE name_original LIKE '%Kannojigoku%';
UPDATE place_sources SET address_original = '154 Noboribetsu Onsencho, Noboribetsu, Hokkaido, Japan' WHERE name_original LIKE '%Noboribetsu Grand%';
UPDATE place_sources SET address_original = '518 Yoroushi, Nakashibetsu, Hokkaido, Japan' WHERE name_original LIKE '%Yuyado Daiichi%';
UPDATE place_sources SET address_original = '1887-1 Yugashima, Izu, Shizuoka, Japan' WHERE name_original = 'Ochiairo';
UPDATE place_sources SET address_original = '1-2-2 Azabudai, Minato-ku, Tokyo, Japan' WHERE name_original LIKE '%Janu Tokyo%';
UPDATE place_sources SET address_original = '4100 Takeocho Takeo, Takeo, Saga, Japan' WHERE name_original LIKE '%Mifuneyama%';
UPDATE place_sources SET address_original = '172 Utorohigashi, Shari, Hokkaido, Japan' WHERE name_original LIKE '%Kitakobushi%';

-- 일본 non-hotel-spa
UPDATE place_sources SET address_original = '1-182-3 Toyonari, Minami-ku, Okayama, Japan' WHERE name_original LIKE '%sauna kolme kyl%';
UPDATE place_sources SET address_original = '941-1 Mineyamacho Sugitani, Kyotango, Kyoto, Japan' WHERE name_original LIKE '%Nukatoyuge%';
UPDATE place_sources SET address_original = '1-1-4 Ohiraki, Fukushima-ku, Osaka, Japan' WHERE name_original LIKE '%Wagamachi%';
UPDATE place_sources SET address_original = '3-13-4 Akasaka, Minato-ku, Tokyo, Japan' WHERE name_original LIKE '%Sauna Tokyo%';
UPDATE place_sources SET address_original = '2-5-9 Osawa, Izumi-ku, Sendai, Miyagi, Japan' WHERE name_original LIKE '%Spa Met%Sendai%';
UPDATE place_sources SET address_original = '479-107 Hirano, Yamanakako, Yamanashi, Japan' WHERE name_original = 'CYCL';
UPDATE place_sources SET address_original = '3-20-14 Sekibara, Adachi-ku, Tokyo, Japan' WHERE name_original LIKE '%Hotta-yu%';
UPDATE place_sources SET address_original = '1-4-12 Tachibana, Naka-ku, Nagoya, Aichi, Japan' WHERE name_original LIKE '%KIWAMI SAUNA%';
UPDATE place_sources SET address_original = '2-271 Kitanaka, Tokorozawa, Saitama, Japan' WHERE name_original LIKE '%Onsen Balcony%';
UPDATE place_sources SET address_original = '9-5 Tsunabamachi, Hakata-ku, Fukuoka, Japan' WHERE name_original LIKE '%SAUNA SAKURADO%';
UPDATE place_sources SET address_original = '2-19-12 Takashima, Nishi-ku, Yokohama, Kanagawa, Japan' WHERE name_original LIKE '%SKY SPA%';
UPDATE place_sources SET address_original = '5-7 Kasumigaokamachi, Shinjuku-ku, Tokyo, Japan' WHERE name_original LIKE '%TOTOPA%';
UPDATE place_sources SET address_original = '9-5-12 Akasaka, Minato-ku, Tokyo, Japan' WHERE name_original LIKE '%TREATMENT SAUNA%';
UPDATE place_sources SET address_original = '379-2 Nojiri, Shinano, Nagano, Japan' WHERE name_original = 'The Sauna';
UPDATE place_sources SET address_original = '722 Honjocho, Chuo-ku, Kumamoto, Japan' WHERE name_original = 'Yulax';
UPDATE place_sources SET address_original = '2599 Izumi, Motobu, Okinawa, Japan' WHERE name_original LIKE '%Jungle Photo%';
UPDATE place_sources SET address_original = '1-6-1 Oi, Shinagawa-ku, Tokyo, Japan' WHERE name_original LIKE '%Shinagawa Sauna%';
UPDATE place_sources SET address_original = '1050-4 Showa, Sanuki, Kagawa, Japan' WHERE name_original LIKE '%TSUKAHARA%';
UPDATE place_sources SET address_original = '3-6-18 Minamisenba, Chuo-ku, Osaka, Japan' WHERE name_original LIKE '%Osaka Sauna DESSE%';
UPDATE place_sources SET address_original = '292-2 Ikenoshiri Arimacho, Kita-ku, Kobe, Hyogo, Japan' WHERE name_original LIKE '%Taikou-no-Yu%';
UPDATE place_sources SET address_original = '18-9 Sakuragaokacho, Shibuya-ku, Tokyo, Japan' WHERE name_original LIKE '%Shibuya Saunas%';
UPDATE place_sources SET address_original = '300-2 Otakiku Kitayuzawa Onsencho, Date, Hokkaido, Japan' WHERE name_original LIKE '%Midorinokaze%';
UPDATE place_sources SET address_original = '8-17 Nekoyacho, Naka-ku, Hiroshima, Japan' WHERE name_original LIKE '%Hiki%stargazing%';
UPDATE place_sources SET address_original = '898-1 Tabara, Futtsu, Chiba, Japan' WHERE name_original LIKE '%SATOYAMA TERRACE%';

-- 유럽/미국
UPDATE place_sources SET address_original = '9A Vana-Kalamaja, Tallinn, Estonia' WHERE name_original LIKE '%Kalma Saun%';
UPDATE place_sources SET address_original = '23b Rauhaniementie, Tampere, Finland' WHERE name_original LIKE '%Rauhaniemi%';
UPDATE place_sources SET address_original = '4 Hernesaarenranta, Helsinki, Finland' WHERE name_original LIKE '%Löyly%';
UPDATE place_sources SET address_original = '9 Pispalan valtatie, Tampere, Finland' WHERE name_original LIKE '%Rajaportti%';
UPDATE place_sources SET address_original = 'Passeig de Picasso 22, Barcelona, Spain' WHERE name_original LIKE '%AIRE Ancient%';
UPDATE place_sources SET address_original = 'Thermenallee 1-5, Erding, Germany' WHERE name_original LIKE '%Therme Erding%';
UPDATE place_sources SET address_original = 'Roemerplatz 1, Baden-Baden, Germany' WHERE name_original LIKE '%Friedrichsbad%';
UPDATE place_sources SET address_original = 'Akadeemia tee 30, Tallinn, Estonia' WHERE name_original LIKE '%Elamus%';
UPDATE place_sources SET address_original = '103 N 10th St, Brooklyn, NY, USA' WHERE name_original LIKE '%Bathhouse Williamsburg%';
UPDATE place_sources SET address_original = '23 W 20th St, New York, NY, USA' WHERE name_original LIKE '%Othership%';
UPDATE place_sources SET address_original = 'Kuusijärventie 3, Vantaa, Finland' WHERE name_original LIKE '%Kuusijärvi%';

-- ─── 5. facility_type 재분류 9건 ───

UPDATE places SET facility_type = 'hotel-spa' WHERE id IN (SELECT place_id FROM place_sources WHERE name_original = '소노캄 여수');
UPDATE places SET facility_type = 'hotel-spa' WHERE id IN (SELECT place_id FROM place_sources WHERE name_original = '수안보파크호텔');
UPDATE places SET facility_type = 'hotel-spa' WHERE id IN (SELECT place_id FROM place_sources WHERE name_original LIKE '%아난티%부산%');
UPDATE places SET facility_type = 'hotel-spa' WHERE id IN (SELECT place_id FROM place_sources WHERE name_original LIKE '%오라카이%청계산%');
UPDATE places SET facility_type = 'hotel-spa' WHERE id IN (SELECT place_id FROM place_sources WHERE name_original = '온양관광호텔');
UPDATE places SET facility_type = 'hotel-spa' WHERE id IN (SELECT place_id FROM place_sources WHERE name_original LIKE '%코오롱%호텔%');
UPDATE places SET facility_type = 'hotel-spa' WHERE id IN (SELECT place_id FROM place_sources WHERE name_original LIKE '%한화리조트%산정호수%');
UPDATE places SET facility_type = 'hotel-spa' WHERE id IN (SELECT place_id FROM place_sources WHERE name_original LIKE '%상관리조트%');
UPDATE places SET facility_type = 'public-bath' WHERE id IN (SELECT place_id FROM place_sources WHERE name_original = '이천 테르메덴');

-- ─── 6. Kumeya 오매핑 수정 ───

UPDATE place_sources SET
  name_original = 'Kumeya',
  address_original = '156-1 Nakaute, Mimasaka, Okayama, Japan'
WHERE name_original LIKE '%Kumeya%';

-- ─── 7. country_code 오류 11건 (KR → JP) ───

UPDATE places SET country_code = 'JP', updated_at = NOW()
WHERE id IN (
  '0130e29a-430a-49f0-afdf-4f414cd288f8',
  'a5414757-8ad8-4d80-a18b-070365715b23',
  '346d8006-958e-491e-9cfd-11f66ace5299',
  '5b79400d-f1a2-4319-b4e7-714d7f0dfb8e',
  'ca118a6e-453d-4240-a4ba-d7f36b12187a',
  '5051b444-0ed3-4188-9cf0-c96b5c351585',
  '44cb9251-f776-4d02-8f25-47ca4d66baf3',
  '5cf44bec-80f8-4ec2-9071-f91d778b7bdd',
  '9f22876a-bb94-4a6c-a537-3fcf8a1cab78',
  'a887626e-0f2c-4385-aed1-c75c052649c3',
  '87791b43-5818-4d17-82af-ea423597c34c'
);

-- ─── 8. 시설유형 추가 수정 2건 ───

UPDATE places SET facility_type = 'hotel-spa'
WHERE id IN (SELECT place_id FROM place_sources WHERE name_original LIKE '%더케이호텔경주%');

UPDATE places SET facility_type = 'hotel-spa'
WHERE id IN (SELECT place_id FROM place_sources WHERE name_original LIKE '%스플라스%');

-- ─── 9. 온도 이상치 수정 (어드민 로그 기준) ───
-- 어드민 ID: 23c431c3-9b23-4779-bb27-13472e58090a
-- 온도는 logs(온탕/냉탕) + deep_logs(열탕/건식/습식)에 저장됨

-- 도미인 강남: 온탕 30도 제거 (미온탕인지 불확실)
UPDATE logs SET hot_bath_temp = NULL
WHERE user_id = '23c431c3-9b23-4779-bb27-13472e58090a'
  AND place_id IN (SELECT place_id FROM place_sources WHERE name_original LIKE '%도미인%강남%')
  AND hot_bath_temp = 30;

-- 진천스카이사우나: 온탕 30도 제거 (리뷰어도 이상하다고 인지)
UPDATE logs SET hot_bath_temp = NULL
WHERE user_id = '23c431c3-9b23-4779-bb27-13472e58090a'
  AND place_id IN (SELECT place_id FROM place_sources WHERE name_original LIKE '%진천스카이%')
  AND hot_bath_temp = 30;

-- 오성건강랜드: 냉탕 26→23 (리뷰 텍스트 "냉탕 23도"와 온도란 26도 불일치 → 23이 맞음)
UPDATE logs SET cold_bath_temp = 23
WHERE user_id = '23c431c3-9b23-4779-bb27-13472e58090a'
  AND place_id IN (SELECT place_id FROM place_sources WHERE name_original LIKE '%오성건강%')
  AND cold_bath_temp = 26;

-- 파크하비오: 열탕 40도 제거 (온탕=열탕 동일값, 온탕 40만 유지)
UPDATE deep_logs SET very_hot_bath_temp = NULL
WHERE log_id IN (
  SELECT l.id FROM logs l
  WHERE l.user_id = '23c431c3-9b23-4779-bb27-13472e58090a'
    AND l.place_id IN (SELECT place_id FROM place_sources WHERE name_original LIKE '%파크하비오%')
)
AND very_hot_bath_temp = 40;

-- ─── 10. 레몬사우나 열탕 수정 (DB 중복 없음, CSV만 중복) ───
-- 열탕 40→42 (katalk-detail-v2 원본: 42|43)

UPDATE deep_logs SET very_hot_bath_temp = 42
WHERE log_id IN (
  SELECT l.id FROM logs l
  WHERE l.user_id = '23c431c3-9b23-4779-bb27-13472e58090a'
    AND l.place_id = 'ee2b63df-4c0d-478a-85d3-1fca698cc43f'
)
AND very_hot_bath_temp = 40;

-- ─── 11. 도미인 인사동 입장료 삭제 (숙박비 포함가격) ───

UPDATE deep_logs SET cost = NULL
WHERE log_id IN (
  SELECT l.id FROM logs l
  WHERE l.user_id = '23c431c3-9b23-4779-bb27-13472e58090a'
    AND l.place_id IN (SELECT place_id FROM place_sources WHERE name_original LIKE '%도미인%인사동%')
)
AND cost = 140000;
