# BACKLOG vs Codebase Audit — 2026-03-03

> 연구 전용. 파일 수정 없음.

## 1. [인프라] 장소 데이터 실제 DB 연동 (In Progress)

**Status: DONE**

증거:
- `places-service.ts`: 전체가 Supabase 기반 (`supabase.from('places')`)
- `addPlace()`: Supabase INSERT + dedup 로직 완비
- `getPlaces()`, `getPlaceById()`, `searchPlaces()`, `findNearbyPlaces()`: 모두 Supabase 쿼리
- `place/add/page.tsx` L109: `addPlace()` 직접 호출 (Supabase 경유)
- `place/page.tsx` L43: `usePlaces()` 훅으로 DB 데이터 로드
- 더미/로컬 장소 데이터 없음 (localStorage `places` 키는 "최근 등록 장소" 히스토리 용도로만 사용)

-> Done 처리 가능. In Progress에서 제거 권장.

---

## 2. [인프라] UI<->DB 동기화 수정 (P0)

**Status: PARTIALLY DONE**

| 항목 | 상태 | 근거 |
|------|------|------|
| 매점 컬럼 | DONE | `deep_logs` 테이블: `has_store`, `store_score`, `store_memo` 존재 (001_schema.sql L177-179). `insertDeepLog()`에서 INSERT (logs-service.ts L163-165) |
| purpose 배열 | DONE | `deep_logs.purposes TEXT[] DEFAULT '{}'` (001_schema.sql L162). `insertDeepLog()`에서 `purposes: deepData.purposes ?? []` |
| INSERT 로직 | DONE | `insertLog()` + `insertDeepLog()` 구현 완료 (logs-service.ts L112-170) |
| place_id 연결 | DONE | `logs.place_id UUID REFERENCES places(id)` (001_schema.sql L107). `insertLog()`에서 `place_id: logData.place_id` |
| display_id | MISSING IN SCHEMA | 코드에서 `display_id` 사용 (logs-service.ts L121, log/page.tsx L106) 하지만 001_schema.sql의 logs 테이블에 `display_id` 컬럼 없음. 런타임 에러 가능성. |
| UPDATE 로직 | NOT STARTED | `logs-service.ts`에 update 함수 없음. 편집 모드는 localStorage 경유로 우회 중 |

-> BACKLOG 설명은 대부분 완료됨. 그러나 `display_id` 스키마 누락과 UPDATE 로직 미구현이 남아있으므로 설명 업데이트 필요.

---

## 3. [UX] 병합 확인 모달 (P0)

**Status: NOT STARTED**

증거:
- `place/add/page.tsx`: 검색 -> 선택 -> 저장 플로우만 존재. "이 장소인가요?" 확인 UI 없음.
- `addPlace()`는 서버 측에서 자동 병합 수행 (places-service.ts L158-185), 유저 확인 없이 `nearbyList[0]`에 자동 병합.
- `src` 디렉토리에서 merge/dedup 관련 UI 컴포넌트 없음 (검색 결과는 서비스 로직에만 존재).

---

## 4. [인프라] places-service 함수 업데이트 (P0)

**Status: DONE**

| 항목 | 상태 | 근거 |
|------|------|------|
| addPlace에서 link 제거 | DONE | `addPlace()` 파라미터에 `link` 없음 (places-service.ts L121-138) |
| coordinate_source 추가 | DONE | `addPlace()` L198: `coordinate_source: source` |
| place_sources에 lat/lng 저장 | DONE | L169, L214: `latitude: latitude \|\| null, longitude: longitude \|\| null` |
| findNearbyPlace->findNearbyPlaces | DONE | L94: `export async function findNearbyPlaces(...)` — 복수형, LIMIT 10 (SQL RPC L233) |

-> Done 처리 가능.

---

## 5. [인프라] 타입 정의 DB 동기화 (P0)

**Status: DONE**

| 항목 | 상태 | 근거 |
|------|------|------|
| PlaceSource: link 제거 | DONE | `PlaceSource` 타입에 `link` 필드 없음 (types/index.ts L39-50) |
| PlaceSource: lat/lng 추가 | DONE | `latitude: number \| null`, `longitude: number \| null` (types/index.ts L46-47) |
| Place: coordinate_source 추가 | DONE | `coordinate_source?: 'naver' \| 'google' \| 'manual' \| null` (types/index.ts L25) |
| Place: status 추가 | DONE | `status: string` (types/index.ts L26) |
| Place: merged 추가 | DONE | `merged: boolean` (types/index.ts L27) |

