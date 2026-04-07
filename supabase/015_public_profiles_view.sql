-- ============================================
-- 015: 공개 프로필 뷰 — 비로그인에서도 닉네임/칭호 조회 가능
-- ============================================
-- gender, xp, user_types 등 비공개 컬럼 제외

CREATE OR REPLACE VIEW public_profiles AS
SELECT id, nickname, active_title, primary_type, profile_color, profile_emoji
FROM users;

-- 비로그인(anon) 포함 모든 역할에서 조회 허용
GRANT SELECT ON public_profiles TO anon, authenticated;
