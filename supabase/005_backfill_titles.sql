-- 004: 기존 유저 칭호·XP 소급 반영
-- 실행 조건: 003_user_titles.sql + 005_base_title.sql 적용 후
-- 멱등: UNIQUE(user_id, title) + base_title 체크로 중복 삽입 안 됨

-- ============================================
-- 1. 베타 기간 가입 유저 → "첫 사-피엔스" 지급
-- ============================================
INSERT INTO user_titles (user_id, title, source, base_title)
SELECT id, '첫 사-피엔스', 'beta', '첫 사-피엔스'
FROM users
ON CONFLICT (user_id, title) DO NOTHING;

-- ============================================
-- 2. 트라이브별 로그 수 마일스톤
-- ============================================

-- 사우너 첫 로그 → 사우나돌
INSERT INTO user_titles (user_id, title, source, base_title)
SELECT DISTINCT l.user_id, '사우나돌', 'milestone', '사우나돌'
FROM logs l
WHERE l.tribe_id = 'saunner'
GROUP BY l.user_id
HAVING COUNT(*) >= 1
ON CONFLICT (user_id, title) DO NOTHING;

-- 사우너 10회 → 열기 수련생
INSERT INTO user_titles (user_id, title, source, base_title)
SELECT l.user_id, '열기 수련생', 'milestone', '열기 수련생'
FROM logs l
WHERE l.tribe_id = 'saunner'
GROUP BY l.user_id
HAVING COUNT(*) >= 10
ON CONFLICT (user_id, title) DO NOTHING;

-- 사우너 30회 → 증기의 제왕
INSERT INTO user_titles (user_id, title, source, base_title)
SELECT l.user_id, '증기의 제왕', 'milestone', '증기의 제왕'
FROM logs l
WHERE l.tribe_id = 'saunner'
GROUP BY l.user_id
HAVING COUNT(*) >= 30
ON CONFLICT (user_id, title) DO NOTHING;

-- 목욕파 첫 로그 → 물두꺼비
INSERT INTO user_titles (user_id, title, source, base_title)
SELECT DISTINCT l.user_id, '물두꺼비', 'milestone', '물두꺼비'
FROM logs l
WHERE l.tribe_id = 'bather'
GROUP BY l.user_id
HAVING COUNT(*) >= 1
ON CONFLICT (user_id, title) DO NOTHING;

-- 목욕파 10회 → 탕의 수호자
INSERT INTO user_titles (user_id, title, source, base_title)
SELECT l.user_id, '탕의 수호자', 'milestone', '탕의 수호자'
FROM logs l
WHERE l.tribe_id = 'bather'
GROUP BY l.user_id
HAVING COUNT(*) >= 10
ON CONFLICT (user_id, title) DO NOTHING;

-- 목욕파 30회 → 용왕의 후예
INSERT INTO user_titles (user_id, title, source, base_title)
SELECT l.user_id, '용왕의 후예', 'milestone', '용왕의 후예'
FROM logs l
WHERE l.tribe_id = 'bather'
GROUP BY l.user_id
HAVING COUNT(*) >= 30
ON CONFLICT (user_id, title) DO NOTHING;

-- 찜질파 첫 로그 → 구운달걀
INSERT INTO user_titles (user_id, title, source, base_title)
SELECT DISTINCT l.user_id, '구운달걀', 'milestone', '구운달걀'
FROM logs l
WHERE l.tribe_id = 'jimi'
GROUP BY l.user_id
HAVING COUNT(*) >= 1
ON CONFLICT (user_id, title) DO NOTHING;

-- 찜질파 10회 → 불가마 단골
INSERT INTO user_titles (user_id, title, source, base_title)
SELECT l.user_id, '불가마 단골', 'milestone', '불가마 단골'
FROM logs l
WHERE l.tribe_id = 'jimi'
GROUP BY l.user_id
HAVING COUNT(*) >= 10
ON CONFLICT (user_id, title) DO NOTHING;

-- 찜질파 30회 → 불의 지배자
INSERT INTO user_titles (user_id, title, source, base_title)
SELECT l.user_id, '불의 지배자', 'milestone', '불의 지배자'
FROM logs l
WHERE l.tribe_id = 'jimi'
GROUP BY l.user_id
HAVING COUNT(*) >= 30
ON CONFLICT (user_id, title) DO NOTHING;

