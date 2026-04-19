# History Dashboard UI Agent Handoff

## 1. Goal
- `src/app/history/page.tsx`의 `calendar` 뷰를 실제 운영 데이터 기반의 대시보드 UI로 고도화한다.
- 디자인 베이스는 **현재 앱의 스타일**을 유지한다.
- 구조, 카드 구성, 표기 방식은 공유된 참고 스크린샷을 따른다.
- 가장 선호하는 기준 레이아웃은 `Bather` 화면이다.

## 2. Important Product Decisions

### 디자인 원칙
- 비주얼 스타일은 현재 앱의 `glass card`, 배경, radius, spacing, bottom nav, 폰트 톤을 최대한 유지한다.
- 구조와 섹션 배열은 참고 스크린샷을 따른다.
- `Bather` 화면을 마스터 템플릿으로 삼는다.
- `Saunner`, `Jimi`는 `Bather` 구조를 유지하되 중간 인사이트 카드만 변형한다.

### 데이터 원칙
- **mock data 사용 금지**
- 반드시 `useUserLogs()`의 실제 데이터로 렌더링한다.
- 유저가 여러 트라이브 기록을 갖고 있으면 모든 타입 탭을 볼 수 있다.
- 특정 타입 기록이 없더라도 탭은 유지 가능하나, 해당 탭 진입 시 empty state를 자연스럽게 보여준다.

### 캘린더 원칙
- 날짜 셀은 단순하게 유지한다.
- 방문 기록이 있는 날 = 점 1개
- 딥로그가 있는 날 = 점 바깥에 얇은 링 1개
- 같은 날 여러 곳 방문해도 월간 셀에서 추가 점/추가 셀/농도 변화는 주지 않는다.
- 복수 방문 정보는 하단 선택 날짜 리스트에서만 보여준다.

### 절대 건드리면 안 되는 것
- 기존 `HomeCalendar`의 **월 전환에 따른 하이라이트 날짜 보정/선택 동기화 로직**
- 기존 `week/month` 전환 로직
- `today` 이동 로직
- 월간/주간 뷰의 현재 선택 날짜 유지 흐름

즉, 캘린더는 **표현만 변경**하고, 기존 내비게이션/선택 로직은 유지해야 한다.

## 3. Scope

### 이번 작업에 포함
- `History`의 `calendar` 뷰를 대시보드형 레이아웃으로 변경
- 상단 탭/요약 카드/루틴 카드/트라이브 인사이트 카드/히트맵/최근 기록 섹션 구현
- 실데이터 기반 계산 로직 구현
- 기존 캘린더 셀 표시를 `점 + 딥로그 링` 규칙으로 정리
- 월별 헤더 `(총 N회)` 추가는 리스트 뷰에 포함 가능

### 이번 작업에 제외
- 새로운 route 추가
- mock page / preview page 추가
- DB schema 변경
- 매점 비용 같은 신규 데이터 필드 추가
- 애니메이션 과도한 고도화

## 4. Target Files

### 핵심 수정 대상
- `src/app/history/page.tsx`
- `src/components/features/home-calendar.tsx`

### 필요 시 추가 생성 가능
- `src/components/features/history-dashboard/` 아래 대시보드용 UI 컴포넌트 분리

권장 컴포넌트:
- `dashboard-kpi-row.tsx`
- `dashboard-routine-card.tsx`
- `dashboard-insight-card.tsx`
- `dashboard-recent-card.tsx`

## 5. Existing Code Facts

### 데이터 소스
- `useUserLogs()`에서 현재 유저의 전체 기록 로드 가능
- `LogWithPlace` 기준으로 필요한 필드는 이미 존재

활용 가능한 필드:
- 공통:
  - `date`
  - `tribe_id`
  - `place_id`
  - `place_name`
  - `deep_log`
- 루틴:
  - `heat_time`
  - `ice_time`
  - `pause_time`
  - `repeat`
- 사우너:
  - `sauna_temp`
  - `cold_bath_temp`
  - `totono_score`
- 목욕파:
  - `hot_bath_temp`
  - `cold_bath_temp`
  - `water_quality`
  - `deep_log.has_scrub`
  - `deep_log.scrub_satisfaction`
- 찜질파:
  - `jjim_temp`
  - `rest_quality`
  - `sweat_quality`
  - `deep_log.has_store`
  - `deep_log.store_score`

### 이미 구현된 캘린더
- `HomeCalendar`는 월/주간 전환, 선택 날짜, 오늘 이동, 스와이프를 이미 처리
- 이 로직은 유지하고, 대시보드에서 월 통계를 계산할 수 있도록 부모에 현재 월 정보를 전달하는 정도만 허용

## 6. Layout Plan

## 6.1 Overall

### 목적
- 이번 달 전체 회고
- 전문 지표보다 전체 방문 패턴과 회고 경험 중심

### 섹션 순서
1. Header
2. View toggle (`list` / `calendar`)
3. Dashboard tabs (`OVERALL / BATHER / SAUNNER / JJIMI`)
4. KPI row
5. Overall summary card
6. Session heatmap card
7. Recent records
8. Selected day logs

