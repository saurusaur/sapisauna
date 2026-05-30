# Handoff 2026-04-20 (세션 마감)

## 오늘 완료 (주요 커밋)

| SHA | 내용 |
|-----|------|
| `08585ce` | build 스크립트 NODE_EXTRA_CA_CERTS 적용 (로컬 SSL) |
| `bb08f30` | 홈 SA-PI FEATURED 컴팩트 캐러셀 + 사-리스트 디스커버리 링크 |
| `38e34b9` | 사-리스트 리워드 — XP/마일스톤 |
| `a873343` | tsconfig target es2020 — Vercel 빌드 실패 해소 |
| `26065b2` | tattoo-cover PLACE_SPECS 정식 등록 |
| `7d2ea09` | Geocoding 마이그레이션 핸드오프 |
| `c046e9b` | 백로그 small wins 2건 |
| `fb36083` | Geocoding 마이그레이션 완료 (DB 교정) |
| `f65f770` | 어드민 featured 토글 RPC 경유 |
| `4feca33` | 사-리스트 UX 튜닝 3종 |
| `2b4a1fb` | TRIBE PICKS 탐색탭→사-리스트 홈 이동 + SA-PI FEATURED 네이밍 |

## 이어서 할 작업 (P1 신규)

### 1. 트라이브 선택 버튼 디자인 통일

**배경**: 같은 트라이브 개념을 3곳에서 다른 UI로 표현 중 — 온보딩, 비로그인 홈, 사-리스트 TRIBE PICKS.

**현재 상태**:
| | 배경 | 라벨 위치 | name(한글) | 상태 로직 |
|---|------|-----------|-----------|-----------|
| 사-리스트 TRIBE PICKS | **컬러 풀필 항상** | 박스 안 (persona) | 없음 | 네비만 |
| 비로그인 홈 TribePicksCard | 활성만 컬러, 비활성 글래스 | 박스 밖 (persona+name) | 있음 | autoscroll |
| 온보딩 page | 선택만 컬러, 미선택 글래스 | 박스 밖 (persona+name) | 있음 | 복수 선택 rank |

**확정된 설계 방향** (사용자 승인 완료):

- **공통 스타일**: 정사각 컬러 풀필 + 박스 안 배치
  - 박스 안: 이모지(28px) + persona(Oswald italic 12px 흰색) + **name(10px 흰색 opacity 0.85)**
  - text-shadow: `0 1px 2px rgba(0,0,0,0.18)` / drop-shadow 이모지
- **맥락별 상태 표시**:
  - 비로그인 홈: inactive = 기본 / active = `scale-105` + 밝기 up (autoscroll 유지, 설명 텍스트 전환)
  - 온보딩: 미선택 = `opacity-40` / 선택 = full opacity + rank 배지 + `scale-105`
  - 사-리스트: 상태 없음 (현행 유지)
- **사-리스트는 그대로** — 이미 확정됐고 맥락상 name 불필요

**수정 파일**:
- `src/components/features/tribe-picks-card.tsx` (비로그인 홈)
- `src/app/onboarding/page.tsx` (tribe 선택 섹션, L327~377)
- `src/app/sa-list/page.tsx` — **건드리지 않음**

**미결정**: persona + name을 박스 안에 넣을지 vs persona만 + name 제거. 사용자는 "공간 절약" 강조 → 박스 안 2줄 레이아웃이 가장 합리적 (이모지+persona+name 세로 스택).

### 2. 홈 SA-PI FEATURED 섹션 가로 alignment 어긋남

**정확한 원인 (확인 완료)**:
- 홈 `<main className="p-4 space-y-6">` → 좌우 padding **16px**
- 다른 홈 섹션 (ProfileCard, 커뮤니티 피드) → main padding 만 적용, **좌 16px**
- FeaturedSaListCarousel 내부 `px-5` (20px) → main padding(16px) **이중 적용**, 좌 **36px**
- 결과: 헤더 "SA-PI FEATURED" 라벨과 카드가 다른 섹션 대비 **20px 밀림**
- 사-리스트 페이지는 main padding 0이라 문제 없었음 — 홈 재사용 시 검증 누락

**수정안 (확정)**:
- `featured-sa-list-carousel.tsx`: compact 모드일 때 내부 `px-5` → `px-4` 로 변경
- `home/page.tsx`: 호출부 감싸는 `<div className="-mx-4">` 추가 → main p-4(16px) 상쇄
- 계산: `16(main) - 16(-mx-4) + 16(내부 px-4) = 16px` ✅ 다른 섹션과 동일
- non-compact(사-리스트) 경로는 그대로 px-5 유지

**대안**: 홈 main을 `p-4` → `p-5` 로 승격. 다른 섹션 전부 5px 이동하게 되어 전역 영향 크므로 **비추천**.

**수정 파일**:
- `src/components/features/featured-sa-list-carousel.tsx` — compact 분기 padding
- `src/app/home/page.tsx` — `<FeaturedSaListCarousel>` 호출부 wrapper

## 추가 메모

- `.next` 캐시 문제 시 `rm -rf .next tsconfig.tsbuildinfo` 후 `npx tsc --noEmit`
- Vercel 배포 상태 확인: `gh api repos/saurusaur/sapisauna/deployments/{id}/statuses`
- `NODE_EXTRA_CA_CERTS` 로컬 빌드 이슈는 `package.json:build` 스크립트에 적용됨
