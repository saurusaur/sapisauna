-- 인기 태그 RPC: 공개 리스트에서 가장 많이 사용된 태그 상위 N개
CREATE OR REPLACE FUNCTION get_popular_tags(limit_count INT DEFAULT 10)
RETURNS TABLE(tag TEXT, count BIGINT) AS $$
  SELECT unnest(tags) as tag, COUNT(*) as count
  FROM lists
  WHERE visibility = 'public' AND array_length(tags, 1) > 0
  GROUP BY tag ORDER BY count DESC LIMIT limit_count;
$$ LANGUAGE sql SECURITY DEFINER;