### KPI
- `VISIT DAYS`
- `LOCATIONS`
- `TOTAL VISITS`

### Overall summary card
- 숫자 중심 레이아웃
- 추천 내용:
  - 월 방문 횟수
  - 방문한 장소 수
  - 딥로그 작성일 수
- 링 그래프 사용 금지

## 6.2 Bather

### 목적
- 전체 디자인의 기준 화면
- 가장 안정적이고 정돈된 숫자 중심 화면

### 섹션 순서
1. KPI row
2. `OPTIMAL CYCLE ROUTINE`
3. Bather insight card
4. Session heatmap
5. Recent records
6. Selected day logs

### Routine card
- 슬롯 4개
  - 온탕
  - 냉탕
  - 쉬는 시간
  - 반복

### Insight card
- 좌측 대형 지표:
  - `TOTAL TIME IN WATER`
- 우측 상단:
  - `AVG WATER TEMP`
- 우측 하단:
  - `WATER QUALITY`

## 6.3 Saunner

### 목적
- `Bather` 구조를 유지하되 인사이트 카드를 더 nerdy하게 전환

### Routine card
- 슬롯 4개
  - 사우나
  - 냉탕
  - 휴식
  - 반복

### Insight card
- 좌측:
  - `WEEKLY HEAT EXPOSURE` 링
  - 중앙 수치: 주간 heat minutes
  - 보조 표기: `/57M`
- 우측 상단:
  - `TOTONOU SCORE`
- 우측 하단:
  - `AVG DELTA TEMP`

## 6.4 Jimi

### 목적
- `Saunner`와 동일한 카드 구조
- 우측 지표만 찜질파용으로 치환

### Routine card
- 슬롯 3개 또는 4개
  - 찜질
  - 쉬는 시간
  - 반복

### Insight card
- 좌측:
  - `WEEKLY HEAT EXPOSURE` 링
  - 중앙 수치: 주간 heat minutes
  - 보조 표기: `/57M`
- 우측 상단:
  - `AVG JJIM TEMP`
- 우측 하단:
  - `SWEAT SCORE`

주의:
- `REST SCORE`는 1차 메인 카드에 같이 넣지 말고 보조 지표 후보로 남긴다.

## 7. Metrics Definition

### 공통
- `VISIT DAYS`: 현재 월에 기록이 있는 날짜 수
- `LOCATIONS`: 현재 월에 방문한 고유 장소 수
- `TOTAL VISITS`: 현재 월 총 로그 수

### Overall summary
- `deep log days`: 현재 월 딥로그가 하나라도 있는 날짜 수

### Bather
- `TOTAL TIME IN WATER`
  - 현재 월 `bather` 로그 기준
  - 계산식: `heat_time * repeat`
  - `repeat` 미입력 시 `1`로 보지 말고, 두 값 모두 있는 로그만 집계하거나 보수적으로 처리
  - 구현 시 집계 기준을 명확히 주석으로 남길 것
- `AVG WATER TEMP`
  - `hot_bath_temp` 평균
- `WATER QUALITY`
  - `water_quality` 평균

### Saunner
- `WEEKLY HEAT EXPOSURE`
  - 현재 주 기준 `heat_time * repeat`의 합
  - 타겟은 `57분`
- `TOTONOU SCORE`
  - 현재 월 `totono_score` 평균
- `AVG DELTA TEMP`
  - `(sauna_temp - cold_bath_temp)` 평균
  - 두 값 모두 있는 로그만 집계

### Jimi
- `WEEKLY HEAT EXPOSURE`
  - 현재 주 기준 `heat_time * repeat`의 합
  - 타겟은 `57분`
- `AVG JJIM TEMP`
  - 현재 월 `jjim_temp` 평균
- `SWEAT SCORE`
  - 현재 월 `sweat_quality` 평균

## 8. Routine Card Definition

### 공통 원칙
- 이 카드는 총 체류시간이 아니라 **대표 루틴 패턴**을 보여준다.
- 평균값은 현재 선택된 월의 해당 트라이브 로그 기준으로 계산한다.
- 값이 없는 항목은 과장하지 말고 inactive 처리하거나 `-` 처리한다.

### Saunner
- `사우나`: `heat_time` 평균
- `냉탕`: `ice_time` 평균
- `휴식`: `pause_time` 평균
- `반복`: `repeat` 평균

### Bather
- `온탕`: `heat_time` 평균
- `냉탕`: `ice_time` 평균
- `쉬는 시간`: `pause_time` 평균
- `반복`: `repeat` 평균

### Jimi
- `찜질`: `heat_time` 평균
- `쉬는 시간`: `pause_time` 평균
- `반복`: `repeat` 평균

## 9. Empty State Rules

### 탭 자체
- 모든 탭은 보여주되, 데이터가 없으면 empty state 노출

### 카드
- 평균 계산에 필요한 데이터가 부족하면 `-` 또는 `기록이 더 쌓이면 보여드릴게요`
- `Saunner` / `Jimi`의 링 카드는 값이 0이어도 레이아웃은 유지
- `Bather`의 냉탕 루틴은 입력 데이터 부족 시 비활성 슬롯 가능

