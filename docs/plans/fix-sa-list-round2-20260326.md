# SA-LIST 버그 수정 Round 2 (2026-03-26)

## 확정 사항

### Issue 1: 북마크 상태 초기화
- batchCheckSaved(placeIds[]) 추가 — 1회 API로 N개 장소 상태 조회
- getListsContainingPlaces(userId, placeIds[]) 서비스 함수 추가
- SA-LIST 상세에서 items 로드 후 일괄 호출

### Issue 2: 컬렉션 카드 재설계
- ... 메뉴 제거
- 북마크 해제 = 삭제 (이 리스트에만 있으면 즉시, 여러 리스트면 모달)
  - 모달: "이 리스트에서만 제거" / "모든 리스트에서 제거" / "취소"
- 메모 영역 탭으로 수정 진입 (edit 아이콘, Material Symbols)
- 메모 없으면 "메모 추가" + edit 아이콘 플레이스홀더
- getListItems에 toPlace() 적용 — 장소명/주소 정상 표시
- isMine: 위 동작 / !isMine: 탐색과 동일한 저장 플로우 (읽기전용 메모)
- 토스트: "메모가 저장되었어요", "'{리스트명}'에서 제거됨", "모든 리스트에서 제거됨"

### Issue 3: place_count 갱신
- handleAddPlace, handleRemovePlace 후 refreshList() 추가

### Issue 4a: 남의 리스트 북마크 피드백
- 탐색과 동일한 저장 플로우 (토스트/스낵바/바텀시트)

### Issue 4b: 구독 토스트
- 구독: "{제목} 구독완료!" (되돌리기 없음)
- 해지: "{제목} 구독해지" + [되돌리기]

### Issue 4c: 되돌리기 스타일
- text-xs + underline (터치영역 py-1 px-2 유지)

### Issue 4d: 어드민 추천
- RPC 함수 toggle_featured (SECURITY DEFINER)
- 클라이언트: supabase.rpc('toggle_featured', { target_list_id })

### Issue 5: 왼쪽 바 색상
- MY SA-LIST: var(--color-primary) 빨간색
- public: #292524 블랙
- unlisted: #78716c 진한 회색
- private: #a8a29e 연한 회색

### Issue 6a: 피드 ... 메뉴 → ListManageSheet
- 바텀시트 뷰 전환 (메뉴 → 편집 / 공개설정)
- 편집: 이름 + 태그 + 설명 (TagEditor 공통 컴포넌트)
- 공개설정: 라디오 3옵션, 즉시 적용
- 삭제: ConfirmModal
- default 리스트에는 ... 숨김
- 편집 중 이탈 시 변경사항 있으면 confirm
- 피드 + 상세 동일 컴포넌트

### Issue 6b: 따옴표 제거
- cover-card description에서 &ldquo;&rdquo; 제거

### Issue 6c: 오너 구독자 수
- 메타 줄에 subscriber_count > 0일 때 표시

### 공통 컴포넌트
- TagEditor: 태그 추가/삭제 UI (생성+편집 공용)
- ListManageSheet: ... 메뉴 + 편집 + 공개설정 + 삭제 (피드+상세 공용)

### 이전 미해결: slug URL + 비로그인 접근
- getListByIdServer AbortError 처리
- useSubscription/useSavePlace 비로그인 안전 처리
- slug 기반 URL 정상 동작 확인
- 비로그인 유저에게 로그인 유도 UI

---

## 에이전트 분배

### Agent A: 서비스 레이어 + Context (기반 인프라)
- lists-service.ts: getListsContainingPlaces(배치) + getListItems에 toPlace 적용
- save-place-context.tsx: batchCheckSaved 추가
- RPC SQL: toggle_featured 함수

### Agent B: ListManageSheet + TagEditor (공통 컴포넌트)
- components/features/list-manage-sheet.tsx (NEW)
- components/features/tag-editor.tsx (NEW)
- sa-list/page.tsx: 기존 ... 메뉴 → ListManageSheet 교체 + 생성시트 TagEditor 사용
- sa-list-detail-client.tsx: 기존 ... 메뉴 → ListManageSheet 교체

### Agent C: SA-LIST 상세 카드 UX (Issue 2 + 1 + 3 + 4a)
- sa-list-detail-client.tsx: 컬렉션 카드 재설계, batchCheck useEffect, refreshList 추가, 남의 리스트 저장 플로우
- place-card.tsx: collection variant 메모 영역 탭 편집 지원

### Agent D: CoverCard + 토스트 + 색상 (Issue 4b,4c,5,6b,6c)
- cover-card.tsx: 왼쪽 바 색상 visibility 기준, 따옴표 제거, 오너 구독자 수
- toast.tsx: 되돌리기 스타일
- sa-list/page.tsx + detail: 구독 토스트 메시지 변경

### Agent E: slug URL + 비로그인 접근
- lists-service-server.ts: AbortError 처리
- sa-list/[id]/page.tsx: 서버 컴포넌트 에러 핸들링
- use-subscriptions.ts: 비로그인 안전 처리
- sa-list-detail-client.tsx: 비로그인 유저 UI

---

## 실행 순서
1. Agent A (기반) → 먼저 완료 필요 (다른 에이전트가 의존)
2. Agent B + D + E → A 완료 후 병렬
3. Agent C → B 완료 후 (ListManageSheet, TagEditor 사용)
