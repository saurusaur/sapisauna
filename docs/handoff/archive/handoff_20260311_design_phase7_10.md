# 핸드오프: 디자인 오버홀 Phase 7 + 8 + 10 + 글래스 타일 통일 + 설정 서브페이지

> 작성: 2026-03-11
> 브랜치: main

## 오늘 완료한 작업

### 1. 글래스 타일 불투명도 통일
- `--glass` 35%→45%, `--glass-border` 45%→55% 조정
- `glass-card` 그림자를 `glass-card-light` 수준으로 통일 (3중 → 단일)
- solid white 카드 15곳 → `glass-card-light` 변환
- 커스텀 헤더(`bg-white/80 backdrop-blur-sm`) 6곳 → `glass-card-light` 통일
- 변경 파일: globals.css, log/page.tsx, history/page.tsx, settings/page.tsx, settings/nickname, settings/gender, settings/type, explore/page.tsx, place/page.tsx, place/add/page.tsx

### 2. Phase 7: 장소 선택 디자인
- `/place`: 헤더·카드 glass-card-light 통일
- `/place/add`: 헤더 → "ADD PLACE" italic serif + 하단 고정 저장 버튼 + 검색 기반 등록 우선

### 3. Phase 10: 설정 디자인
- 헤더 → "SETTINGS" italic serif (Home/Explore 통일)
- 섹션 그룹화: 개별 카드 → 하나의 카드에 divide-y 구분
- 섹션 라벨: 좌측 정렬 작은 텍스트
- 알림: ToggleSwitch 컴포넌트 사용
- 정보 항목: 아이콘 제거
- 로그아웃: primary red 텍스트 버튼 (중앙)

### 4. Phase 8: 온보딩 디자인
- Step 1 (닉네임): 로고 placeholder + glass-input + 중복확인 아래 중앙 (활성 레드/체크 후 그레이) + emerald 사용 가능 메시지 + 하단 고정 버튼
- Step 2 (트라이브): "PICK YOUR TRIBE" 서브페이지 헤더 + 카드 glass-card-light/선택 시 tribe color + BATHER/SAUNNER/JIMI 헤딩 폰트 라벨 + 한글 서브라벨 + 하단 고정 버튼

### 5. 로그인 페이지 디자인
- 로고 placeholder + 태그라인 (헤더 없이)
- 구글 버튼: `bg-white shadow-md` → `glass-card-light`

### 6. 설정 서브페이지 디자인
- `/settings/nickname`: 카드 제거, 입력 단독 배치 + 중복확인 중앙 + 하단 고정 저장 버튼
- `/settings/type`: 헤딩 "MY TRIBE" + 우측 체크 제거 + 하단 고정 저장 버튼
- `/settings`: 리마인더 알림 섹션 제거 (미구현), "나의 스타일" → "나의 트라이브"
- `/explore/[id]`: "PLACE" 서브페이지 헤더 추가, 시설 정보 헤더 추가, 기록 제목 → "사-피엔스의 흔적"

### 7. 기타
- 퀵로그 기본 시간: 미지정(null) → 현재 시각(now.getHours())
- BACKLOG 보상체계 참조 파일 추가
- `목욕탕파` → `목욕파` 명칭 수정

## Next Steps
- `/settings/type` 트라이브 선택 UI → 온보딩 Step 2 스타일과 통일 (PICK YOUR TRIBE 헤딩 폰트 라벨, tribe color 카드, 한글 서브라벨 등)
- Phase 9: 스토리 (구조 변경됨, 스타일만)
- Phase 11: 최종 검증

## 참고 문서
- `docs/plans/PLAN_design_overhaul_implementation.md`
- `docs/plans/DESIGN_SYSTEM_lovable_analysis.md`
