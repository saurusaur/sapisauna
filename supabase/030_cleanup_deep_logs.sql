-- =====================================================================
-- 030_cleanup_deep_logs.sql  (CONTRACT — 파괴적, 새 코드 배포·검증 후에만!)
-- 029(expand)로 새 컬럼/log_blocks 도입 + 새 코드 컷오버 완료 후, 잔재 정리.
-- ⚠️ 실행 전제: 배포된 코드가 sauna_temp/jjim_temp/pause_time/deep_logs를
--    더 이상 참조하지 않음(= docs §6·§11 동반수정 완료). 미완 시 앱 깨짐.
-- ⚠️ 백업 필수. 되돌리기 어려움(DROP).
-- =====================================================================

begin;

-- 1) 통일 전 옛 컬럼 제거 (값은 029에서 dry_sauna_temp/bulgama_temp/rest_time로 복사됨)
alter table logs
  drop column if exists sauna_temp,
  drop column if exists jjim_temp,
  drop column if exists pause_time;

-- 2) deep_logs 제거 (필드는 029에서 logs로 흡수, 온도는 logs/log_blocks로 이전)
--    has_*, food_eaten 도 이 테이블과 함께 사라짐(파생/폐기 결정 반영)
drop table if exists deep_logs;

commit;

-- 검증: select sauna_temp from logs limit 1;  → 에러(컬럼 없음)면 정상 제거.
--       select * from deep_logs limit 1;       → 에러(테이블 없음)면 정상.
