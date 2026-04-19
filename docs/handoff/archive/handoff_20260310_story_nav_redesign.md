# 핸드오프: 스토리 카드 리디자인 + 네비 바 + UI 오버홀

> 작성: 2026-03-10
> 브랜치: main (클린, 모두 push 완료)

## 오늘 완료한 작업

### 1. 스토리 카드 리디자인 (`3758b27`)
- 카드 1080×1920px 고정 크기 + `transform: scale()` 프리뷰 (WYSIWYG)
- 내부 요소 전부 고정 px (장소명 56, 날짜 48, 라벨 48, 메인숫자 380, 루틴 96 등)
- 왼쪽 정렬, 트라이브 컬러 틴트 그라데이션 오버레이 (사진 배경 시)
- 루틴 뱃지: 라벨 4개 항상 표시, 숫자 입력값만 / 미입력 시 '-'
- 사진 배경 시 루틴 영역 디퓨즈 글로우 가독성 보강
- SVG 그래프 3종 왼쪽 정렬 (`xMinYMid`), 크기 확대 (140%, 640px)
- image-export: pixelRatio 1:1 (카드가 이미 원본 크기)
- 워터마크 'JOIN THE SA-PIENS', bather 'BATH TEMP', jimi 'JJIMJIL TEMP'

### 2. Auth 에러 로깅 (`62872ea`)
- callback/route.ts에 `console.error` 추가 — code 교환 실패 시 원인 추적 가능
- 유저 기능 변동 없음, 서버 로그 전용

### 3. 홈·탐색·UI 디자인 오버홀 (`6a4f3e7`)
- 15개 파일 스타일 수정 (홈, 탐색, 히스토리, 컴포넌트 등)
- '전체보기' → '기록 전체보기' 문구 수정

### 4. 네비 바 리디자인 (`ff10180`)
- 기록하기 텍스트 제거 → + 아이콘 원형 버튼 (미니멀)
- 돌출 -top-4 (16px), 브랜드 컬러 tint 그림자
- 네비 그림자 이중 레이어 (부유감 강화)

## 커밋 히스토리

```
ff10180 style: 네비 바 리디자인 — + 아이콘 버튼 + 깊은 그림자 + 구조 정리
6a4f3e7 style: 홈·탐색·UI 컴포넌트 디자인 오버홀 + '기록 전체보기' 문구 수정
62872ea fix: auth callback 에러 로깅 추가 — code 교환 실패 시 원인 추적 가능
3758b27 style: 스토리 카드 리디자인 — 1080×1920 고정 + scale 프리뷰 + 러버블 스타일 매칭
```

## 내일 이어서 할 작업

### 디자인 오버홀 남은 항목
- Phase 5 (탐색 페이지 세부 디자인)
- Phase 6 (히스토리 세부)
- Phase 7 (장소 선택)
- Phase 8 (온보딩/로그인)
- Phase 10 (설정)
- Phase 11 (최종 검증)

### 미해결 버그 (이전 핸드오프에서 이월)
- 통화 드롭다운 z-index: `src/app/log/deep/page.tsx` 비용 섹션
- 칩 셀렉터 너비 불일치: 퀵로그 vs 딥로그
- 달력 날짜 1일 밀림 (TIMESTAMPTZ UTC 변환 이슈)

### 로그인 관련
- 간헐적 PKCE 쿠키 타이밍 이슈 — 에러 로깅 추가 완료, 재발 시 서버 로그로 원인 특정 가능
- Supabase 대시보드 Redirect URL 확인 (수동)

## 참고 문서
- `docs/plans/PLAN_design_overhaul_implementation.md` — 전체 Phase 로드맵
- `docs/plans/LOVABLE_Screenshots/` — 러버블 레퍼런스
- `docs/handoff/handoff_20260309_design_overhaul.md` — 이전 세션 핸드오프
