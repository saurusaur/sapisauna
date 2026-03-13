# 시드 데이터 등록 + 시설 기여 보상

## Step 1: 벌크 시드 스크립트 (`scripts/seed-places.ts`)
- 입력: `scripts/seed-data.json` — 큐레이션 장소 리스트 `[{ name, source_hint: 'naver'|'google' }]`
- 동작: 각 장소를 `/api/places/search` 로 검색 → 좌표+external_id 확보 → `places` + `place_sources` INSERT
- **facility_type 자동 추정**: 장소명 키워드 매칭 (남성전용→male-only, 여성전용→female-only, 프라이빗/개인/독채→private-bath, 혼욕→mixed-bath, 기본→gender-bath)
- facilities 빈 배열, created_by NULL (시스템 등록)
- 중복 방지: `place_sources.external_id` UNIQUE 제약 활용 → 이미 등록된 건 스킵
- `--dry-run` 플래그: INSERT 없이 검색 결과 + 추정 타입만 출력
- 실행: `npx tsx scripts/seed-places.ts` (로컬에서 수동 실행)

## Step 2: 시드 데이터 파일 (`scripts/seed-data.json`)
- 유저가 큐레이션 소스에서 장소명만 뽑아 추가하는 구조
- 형식: `[{ "name": "사우나슐렝 성수", "source_hint": "naver" }, ...]`
- 이름+검색엔진 힌트만 넣으면 좌표/주소/타입은 자동

## Step 3: 시설 기여 보상 — XP 추가
- `src/constants/rewards.ts`: `place_updated: 30` 추가
- `src/lib/reward-service.ts`: `grantReward('place_updated')` 케이스 추가
- 마일스톤: `ACTIVITY_MILESTONES`에 `first_facility_update` → '시설 감별사' 칭호 추가

## Step 4: updatePlace에 기여 감지 로직
- `src/lib/places-service.ts` `updatePlace()`:
  - 수정 전 현재 place를 `getPlaceById()`로 조회
  - `oldFacilities.length === 0 && newFacilities.length > 0` → `grantReward('place_updated')` 호출
  - 이미 facilities 있는 장소 수정은 보상 없음 (남용 방지)

## Step 5: 장소 상세 UI에 "시설 정보 채우기" 유도
- `src/app/explore/[id]/page.tsx`: facilities 비어있으면 "시설 정보를 추가해주세요! (+30 XP)" CTA 표시
- 클릭 → `/place/[id]/edit`로 이동 (기존 편집 페이지 재활용)

## 변경 파일 목록
1. `scripts/seed-places.ts` (신규) — 벌크 등록 스크립트 (이름→검색→타입 추정→INSERT)
2. `scripts/seed-data.json` (신규) — 시드 장소 리스트
3. `src/constants/rewards.ts` — `place_updated: 30` 추가
4. `src/lib/reward-service.ts` — place_updated 케이스 추가
5. `src/lib/places-service.ts` — updatePlace에 기여 감지 + 보상
6. `src/app/explore/[id]/page.tsx` — 빈 시설 CTA 추가

## Verification
```
npx tsx scripts/seed-places.ts --dry-run  # 시드 스크립트 검증
npm run build                              # 전체 빌드
```
