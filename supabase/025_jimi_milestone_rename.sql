-- 025: jimi 트라이브 첫 로그 마일스톤 칭호명 변경 — 구운달걀 → 맥반석란
-- 사우나펫 v2.5.1 도입에 따라 펫 종 이름과 통일.
-- 참고: docs/plans/PLAN_sauna_pet_v2.md (D7)

-- 1) user_titles: 마일스톤 칭호는 title과 base_title이 동일
UPDATE user_titles
SET title = '맥반석란',
    base_title = '맥반석란'
WHERE base_title = '구운달걀';

-- 2) users.active_title: 현재 활성 칭호로 사용 중인 유저 동기화
UPDATE users
SET active_title = '맥반석란'
WHERE active_title = '구운달걀';