## 10. Suggested Component Plan

### 최소 분리 권장
- `HistoryDashboardKpiRow`
- `HistoryDashboardRoutineCard`
- `HistoryDashboardInsightCard`
- `HistoryDashboardRecentItem`

### 유틸 분리 권장
- `getMonthLogs(logs, monthView, tribe)`
- `getWeekLogs(logs, selectedDate or monthView, tribe)`
- `average(values)`
- `sum(values)`
- `countUniqueDates(logs)`
- `countUniquePlaces(logs)`
- `formatRoutineValue()`

## 11. Implementation Order

1. `history/page.tsx`에서 dashboard 계산용 derived data 작성
2. 현재 월 상태를 부모가 알 수 있도록 연결
3. calendar view 상단에 dashboard tabs + KPI row 추가
4. `typeFilter`에 따라 각 tribe layout 분기
5. routine card 구현
6. insight card 구현
7. `HomeCalendar` 셀을 점 + 링 규칙으로 표현
8. recent list를 dashboard 톤에 맞게 compact card로 개선
9. selected day logs는 기존 흐름 유지
10. lint 확인 및 정리

## 12. Visual Guidance

### 반드시 유지할 것
- 현재 앱의 glassy texture
- 카드 radius
- 기존 spacing rhythm
- 모바일 우선 폭과 여백

### 스크린샷에서 반영할 것
- KPI 3칸 구성
- `OPTIMAL CYCLE ROUTINE` 카드
- 대형 숫자 + 우측 2지표 카드 구조
- `SESSION HEATMAP` 레이블 방식
- `WEEKLY HEAT EXPOSURE / 57M` 링 카드 구조

### 주의할 것
- 스크린샷을 그대로 복제하지 말고, 현재 앱 톤에 맞게 자연스럽게 녹여야 한다.
- 현재 앱보다 지나치게 날카롭거나 flat한 카드 스타일로 가면 안 된다.

## 13. Direct Prompt For Another Agent

```md
Implement the dashboard UI directly inside `src/app/history/page.tsx` using real user data from `useUserLogs()`.

Important requirements:
- Use the existing app's visual style as the base (glass cards, spacing, background, typography tone).
- Use the provided dashboard screenshot direction only for layout structure and metric presentation.
- The preferred master layout is the Bather screen.
- Do not create mock data or a preview route.
- If a user has records across multiple tribes, they should be able to view every tribe tab.
- Keep all tabs visible if feasible; show a graceful empty state for tabs without enough data.
- The calendar cell rule must be:
  - one dot for a logged day
  - one thin outer ring if any deep log exists that day
  - no extra dots or stronger density for multiple visits on the same day
- Do NOT modify the existing month switching / highlighted date sync logic in `HomeCalendar`.
- You may pass current month state upward, but do not rewrite the calendar selection behavior.

Required layout sections in calendar view:
- dashboard tabs
- KPI row
- tribe-specific routine card
- tribe-specific insight card
- session heatmap
- recent records
- selected day logs

Metric rules:
- Overall: visit days, locations, total visits
- Bather: total time in water, avg water temp, water quality
- Saunner: weekly heat exposure ring (/57M), totonou score, avg delta temp
- Jimi: weekly heat exposure ring (/57M), avg jjim temp, sweat score

Routine card rules:
- Saunner: sauna / cold plunge / rest / repeat
- Bather: hot bath / cold bath / rest / repeat
- Jimi: jjimjil / rest / repeat

Use minimal clean component extraction if needed, but keep implementation understandable.
After implementing, run lint diagnostics on changed files and report any caveats or assumptions.
```

## 14. Review Checklist For Me

구현 후 아래를 기준으로 검토한다.

### 구조
- `calendar` 뷰가 실제로 대시보드 역할을 하는가
- `Bather` 레이아웃이 기준 템플릿처럼 안정적인가
- `Saunner`, `Jimi`가 무리하게 다른 페이지처럼 보이지 않는가

### 데이터
- mock 없이 실제 로그로 계산되는가
- 월별/주별 계산 기준이 일관적인가
- 평균 계산에서 null/optional 필드를 안전하게 처리했는가

### 캘린더
- 점 + 링 규칙이 정확한가
- 동일 날짜 복수 방문이 셀 표현을 깨지 않는가
- 기존 월 전환/하이라이트 로직을 해치지 않았는가

### UI
- 현재 앱 톤과 이질감이 없는가
- 카드 높이, 여백, 섹션 순서가 안정적인가
- 작은 화면에서 줄바꿈/overflow 문제가 없는가

### 리스크
- `Bather total time in water` 계산 근거가 과장되지 않았는가
- `weekly heat exposure`가 사용자가 이해 가능한 방식으로 표현되는가
- 데이터가 적을 때도 레이아웃이 무너지지 않는가

## 15. Notes
- 현재 작업 브랜치에는 `HomeCalendar`에 `onMonthChange`, `dotColor`, `점+링` 관련 일부 수정이 이미 시작되었을 수 있다.
- 이 문서를 기준으로 구현하되, 캘린더 핵심 선택 로직은 유지하는 방향으로 정리할 것.