-- ============================================
-- 3. 3트라이브 노마드
-- ============================================
INSERT INTO user_titles (user_id, title, source, base_title)
SELECT l.user_id, '노마드', 'milestone', '노마드'
FROM logs l
GROUP BY l.user_id
HAVING COUNT(DISTINCT l.tribe_id) >= 3
ON CONFLICT (user_id, title) DO NOTHING;

-- ============================================
-- 4. 장소 마일스톤
-- ============================================

-- 첫 장소 등록 → 개척자
INSERT INTO user_titles (user_id, title, source, base_title)
SELECT p.created_by, '개척자', 'milestone', '개척자'
FROM places p
WHERE p.created_by IS NOT NULL
GROUP BY p.created_by
HAVING COUNT(*) >= 1
ON CONFLICT (user_id, title) DO NOTHING;

-- 장소 10개 → 탐험가
INSERT INTO user_titles (user_id, title, source, base_title)
SELECT p.created_by, '탐험가', 'milestone', '탐험가'
FROM places p
WHERE p.created_by IS NOT NULL
GROUP BY p.created_by
HAVING COUNT(*) >= 10
ON CONFLICT (user_id, title) DO NOTHING;

-- 장소 30개 → 지도제작자
INSERT INTO user_titles (user_id, title, source, base_title)
SELECT p.created_by, '지도제작자', 'milestone', '지도제작자'
FROM places p
WHERE p.created_by IS NOT NULL
GROUP BY p.created_by
HAVING COUNT(*) >= 30
ON CONFLICT (user_id, title) DO NOTHING;

-- ============================================
-- 5. XP 소급 계산 + 레벨 반영
--    숏로그 20 + 딥로그 30 + 장소신규 50 + 웰컴 20
--    (장소 merge XP는 추적 불가 → 생략)
-- ============================================
UPDATE users SET xp = sub.total_xp
FROM (
  SELECT
    u.id,
    20  -- 웰컴 XP
    + COALESCE(log_xp.xp, 0)
    + COALESCE(deep_xp.xp, 0)
    + COALESCE(place_xp.xp, 0)
    AS total_xp
  FROM users u
  LEFT JOIN (
    SELECT user_id, COUNT(*) * 20 AS xp FROM logs GROUP BY user_id
  ) log_xp ON log_xp.user_id = u.id
  LEFT JOIN (
    SELECT l.user_id, COUNT(*) * 30 AS xp
    FROM deep_logs d JOIN logs l ON l.id = d.log_id
    GROUP BY l.user_id
  ) deep_xp ON deep_xp.user_id = u.id
  LEFT JOIN (
    SELECT created_by AS user_id, COUNT(*) * 50 AS xp
    FROM places WHERE created_by IS NOT NULL
    GROUP BY created_by
  ) place_xp ON place_xp.user_id = u.id
) sub
WHERE users.id = sub.id;

-- 레벨 계산: Lv0→1 = 20XP, Lv1-10 = 40XP 고정
UPDATE users SET level =
  CASE
    WHEN xp < 20 THEN 0
    WHEN xp < 60 THEN 1
    WHEN xp < 100 THEN 2
    WHEN xp < 140 THEN 3
    WHEN xp < 180 THEN 4
    WHEN xp < 220 THEN 5
    WHEN xp < 260 THEN 6
    WHEN xp < 300 THEN 7
    WHEN xp < 340 THEN 8
    WHEN xp < 380 THEN 9
    WHEN xp < 420 THEN 10
    WHEN xp < 450 THEN 11
    WHEN xp < 480 THEN 12
    WHEN xp < 540 THEN 13
    WHEN xp < 630 THEN 14
    WHEN xp < 780 THEN 15
    ELSE 16
  END;

-- ============================================
-- 6. active_title 미설정 유저 → 첫 칭호로 설정
-- ============================================
UPDATE users SET active_title = sub.first_title
FROM (
  SELECT DISTINCT ON (user_id) user_id, title AS first_title
  FROM user_titles
  ORDER BY user_id, granted_at ASC
) sub
WHERE users.id = sub.user_id
  AND (users.active_title IS NULL OR users.active_title = '');
