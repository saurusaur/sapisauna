# 핸드오프: UX/UI 디자인 오버홀

> 날짜: 2026-03-09
> 브랜치: main

## 작업 목표
Lovable에서 생성한 디자인 시안을 기반으로 기존 앱의 스타일을 전면 교체. 로직 0% 변경.

## 완료된 Phase

### Phase 0: 디자인 토큰 교체 ✅
- `globals.css`: 컬러 (그린→레드, 오렌지→레드계열), 폰트 (Noto Sans KR), 글래스모픽 유틸리티
- `tailwind.config.ts`: primary/accent/card/border/muted 컬러, glass shadow/radius
- `layout.tsx`: 폰트 로드 변경, 배경색 #f5f2ef
- 하위 호환: `--color-green` → `var(--color-primary)` 매핑으로 기존 참조 자동 전환

### Phase 1: 공통 컴포넌트 ✅
- BottomNav: 글래스 배경 (`backdrop-blur-xl`)
- Chip: `glass-chip` 스타일 (비활성 시 반투명)
- SelectButton: `glass-chip` 스타일
- ScoreBadge: 오렌지→레드, ★ 별 아이콘 추가
- PlaceStatsDisplay: 동일 변경
- TypeTab: 타입별 컬러 유지 + 연한 배경 (`color-mix 15%`)
- RecordCard: `glass-card`
- PlaceCard: `glass-card` + Badge24h 내장 + favorite 선택적 prop
- FilterControls: `glass-card`

### PlaceCard 통합 리팩토링 ✅
- `place/page.tsx`, `explore/type/[type]`의 인라인 카드 → PlaceCard로 통합
- Badge24h: PlaceCard 내부 정의, `badge-24h.tsx`는 re-export만
- PlaceCard에서 `onToggleFavorite` 선택적 → favorite 없는 곳도 사용 가능

## 남은 Phase

| Phase | 대상 | 핵심 |
|-------|------|------|
| **2** | 홈 (`/home`) | 세리프 헤딩, 달력 글래스, 레드 포인트 |
| **3** | 퀵 로그 (`/log`) | **슬라이더→넘버칩**, 레드 CTA |
| **4** | 딥 로그 (`/log/deep`) | 칩/토글 스타일, 글래스 인풋 |
| **5** | 탐색 (`/explore/*`) | "EXPLORE" 세리프, 글래스 카드 |
| **6** | 히스토리 (`/history/*`) | 글래스 카드, 레드 점수 |
| **7** | 장소 선택 (`/place/*`) | 글래스 검색바, 레드 배지 |
| **8** | 온보딩/로그인 | **타입카드 가로 전환**, 레드 CTA |
| **9** | 스토리/완료 | 레드 버튼, 글래스 효과 |
| **10** | 설정 | "SETTINGS" 세리프, 글래스 카드 |
| **11** | 최종 검증 | 전체 플로우 + 빌드 + 정리 |

## 핵심 결정 사항

| 결정 | 내용 |
|------|------|
| Primary | 그린 → 레드 `#cc1a1a` |
| Accent | 오렌지 → 레드 `#d44040` |
| 타입 컬러 | 파/주/초 **유지**, 활성 시 연한 배경 (15% mix) |
| 토토노이/또갈래요 | 슬라이더 → 원형 넘버 칩 (Phase 3에서) |
| 온보딩 타입 카드 | 세로 → 가로 (Phase 8에서) |
| 폰트 | DM Sans + Noto Sans KR, weight 500 |
| 페이지 헤딩 | 영문 이탤릭 세리프 (EXPLORE, SETTINGS 등) |
| 장소 상세/로그 프리뷰 | 레이아웃 유지, 컬러만 적용 |
| 🔍 페이지별 확인 | 시설 칩 색상, 달력 dots 타입 컬러 — 각 Phase에서 확인 |

## 참고 파일
- 플랜: `docs/plans/PLAN_design_overhaul_implementation.md`
- 분석: `docs/plans/DESIGN_SYSTEM_lovable_analysis.md`
- 스크린샷: `docs/plans/LOVABLE_Screenshots/`
- CSS 토큰: `docs/plans/LOVABLE_design_info.md`
