# 시드 데이터 등록 + 시설 기여 보상

> 새 세션 컨텍스트용: 사우나 기록 PWA (Next.js 14 + Supabase + Tailwind)
> 장소 DB가 비어있어 초기 시드 데이터를 벌크 등록하고, 유저가 시설 정보를 채우면 보상하는 시스템

## 현재 진행 상태

- [x] seed-data.json 작성 완료 — 72곳 (국내 28 / 일본 34 / 글로벌 10)
- [ ] 카톡 내보내기 추가 데이터 (스텔라 준비 중 — `scripts/katalk-mondaysauna.txt`)
- [ ] Step 1: 벌크 시드 스크립트 구현
- [ ] Step 3-5: 시설 기여 보상 시스템 구현

## 핵심 파일 참조 (새 세션에서 읽어야 할 파일)

| 파일 | 용도 |
|------|------|
| `scripts/seed-data.json` | 시드 장소 72곳 (name, source_hint, theme_keyword) |
| `src/lib/places-service.ts` | createNewPlace (L168-221), updatePlace (L223-240), getPlaceById |
| `src/app/api/places/search/route.ts` | Naver/Google 검색 API (GET /api/places/search?q=&source=) |
| `src/constants/rewards.ts` | XP_VALUES, ACTIVITY_MILESTONES |
| `src/lib/reward-service.ts` | grantReward() 함수 |
| `src/lib/reward-engine.ts` | 레벨/칭호 계산 로직 |
| `supabase/001_schema.sql` | places, place_sources 테이블 스키마 |
| `src/app/explore/[id]/page.tsx` | 장소 상세 페이지 (CTA 추가 대상) |
| `src/app/place/[id]/edit/page.tsx` | 장소 편집 페이지 (기존, 재활용) |

## Step 1: 벌크 시드 스크립트 (`scripts/seed-places.ts`)

- 입력: `scripts/seed-data.json` — `[{ name, source_hint, theme_keyword }]`
- 동작: 각 장소를 `/api/places/search` 로 검색 → 좌표+external_id 확보 → DB INSERT
- **facility_type 자동 추정**: 장소명 키워드 매칭 (남성전용→male-only, 여성전용→female-only, 프라이빗/개인/독채→private-bath, 혼욕→mixed-bath, 기본→gender-bath)
- facilities 빈 배열, created_by NULL (시스템 등록)
- 중복 방지: `place_sources.external_id` UNIQUE 제약 활용 → 스킵
- `--dry-run` 플래그: INSERT 없이 검색 결과 + 추정 타입만 출력
- 실행: `npx tsx scripts/seed-places.ts`

## Step 2: 카톡 데이터 분석 (선택, 스텔라 준비 후)

- 입력: `scripts/katalk-mondaysauna.txt` (카톡 대화 내보내기 .txt)
- 분석: 장소명 추출 → 빈도 분석 → 감성 분석 → 기존 seed-data.json 중복 체크
- 결과: 신규 장소 후보를 seed-data.json에 추가

## Step 3: 시설 기여 보상 — XP 추가

- `src/constants/rewards.ts`: `place_updated: 30` 추가
- `src/lib/reward-service.ts`: `grantReward('place_updated')` 케이스 추가
- 마일스톤: `ACTIVITY_MILESTONES`에 `first_facility_update` → '시설 감별사' 칭호

## Step 4: updatePlace에 기여 감지 로직

- `src/lib/places-service.ts` `updatePlace()`:
  - 수정 전 `getPlaceById()`로 조회
  - `oldFacilities.length === 0 && newFacilities.length > 0` → `grantReward('place_updated')`
  - 이미 facilities 있는 장소 수정은 보상 없음 (남용 방지)

## Step 5: 장소 상세 UI에 "시설 정보 채우기" 유도

- `src/app/explore/[id]/page.tsx`: facilities 비어있으면 "시설 정보를 추가해주세요! (+30 XP)" CTA
- 클릭 → `/place/[id]/edit` (기존 편집 페이지 재활용)

## 변경 파일 목록

1. `scripts/seed-places.ts` (신규) — 벌크 등록 스크립트
2. `scripts/seed-data.json` (완료) — 시드 장소 72곳
3. `src/constants/rewards.ts` — `place_updated: 30` 추가
4. `src/lib/reward-service.ts` — place_updated 케이스 추가
5. `src/lib/places-service.ts` — updatePlace에 기여 감지 + 보상
6. `src/app/explore/[id]/page.tsx` — 빈 시설 CTA 추가

## Verification

```
npx tsx scripts/seed-places.ts --dry-run  # 시드 스크립트 검증
npm run build                              # 전체 빌드
```
