/**
 * 014 — 유저 프로필 아이콘 커스터마이징
 * 2026-04-07
 *
 * profile_color: hex (예: '#cc1a1a'). NULL이면 트라이브 컬러 사용
 * profile_emoji: 이모지 문자열. NULL이면 트라이브 이모지 사용
 */

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_color TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_emoji TEXT;
