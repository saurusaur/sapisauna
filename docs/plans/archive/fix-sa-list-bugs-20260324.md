# SA-LIST 버그 수정 플랜 (2026-03-24)

## 확정 사항

### 아이콘 체계
- `bookmark_heart` = 메인 저장 아이콘 (기본 리스트 토글, PlaceCard/상세/바텀시트 MY SA-LIST)
- `heart_plus` / `heart_check` = 커스텀 리스트 추가/제거 전용 (SaveBottomSheet 리스트 항목)

### 토스트 시스템
- `showError(msg)` → 빨간 배경, 4초 (변경 없음)
- `showNotice(msg, onUndo?)` → 어두운 배경, onUndo 있으면 되돌리기 버튼 표시
- 기존 `showUndo` → `showNotice`로 리네이밍 (기존 호출부 7곳 치환)

### 토스트/스낵바 조건표
| 상황 | 피드백 | 내용 | 액션 |
|------|--------|------|------|
| 저장 (커스텀 리스트 없음) | 스낵바 | "MY SA-LIST에 저장됨" | [메모 추가] [새 리스트] |
| 저장 (커스텀 리스트 있음) | 바텀시트 열림 | — | — |
| 바텀시트 리스트 추가 | 시트 내 토스트 | "{리스트명}에 저장됨" | — |
| 바텀시트 리스트 제거 | 시트 내 토스트 | "{리스트명}에서 제거됨" | — |
| 해제 (기본만) | showNotice | "저장 해제됨" | — |
| 해제 (여러 리스트) | confirm → showNotice | "저장 해제됨" | — |
| 구독 해제 | showNotice + undo | "{리스트명} 구독 해지됨" | [되돌리기] |

### 메모 추가 (스낵바 → 바텀시트)
- 스낵바에서 [메모 추가] 탭 → 스낵바 닫힘 → 미니 바텀시트 열림
- BottomSheet 재활용 + updateListItemMemo(defaultListId, placeId, memo)

### SaveBottomSheet 제목
- 현재처럼 제목 없이 유지

---

## Agent 1: Save System (가장 복잡, 상호의존)

### 파일: toast-context.tsx + toast.tsx
- [ ] `showUndo` → `showNotice` 리네이밍, onUndo를 optional로 변경
- [ ] 타입 `ToastType` 'undo' → 'notice' (또는 유지하되 함수명만 변경)

### 파일: save-bottom-sheet.tsx
- [ ] D2/D3: handleCreate에서 `listsService.addPlaceToList` → `toggleListSave` 교체
- [ ] D4: heart_plus/heart_check 아이콘 → 오른쪽 배치 (리스트명 왼쪽, 아이콘+곳수 오른쪽)
- [ ] D1: 인라인 생성 섹션 "SA-LIST" 라벨 → "새 리스트 이름"

### 파일: explore/[id]/page.tsx (아이콘 + 피드백 영역)
- [ ] B2: 저장 아이콘 `heart_plus/heart_check` → `bookmark_heart`
- [ ] B5: 해제 시 showNotice("저장 해제됨")
- [ ] 메모 바텀시트 state + 렌더링 추가

### 파일: explore/page.tsx
- [ ] B5: 해제 시 showNotice("저장 해제됨")
- [ ] 메모 바텀시트 state + 렌더링 추가

### 파일: snackbar.tsx
- [ ] "저장됨" → "MY SA-LIST에 저장됨"
- [ ] 리스트 버튼 목록 제거
- [ ] "새로" → "새 리스트" (풀 텍스트)
- [ ] 메모 아이콘 → "메모 추가" (풀 텍스트)
- [ ] "···" 더보기 제거

### showNotice 치환 대상 (기존 showUndo → showNotice)
- [ ] sa-list/page.tsx: 452, 454행 (구독 해지/구독)
- [ ] sa-list-detail-client.tsx: 124, 253, 255행 (장소 제거, 구독)
- [ ] sa-list/page.tsx: SubscribedCoverCard prop명
- [ ] sa-list-detail-client.tsx: SubscribedCoverCard 호출부

---

## Agent 2: DB + Error (독립)

### 파일: lists-service.ts
- [ ] tribes 조회 + owner_tribe 매핑 제거 (lines 49,58,71,82,293,304)

### 파일: lists-service-server.ts
- [ ] tribes 조회 + owner_tribe 매핑 제거 (lines 17,29)

### 파일: data-state.tsx
- [ ] Raw DB 에러 패턴 감지 → "데이터를 불러오지 못했어요" + console.error 보존

---

## Agent 3: UI/Layout (독립)

### 파일: bottom-sheet.tsx
- [ ] z-index z-50 → z-[60]

### 파일: sa-list/page.tsx
- [ ] 이중 스크롤 `max-h-[70vh] overflow-y-auto` 제거
- [ ] 태그 input ref + "추가" 버튼 onMouseDown preventDefault + handleAddTag focus()

### 파일: explore/[id]/page.tsx (지도URL + 리포트 영역)
- [ ] Google Maps URL → Agent 4 결과 기반으로 수정
- [ ] 사-피 리포트 데이터 없을 때 빈 glass-card 숨기기

---

## Agent 4: 지도 링크 검증 + 수정 (독립, 리서치)

### Step 1: 데이터 추출
- places + place_sources 전체 조인
- 장소별: name, address, country_code, lat/lng, google external_id, naver external_id

### Step 2: 샘플 테스트 (한국 10 + 일본 10 + 기타 10)
- Google: place_id URL 포맷 후보 A/B/C/D 비교 테스트
- Naver: 이름 검색 매칭 정확도 테스트
- 결과 리포트

### Step 3: 전체 검증
- 샘플에서 확정된 포맷으로 전체 장소 검증
- 매칭 실패 장소 리스트업

### Step 4: 코드 수정
- explore/[id]/page.tsx: URL 생성 로직 수정
- 필요시 place_sources 데이터 정비

---

## 실행 순서
1. Agent 2 + Agent 4(Step 1-2 샘플) → 병렬 즉시 시작
2. Agent 3 → 병렬 시작 (Google Maps URL은 Agent 4 결과 대기)
3. Agent 1 → 병렬 시작 (explore/[id] 아이콘/피드백 영역은 Agent 3과 겹치지 않음)
4. Agent 4(Step 3-4 전체 검증) → 샘플 결과 확인 후 진행
