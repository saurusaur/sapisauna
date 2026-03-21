# 시드 데이터 벌크 등록 + 큐레이션 매핑 플랜

## 목표
1. seed-data-unified.json 230건 → DB 등록
2. 등록 시 생성되는 place UUID를 시드 JSON에 매핑
3. 매핑된 UUID로 큐레이션 리스트 생성 준비

## Phase 1: DB 스키마 (큐레이션 테이블)

```sql
-- supabase/010_curated_lists.sql

-- 큐레이션 리스트 (사우나슐렝, 올해의 사우나 등)
CREATE TABLE IF NOT EXISTS curated_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,          -- URL용: 'saunachelin-2025'
  title TEXT NOT NULL,                -- '사우나슐렝 2025'
  description TEXT,
  cover_image TEXT,
  sort_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 큐레이션 ↔ 장소 매핑
CREATE TABLE IF NOT EXISTS curated_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES curated_lists(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  rank INT,                           -- 순위 (사우나슐렝 1위 등)
  note TEXT,                          -- 아이템별 메모 ("2025 1위", "명예의 전당")
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, place_id)
);

ALTER TABLE curated_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE curated_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published lists" ON curated_lists
  FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can view list items" ON curated_list_items
  FOR SELECT USING (true);
```

## Phase 2: 벌크 등록 스크립트

파일: `scripts/seed-places.ts`

### 흐름
```
1. seed-data-unified.json 읽기
2. 각 시설마다:
   a. 이름+주소로 Naver/Google API 검색 → 좌표 + external_id
   b. 검색 결과 1건 → 자동 매칭
   c. 검색 결과 다건 → 주소/이름 유사도로 자동 선택, 불확실하면 manual-review 큐
   d. 검색 결과 0건 → source='manual', 좌표 없이 등록
   e. places INSERT → place UUID 획득
   f. place_sources INSERT
   g. 어드민 로그 INSERT (온도/가격 데이터 있는 경우)
   h. 결과 → seed-data-unified.json에 place_id 기록
3. 결과 저장:
   - seed-data-unified.json에 place_id 필드 추가
   - scripts/seed-registration-result.json 별도 저장 (이름↔UUID 매핑)
   - scripts/seed-manual-review.json (자동 매칭 실패 건)
```

### 어드민 로그 생성 (온도/가격 데이터)
```
어드민 user_id: 23c431c3-9b23-4779-bb27-13472e58090a

logs INSERT:
  - user_id: 어드민
  - place_id: 등록된 UUID
  - tribe_id: 'saunner' (사우나 온도 있으면) / 'bather' (온탕만) / 'jimi' (찜질 온도만)
  - hot_bath_temp, cold_bath_temp, sauna_temp
  - bath_gender: review_bath_gender 값
  - record_date: NOW()

deep_logs INSERT:
  - cost, very_hot_bath_temp, wet_sauna_temp
  - memo
  - has_scrub: 'scrub' in facilities
  - has_store: 'food' in facilities
```

### API 검색 전략
```
한국 (source=naver/katalk):
  → Naver Search API: "{시설명} 사우나" + 주소 교차 확인
  → 실패 시 Google Places: "{시설명}"

해외 (source=google):
  → Google Places API: "{시설명}" (language=en)
  → place_id로 좌표/주소 확보

주소 없는 4건 (도봉산, 석천, 소나무, 천호):
  → 이름만으로 검색, 결과 없으면 manual
```

## Phase 3: 큐레이션 리스트 생성

벌크 등록 후 place_id가 매핑되면, memo 기반으로 큐레이션 자동 생성:

### 자동 생성 후보 리스트
| slug | title | 기준 | 예상 건수 |
|------|-------|------|----------|
| saunachelin-2025 | 사우나슐렝 2025 | memo에 "사우나슐렝 2025" | ~11 |
| saunachelin-2024 | 사우나슐렝 2024 | memo에 "사우나슐렝 2024" | ~11 |
| saunachelin-2023 | 사우나슐렝 2023 | memo에 "사우나슐렝 2023" | ~11 |
| saunachelin-hall-of-fame | 사우나슐렝 명예의 전당 | memo에 "명예의 전당" | 8 |
| best-sauna-2024 | 올해의 사우나 2024 | memo에 "올해의 사우나" | ~5 |
| esquire-best | 에스콰이어 서울 BEST | memo에 "에스콰이어" | ~5 |
| monday-sauna-top | 먼데이사우나 5.0 | memo에 "먼데이사우나 5.0" | ~3 |
| bath-diary-best | bath.diary 추천 | memo에 "bath.diary" | 3 |
| tokyo-sauna | 도쿄 추천 사우나 | 도쿄 소재 시설 | ~10 |
| busan-oncheon | 부산 온천 투어 | 부산 소재 시설 | ~10 |

### 스크립트 흐름
```
1. seed-data-unified.json (place_id 매핑 완료 상태) 읽기
2. memo에서 테마 키워드 추출
3. curated_lists INSERT (각 테마)
4. curated_list_items INSERT (place_id + rank + note)
5. rank: 사우나슐렝은 순위 파싱 ("2025 1위" → rank=1)
```

## 출력 파일

| 파일 | 용도 |
|------|------|
| `scripts/seed-data-unified.json` | place_id 필드 추가됨 |
| `scripts/seed-registration-result.json` | 이름 ↔ UUID 매핑 (큐레이션용) |
| `scripts/seed-manual-review.json` | API 매칭 실패 건 (수동 확인) |
| `scripts/seed-curated-lists.json` | 생성된 큐레이션 리스트 |

## 작업 순서

1. ⬜ curated_lists 테이블 마이그레이션 실행
2. ⬜ seed-places.ts 벌크 등록 스크립트 작성
3. ⬜ 스크립트 실행 → place_id 매핑
4. ⬜ manual-review 건 수동 확인
5. ⬜ 큐레이션 리스트 자동 생성
6. ⬜ 어드민 로그 생성 (온도/가격)
