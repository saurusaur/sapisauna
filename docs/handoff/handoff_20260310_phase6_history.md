# Handoff: Phase 6 히스토리 디자인 오버홀 (진행 중)

> 날짜: 2026-03-10
> 브랜치: main (미커밋)

---

## 작업 목표
디자인 오버홀 Phase 6 — 히스토리 리스트(`/history`) + 기록 상세(`/history/[id]`) 페이지 재설계

## 완료된 것

### history/page.tsx
- [x] 헤더: `glass-card-light` 바 → `p-5 pt-8` 오픈 헤더 + "HISTORY" 이탤릭 세리프 (tribe picks 전체보기 스타일 통일)
- [x] 뷰 토글: 글래스 스타일 (`bg-stone-100/60 backdrop-blur-sm`)
- [ ] 검색바: glass-input 미적용
- [ ] 캘린더 뷰: HomeCalendar 재사용 미적용
- [ ] 타입 필터 탭: 이미 TypeTab 사용 중 (스타일 확인 필요)

### history/[id]/page.tsx (전면 리라이트 완료)
- [x] 헤더: "RECORD" 이탤릭 세리프 (tribe picks 스타일 통일)
- [x] 장소 카드: `glass-card p-5`, 장소상세 페이지 참조, 타입 이모지 우측, ScoreBadge+descriptor 통일
- [x] Editorial 메트릭: `grid grid-cols-2` — 좌 대형 숫자(72px, 스토리 라벨 통일) / 우 서브 메트릭 (높이 일치 그리드)
- [x] 루틴: HEADER(레드) → NUMBER(블랙) → UNIT 3행 구조, 중앙정렬
- [x] 딥 리뷰: `glass-card-light rounded-2xl`, 레드 좌측 바 + "DEEP LOG" 캡스, 여백 분리
- [x] 메모: 별도 glass-card-light 타일
- [x] 같은 장소 기록: "이 장소의 다른 기록" + "전체보기" 우측 링크, RecordCard 재사용
- [x] CTA: fixed bottom 플로팅 버튼 (장소상세와 동일 그림자)

## 미완료 (다음 세션에서 진행)

### history/page.tsx 남은 항목
1. **검색바**: `bg-white rounded-xl` → `glass-input rounded-full` + 레드 포커스 링
2. **캘린더 뷰**: 자체 달력 코드 → HomeCalendar 재사용 (defaultExpanded + hideToggle props 추가 필요)
3. **캘린더 월 네비/그리드**: `bg-white` → `glass-card-light`
4. **선택된 날짜**: `bg-stone-100` → `bg-[var(--color-primary-light)]`
5. **월별 stat**: 유지 (변경 불필요)

### 시각 검증 필요
- 기록 상세: 대형 숫자 크기/정렬이 모바일 뷰포트에서 적절한지
- 기록 상세: 서브 메트릭 3행과 대형 숫자 높이 실제 매칭 확인
- 기록 상세: 루틴 중앙정렬 간격
- 모든 타입(사우너/목욕/찜질) 기록으로 각각 확인

## 변경 파일 목록 (미커밋)

| 파일 | 변경 내용 |
|------|----------|
| `src/app/history/[id]/page.tsx` | 전면 리라이트 — editorial 레이아웃 |
| `src/app/history/page.tsx` | 헤더 스타일 변경 |
| 기타 10개 파일 | 이전 세션에서 변경된 것 (커밋 `4fd0f05` 이후) |

## 결정 사항 (확정)

| 항목 | 결정 |
|------|------|
| 헤딩 스타일 | 이탤릭 세리프 (홈/탐색/tribe picks 통일) |
| 타입 필터 탭 | 타입별 컬러 유지 |
| 달력 dot | 타입별 컬러 유지 |
| 달력 UI | HomeCalendar 월 보기 재사용 (미구현) |
| 섹션 구분선 | 회색 유지 → 딥로그는 레드 좌측 바 |
| 메트릭 숫자 | 정보=뉴트럴, 평가=레드 (숫자+description 항상 동반) |
| 루틴 표시 | HEADER/NUMBER/UNIT 3행, 레드 포인트 |
| 스토리 라벨 통일 | TEMP DELTA, BATH TEMP, JJIMJIL TEMP |

## 참고 플랜 파일
- `docs/plans/PLAN_phase6_history_detail.md` — 초기 세부 계획
- `docs/plans/PLAN_phase6_detail_layout.md` — 레이아웃 재설계 분석 (v2)
- `docs/plans/PLAN_design_overhaul_implementation.md` — 전체 Phase 0-11 로드맵

## 다음 단계
1. 시각 검증 후 미세 조정
2. history/page.tsx 검색바 + 캘린더 재사용 구현
3. 커밋 (10파일 이상이므로 분리 커밋 고려)
4. Phase 7 (장소 선택) 또는 Phase 5 (탐색) 진행