-> Done 처리 가능.

---

## 6. [UX] 지도 랜딩 URL 변경 (P0)

**Status: DONE**

증거 (`explore/[id]/page.tsx` L113-127):
- Naver: `external_id` 있으면 `map.naver.com/v5/entry/place/` 사용, fallback은 주소+이름 검색 URL
- Google: `external_id` 있으면 `google.com/maps/place/?q=place_id:` 사용, fallback은 좌표 기반
- BACKLOG 설명과 정확히 일치

-> Done 처리 가능. 단, Naver `external_id`는 `mapx_mapy` 형식이므로 `entry/place/` URL이 정상 동작하는지 실제 테스트 필요 (Naver place ID가 아닌 좌표 조합이 external_id로 저장됨 — `api/places/search/route.ts` L169).

**주의**: Naver external_id는 `"${item.mapx}_${item.mapy}"` 형식 (좌표 기반)이지 Naver 고유 place_id가 아님. `map.naver.com/v5/entry/place/` URL은 Naver 고유 ID가 필요하므로 이 URL은 작동하지 않을 가능성 높음. 이 버그를 BACKLOG에 추가할지 검토 필요.

---

## 7. [인프라] 로그 수정 시 updated_at 기록 (P0)

**Status: NOT STARTED**

증거:
- `logs` 테이블에 `updated_at TIMESTAMPTZ DEFAULT NOW()` 컬럼 존재 (001_schema.sql L136)
- 그러나 `logs-service.ts`에 UPDATE 함수 자체가 없음 — INSERT만 존재
- 편집은 localStorage를 통한 전체 재생성 방식으로 우회 중
- `updated_at` 갱신 로직도 당연히 없음

-> 스키마는 준비됨. 서비스 코드의 update 함수 구현이 필요.

---

## 8. [버그] 로그인 후 장소 카드 지도 링크 (P1)

**Status: NEEDS UPDATE**

현재 상태:
- `explore/[id]/page.tsx`에서 지도 URL 로직이 완전 재구현됨 (L113-127)
- Naver/Google 각각 external_id 기반 + fallback 패턴 완비
- `place-card.tsx`에는 지도 링크가 없음 (카드는 onClick 전체 네비게이션)
- 지도 링크는 장소 상세 페이지에만 존재

