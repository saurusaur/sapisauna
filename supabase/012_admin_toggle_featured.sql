-- 어드민 전용: 리스트 추천(is_featured) 토글
-- RLS를 우회하되 is_featured만 변경 가능 (최소 권한)
CREATE OR REPLACE FUNCTION toggle_featured(target_list_id UUID)
RETURNS VOID AS $$
BEGIN
  IF auth.uid() != '23c431c3-9b23-4779-bb27-13472e58090a' THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  UPDATE lists
  SET is_featured = NOT is_featured, updated_at = NOW()
  WHERE id = target_list_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
