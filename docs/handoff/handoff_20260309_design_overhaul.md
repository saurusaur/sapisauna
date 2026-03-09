# 핸드오프: 디자인 오버홀 Phase 3-4 진행 중

> 작성: 2026-03-09
> 브랜치: main (미커밋 변경 있음)

## 현재 작업 상태

### 커밋 완료
- **Phase 0-1**: 토큰/공통 컴포넌트 (`d026aaa`)
- **Phase 2**: 홈 화면 (`66b5bb8`)
- **기록 흐름 리디자인**: 분기 모달 + DB 저장 + 레거시 제거 (`4b012f7`, `ce9a01e`)

### 코드 수정 완료, 미커밋
- **Phase 9 (스토리)**: Lovable rev 기준 전면 리디자인
- **Phase 3 (퀵로그)**: 스타일 오버홀 완료
- **Phase 4 (딥로그)**: 스타일 오버홀 완료

### 미착수
- Phase 5 (탐색), 6 (히스토리), 7 (장소 선택), 8 (온보딩/로그인), 10 (설정), 11 (최종 검증)

---

## 변경 파일 목록 (미커밋)

| 파일 | 변경 내용 |
|------|-----------|
| `src/app/story/page.tsx` | 풀폭 카드, 루틴 뱃지, 3버튼(저장/공유/사진 토글), 텍스트 네비 |
| `src/app/log/page.tsx` | 헤더(장소명+"기록 취소"), 커스텀 날짜/시간 피커, 영어 타입 선택, chip variant, 플로팅 버튼 |
| `src/app/log/deep/page.tsx` | 플랫 레이아웃, 글래스 인풋, 이용/이용함 토글, chip variant, 커스텀 통화 드롭다운 |
| `src/components/slider.tsx` | `variant="chip"` 추가 (label 빈 문자열 지원), 온도 숫자 `text-2xl`, 컬러 primary |
| `src/components/ui/select-button.tsx` | 비선택 칩: `glass-chip` → `white/65 + 0.5px border + shadow` 유리 스타일 |
| `src/app/globals.css` | `glass-input` 스타일을 칩과 통일 (`white/65 + 0.5px border + shadow`) |
| `docs/plans/*.md` | 3개 플랜 문서 진행 상태 업데이트 |

---

## 미해결 버그 (다음 세션에서 바로 처리)

### 1. 통화 드롭다운 z-index 문제
- **파일**: `src/app/log/deep/page.tsx` 비용 섹션 (~line 260-330)
- **증상**: 통화 검색 드롭다운(`z-30`)이 세신/매점 `glass-card-light` 뒤에 가려짐
- **원인**: `backdrop-filter`가 새 스태킹 컨텍스트를 생성함
- **해결**: 비용 섹션의 `<div>`에 `relative z-40` 추가하거나, 드롭다운 z-index를 50으로 올리기

### 2. 칩 셀렉터 너비 불일치
- **증상**: 퀵로그 "또갈래요" 칩은 넓게 배치되는데, 딥로그 세신/매점 칩은 좁아 보임
- **원인**: 딥로그 칩이 `glass-card-light` 안(`px-4`)에 있어서 컨테이너가 좁음 + `pl-1` 추가 들여쓰기
- **해결 방향**: 모든 `variant="chip"`의 칩 너비/간격을 "또갈래요"와 동일하게 통일. `slider.tsx`의 chip variant에서 `gap`과 칩 크기 확인. 딥로그 컨테이너 패딩 조정 가능

---

## 이번 세션 디자인 결정 사항

| 항목 | 결정 |
|------|------|
| 퀵로그 헤더 | 장소명 `text-xl` + "기록 취소" primary, 화살표 없음, `items-baseline` |
| 딥로그 헤더 | 퀵로그와 통일 — 장소명 + "딥로그 취소" |
| 날짜/시간 피커 | 커스텀 인라인 드롭다운 (달력 그리드 + 시간 칩), 달력 월요일 시작, 연필 아이콘 |
| 타입 선택 | 영어 (`TRIBE_PERSONA_MAP`), 작은 인라인 드롭다운, 빨간 쉐브론, 이모지 `text-base` |
| 토토노이/또갈래요/물좋아/쉼좋아/만족도 | `Slider variant="chip"` |
| 세신/매점 토글 | "이용"/"이용 함" pill, 활성시 라벨 "세신 만족도"/"매점 만족도"로 변경 |
| 딥로그 레이아웃 | 플랫 + 구분선, 세신/매점만 `glass-card-light`로 묶기 |
| 하단 버튼 | 띠 없이 플로팅 + primary + 깊은 빨간 그림자 (`boxShadow` 인라인) |
| 비용 통화 선택 | 커스텀 드롭다운 + 검색 입력 (타이핑 필터), 빨간 쉐브론 |
| `glass-input` | 칩과 동일 유리 스타일로 CSS 통일 |
| 스토리 사진 버튼 | 토글: 빨간 배경(추가) ↔ 흰 배경+빨간 보더(삭제) |

---

## 핵심 CSS 클래스

```
glass-card:       blur(12px), white/35, 0.5px border, multi-layer shadow
glass-card-light: blur(12px), white/35, 0.5px border, light shadow
glass-input:      blur(8px), white/65, 0.5px white/80 border, light shadow ← 칩과 통일됨
glass-chip:       white/30, 1px border (SelectButton에서는 미사용 — 자체 인라인)
```

## 참고 문서
- `docs/plans/PLAN_design_overhaul_implementation.md` — 전체 Phase 로드맵
- `docs/plans/DESIGN_SYSTEM_lovable_analysis.md` — Lovable 분석 + 적용 상태
- `docs/plans/TODO_record_flow_redesign.md` — 기록 흐름 리디자인 상태
- Lovable 스크린샷: `docs/plans/LOVABLE_Screenshots/`
