-- 리스트 구독 토글 + subscriber_count 동기화
-- 클라이언트는 타인 리스트의 subscriber_count를 직접 업데이트할 수 없으므로
-- RLS를 우회하는 최소 범위 RPC에서 구독 row와 카운터를 함께 갱신한다.
CREATE OR REPLACE FUNCTION toggle_list_subscription(target_list_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  viewer_id UUID := auth.uid();
  existing_id UUID;
  target_owner_id UUID;
  target_visibility TEXT;
  is_now_subscribed BOOLEAN;
BEGIN
  IF viewer_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT owner_id, visibility
  INTO target_owner_id, target_visibility
  FROM lists
  WHERE id = target_list_id;

  IF target_owner_id IS NULL THEN
    RAISE EXCEPTION 'list_not_found';
  END IF;

  IF target_visibility NOT IN ('public', 'unlisted') AND target_owner_id != viewer_id THEN
    RAISE EXCEPTION 'list_not_accessible';
  END IF;

  IF target_owner_id = viewer_id THEN
    RAISE EXCEPTION 'cannot_subscribe_own_list';
  END IF;

  SELECT id
  INTO existing_id
  FROM list_subscriptions
  WHERE user_id = viewer_id
    AND list_id = target_list_id;

  IF existing_id IS NULL THEN
    INSERT INTO list_subscriptions (user_id, list_id)
    VALUES (viewer_id, target_list_id);
    is_now_subscribed := TRUE;
  ELSE
    DELETE FROM list_subscriptions
    WHERE id = existing_id;
    is_now_subscribed := FALSE;
  END IF;

  UPDATE lists
  SET subscriber_count = (
    SELECT COUNT(*)
    FROM list_subscriptions
    WHERE list_id = target_list_id
  )
  WHERE id = target_list_id;

  RETURN is_now_subscribed;
END;
$$;

GRANT EXECUTE ON FUNCTION toggle_list_subscription(UUID) TO authenticated;
