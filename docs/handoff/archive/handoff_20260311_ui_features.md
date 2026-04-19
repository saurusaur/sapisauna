# Handoff: UI 개선 + 기능 추가 (2026-03-11)

## 완료 항목

### 1. 기록 상세 (history/[id])
- 장소 카드 요소 간격 통일 (mt-2/1.5/3 → 모두 mt-2.5)
- glass-card-light 그림자 살짝 강화
- formatDateTime: 분 제거 → "오후 3시" 형식
- 편집/삭제 아이콘 primary 컬러 통일
- REST → REST QUALITY 라벨 수정
- JIMI 메트릭에 SWEAT QUALITY 추가 (row1: sweat, row2: rest)

### 2. 영문 라벨 통합 리팩토링
- `METRIC_LABELS_EN` 별도 상수 삭제
- QUICK_LOG 각 항목에 `labelEn` 필드 추가 (한 곳에서 한/영 관리)
- `COMPUTED_METRICS` 신규 — 계산 파생값 (TEMP DELTA 등) label/labelEn
- history/[id] 하드코딩 라벨 → `QUICK_LOG.*.labelEn` / `COMPUTED_METRICS.*.labelEn` 참조로 교체

### 3. JIMI sweat_quality 추가
- **변경 파일**: types/index.ts, constants/content.ts, log/page.tsx, logs-service.ts, history/[id]/page.tsx, utils.ts
- DB: `sweat_quality` integer nullable 칼럼 추가 필요 (restate 시 반영)
- 숏로그 입력 순서: 한증막 온도 → 발한 퀄리티(칩) → 휴식 퀄리티(칩)
- RecordCard 상세 텍스트: `한증막 80° · 발한 3/5 · 휴식 3/5`

### 4. RecordCard 상세 텍스트 변경
- descriptor → 점수 표기 (수질 3/5, 토토노 0/5)
- 숏로그 입력 순서대로 정렬

### 5. 장소 선택 (/place)
- "직접 장소 추가" 버튼 → 홈 CTA 스타일 ("찾으시는 장소가 없나요?" + 밑줄 링크)

### 6. 장소 추가 (/place/add) UX 대폭 개선
- 검색 기반 등록을 기본 플로우로 전환
- name/address 수동 입력 숨김 → 검색 결과 0건일 때만 드롭다운 내 "직접 입력하기" 폴백
- 수동 입력 카드: "장소 직접 등록" 헤더 + x 닫기 버튼
- 선택 장소 배경: bg-green-light → primary-light
- 헤더: history 스타일 ("ADD PLACE" 이탤릭 볼드), 저장 버튼 헤더에서 제거
- 하단 고정 저장 버튼 (숏로그 동일 스타일, canSave false 시 opacity 40%)
- 저장 조건: name + address + 시설 2개 이상 필수
- 뒤로가기: hasInput || canSave 시 ConfirmModal
- 문구: "당신은 사-피 개척자! 어떤 장소인가요?" (레드, 구분선 헤더)
- source='manual' 플래그 기존 유지 → 어드민 리뷰 큐 백로그 추가

## DB 변경 필요 (restate 시)
- `logs` 테이블: `sweat_quality` integer nullable 칼럼 추가

## 백로그 추가
- [P2] 어드민 수동 등록 장소 리뷰 큐 (source='manual')