-> 지도 URL 로직 자체는 구현됨 (#6 참조). 하지만 Naver external_id 형식 문제 (좌표값이 Naver place ID로 사용됨)로 실제 랜딩이 이상할 수 있음. 실기기 테스트 후 Close/Update 판단 필요.

---

## 9. [인프라] localStorage -> Supabase 마이그레이션 (P1)

**Status: NOT STARTED**

localStorage 사용 현황 (15개 파일):

| 용도 | 파일 | 마이그레이션 필요? |
|------|------|------|
| `selectedPlace` (임시 네비게이션 상태) | place/add, place, explore/[id], log, log/deep | NO (UX 플로우용 임시 데이터) |
| `currentLog` (기록 흐름 임시 데이터) | log, log/deep, story, story/edit, complete, history/[id] | NO (세션 내 임시) |
| `savedLogs` (기록 히스토리) | lib/storage.ts | YES -> 이미 logs 테이블로 대체됨. 이 파일 자체가 레거시 |
| `places` (최근 등록 장소) | place/page.tsx | PARTIAL -> DB에서 로드하지만 localStorage도 병행 |
| `user` (유저 프로필 캐시) | user-context.tsx, auth-context.tsx, onboarding | NO (Supabase 캐시 용도) |
| `lastBathGender` (마지막 탕 성별) | log/deep | LOW -> UX 편의 기능 |
| `favorites` (즐겨찾기) | explore/[id], utils.ts | YES -> Supabase로 이전 필요 |

핵심 미이전: `savedLogs` (레거시, 실제 사용 여부 확인 필요), `favorites` (즐겨찾기)

---

## 10. [UX] 비로그인 홈 (P1)

**Status: PARTIALLY DONE**

증거 (`home/page.tsx` L22-51):
- 비로그인 시 별도 UI 제공: "로그인하고 기록해보세요" 스타일의 CTA 2개 (탐색, 로그인)
- BACKLOG 요구: "로그인 후와 동일 구조에 빈 상태 + CTA"
- 현재 구현: 로그인 후와 다른 구조 (전용 CTA 화면). 동일 구조가 아님.

-> BACKLOG 요구사항("로그인 후와 동일 구조에 빈 상태") vs 현재 구현("별도 CTA 화면")이 다름. 의도적 변경인지 확인 필요. 기능 자체는 동작함.

---

## 11. [UX] 하단 네비게이션 바 (P1)

**Status: PARTIALLY DONE**

증거 (`bottom-nav.tsx`):
- 4탭 구성: Home, History, Explore, My
- "기록 버튼"은 이미 없음 (별도 floating 버튼 아님, Home에서 AddRecordCard로 대체)
- BACKLOG 요구: "정리 & 플리 기능 플레이스홀더 추가" -> 없음. 현재 4탭만 존재.

-> "기록 버튼 삭제"는 완료. "정리 & 플리 기능 플레이스홀더"는 미구현.

---

## 12. [기능] 홈 화면 달력 (P1)

**Status: NOT STARTED (홈에는 없음, History에 존재)**

증거:
- `home/page.tsx`: 달력 없음. 최근 기록 3개 리스트만 표시.
- `history/page.tsx`: 캘린더 뷰 완전 구현됨 (L240-376). 월 네비게이션, 날짜 선택, 타입별 dot 표시.
- BACKLOG 요구: "홈 화면 — 최근 기록을 달력 보기로 전환"

-> 달력 기능은 History 페이지에 이미 구현됨. 홈에 달력을 넣을지, 현재 구조를 유지할지 방향 결정 필요. BACKLOG 설명 업데이트 권장.

---

## 13. [인프라] Naver HTML entity bug

**Status: DONE (BACKLOG에 미등록)**

증거 (`api/places/search/route.ts` L112-124):
- `stripHtml()` 함수가 HTML 태그 제거 + HTML 엔티티 디코딩 모두 처리
- `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`, `&apos;` 전부 매핑
- L162: `name: stripHtml(item.title)` 적용

-> 이미 수정 완료. BACKLOG에 별도 트래킹 불필요.

---

## 요약표

| # | 항목 | 판정 | 비고 |
|---|------|------|------|
| 1 | 장소 DB 연동 | **DONE** | In Progress -> Done 이동 |
| 2 | UI<->DB 동기화 | **PARTIALLY DONE** | display_id 스키마 누락 + UPDATE 로직 미구현 |
| 3 | 병합 확인 모달 | **NOT STARTED** | 서버 자동병합만 존재, UX 없음 |
| 4 | places-service 업데이트 | **DONE** | 모든 항목 완료 |
| 5 | 타입 정의 동기화 | **DONE** | 모든 항목 완료 |
| 6 | 지도 랜딩 URL | **DONE (버그 주의)** | Naver external_id가 좌표 조합이라 entry/place URL 미작동 우려 |
| 7 | updated_at 기록 | **NOT STARTED** | 스키마 준비됨, update 함수 없음 |
| 8 | 지도 링크 버그 | **NEEDS UPDATE** | #6과 연관, 실기기 테스트 필요 |
| 9 | localStorage 마이그레이션 | **NOT STARTED** | favorites, savedLogs(레거시) 이전 필요 |
| 10 | 비로그인 홈 | **PARTIALLY DONE** | 기능 동작하나 BACKLOG 요구와 구현 차이 |
| 11 | 하단 네비게이션 | **PARTIALLY DONE** | 기록 버튼 제거 완료, 정리/플리 미구현 |
| 12 | 홈 달력 | **NOT STARTED** | History에 달력 있음, 홈에는 없음 |
| 13 | Naver entity bug | **DONE** | BACKLOG 트래킹 불필요 |

## 신규 발견 이슈

1. **display_id 스키마 누락**: 코드에서 `display_id`를 INSERT하지만 DB 스키마에 컬럼 없음 -> P0 버그
2. **Naver external_id 형식 버그**: `mapx_mapy` 좌표 조합이 Naver place ID로 사용됨 -> 지도 URL 미작동 가능성
3. **storage.ts 레거시**: `lib/storage.ts`가 아직 존재하지만 DB 로그 서비스로 대체됨. 정리 대상.
