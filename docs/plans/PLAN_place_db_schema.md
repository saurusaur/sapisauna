# Place DB 스키마 변경 명세

> 이 문서만으로 DB 반영 가능하도록 작성됨

## places 테이블

`name`, `address` 컬럼 제거. 이름/주소는 `place_sources`에서 소스별로 관리.

```sql
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,          -- ISO 2자리 ("KR", "JP", "US")
  latitude DOUBLE PRECISION,           -- WGS84
  longitude DOUBLE PRECISION,          -- WGS84
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

- `name` 없음 — 소스별 다국어 이름은 `place_sources.name_original`에서 조회
- `address` 없음 — 소스별 주소는 `place_sources.address_original`에서 조회

## place_sources 테이블

한 장소에 여러 소스(naver, google, manual) 연결. 이름/주소/링크는 여기서 관리.

```sql
CREATE TABLE place_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  source TEXT NOT NULL,                -- 'naver' | 'google' | 'manual'
  external_id TEXT,                    -- Naver: "{mapx}_{mapy}", Google: place_id
  name_original TEXT NOT NULL,         -- 해당 소스 언어의 장소명
  address_original TEXT,               -- 해당 소스 언어의 주소
  link TEXT,                           -- Naver: 네이버지도 링크, Google: "https://plus.codes/{plus_code}"
  plus_code TEXT,                      -- Google만: "8Q98HX6P+QJ" (원본 보관)
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source, external_id)
);
```

## 필드 설명

| 테이블 | 컬럼 | 설명 |
|--------|------|------|
| places | id | UUID 자동생성 PK |
| places | country_code | 국가코드. Naver="KR" 고정, Google=주소에서 추출 |
| places | latitude/longitude | WGS84 좌표. Naver는 KATEC÷10000000 변환값 |
| place_sources | source | API 출처 구분 |
| place_sources | external_id | 동일 소스 내 중복 방지용 유일키 |
| place_sources | name_original | 해당 API 언어 그대로의 장소명 |
| place_sources | address_original | 해당 API 언어 그대로의 주소 |
| place_sources | link | 지도앱 직접 연결 링크 (네이버지도 URL 또는 plus.codes URL) |
| place_sources | plus_code | Google API의 plus_code 원본값 (구글 소스만 해당) |

## 표시 로직 (프론트엔드 참고)

```
브라우저 언어가 ko → naver 소스의 name_original 우선 → 없으면 google fallback
브라우저 언어가 ko 외 → google 소스의 name_original 우선 → 없으면 naver fallback
지도 링크도 동일 우선순위로 link 필드 사용
```

## Dedup 로직 (장소 등록 시)

```
1단계: place_sources에서 source + external_id 일치 → 기존 place 반환
2단계: places에서 좌표 50m 이내 → 기존 place에 새 source 추가
3단계: 매칭 없음 → 신규 place + source 생성
```
