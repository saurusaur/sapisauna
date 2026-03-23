# SA-리스트 잔여 작업 정리 (2026-03-23)

> 이전 핸드오프(`handoff_20260323_sa_list.md`), Devil's Advocate 리뷰, 벤치마크 분석 기반 통합 정리

---

## A. 미해결 이슈 (우선순위순)

### A-1. `usePlaces()` 전체 로드 (CRITICAL — 아키텍처)

**현상**: `sa-list-detail-client.tsx:53`에서 `usePlaces()` → 마운트 시 전체 229건 fetch.
검색 필터(`searchResults`)를 `showAddSheet && searchQuery` 조건으로 바꿔서 **렌더링은 개선**했지만, **네트워크 요청 자체는 페이지 진입 시 항상 발생**.

**영향**: 229건은 괜찮지만, 1000건+ 시 초기 로딩 지연 + 메모리 낭비.

**해결 후보**:

| # | 방법 | 난이도 | 효과 |
|---|------|--------|------|
| 1 | **`usePlaceSearch()` 훅으로 교체** — 이미 존재하는 `usePlaceSearch()`가 `searchPlaces(query)` 서버 ILIKE 검색 사용. `usePlaces()` 제거하고 이걸로 대체 | ⭐ 낮음 | 전체 로드 완전 제거 |
| 2 | lazy state로 전환 — `showAddSheet`가 true일 때만 fetch | ⭐ 낮음 | 네트워크 요청 지연만 |
| 3 | Supabase RPC + trigram 검색 엔드포인트 | ⭐⭐ 중간 | 대규모 대비 최적 |

**추천**: **#1 (usePlaceSearch 교체)** — 이미 서버사이드 검색 훅이 존재하므로, 코드 1파일 수정으로 해결 가능. 디바운스만 추가하면 됨.

```
변경 범위:
- sa-list-detail-client.tsx: usePlaces() → usePlaceSearch() 교체
- searchResults 로직 → search(query) 호출 + 결과 사용으로 변경
```

---

### A-2. `savedMap` 무한 성장 (HIGH)

**현상**: `save-place-context.tsx:35` — `savedMap: Record<string, string[]>`이 세션 동안 계속 누적. 사용자가 장소를 브라우징할수록 엔트리 증가.

**현재 규모**: 229개 장소 전부 방문해도 ~229 엔트리 → 실질적 문제 없음.

**해결 후보**:
- 지금은 **수용** (229건 max). 문서화만.
- 1000건+ 시: LRU 캐시(최근 100개만 유지) 또는 React Query 전환.

**추천**: 지금은 SKIP. 장소 수 500건 이상일 때 재검토.

---

### A-3. `getPlaceSaveCounts` N+1 패턴 (HIGH)

**현상**: `lists-service.ts:277-302` — 모든 list_items 행을 JS에서 집계.

**해결**: SQL RPC로 `COUNT(DISTINCT owner_id) GROUP BY place_id` 처리.

**추천**: explore 페이지 성능에 직접 영향. P1에서 수정.

---

### A-4. `toggleSubscription` TOCTOU 레이스 (HIGH)

**현상**: `lists-service.ts:218-239` — 존재 확인 → insert/delete 사이에 이중 탭 가능.

**해결**: `upsert` + `onConflict` 또는 Postgres function으로 원자적 처리.

---

### A-5. 스낵바 `onDismiss` 무한 재렌더 위험 (MEDIUM)

**현상**: `snackbar.tsx:47` — 부모가 `useCallback` 안 쓰면 5초 타이머 매번 리셋.
explore 페이지에서 인라인 함수 전달 중 → 실사용에서 아직 문제 미발생이지만 잠재적.

**해결**: snackbar 내부에서 `useRef`로 콜백 보호, 또는 부모에서 `useCallback` 적용.

---

### A-6. 구독 버튼 loading 상태 없음 (MEDIUM)

**현상**: `sa-list-detail-client.tsx:243-257`, `cover-card.tsx` — 네트워크 중 이중 탭 가능.

**해결**: `useSubscription`에 `loading` 상태 추가 → 버튼 `disabled` 바인딩.

---

### A-7. 바텀시트 드래그 dismiss 미구현 (MEDIUM)

**현상**: `bottom-sheet.tsx:51-53` — 핸들 바가 있지만 드래그 불가. False affordance.

**해결**: 터치 제스처 구현 또는 핸들 제거.

---

## B. 코드 정리 (기능 안정화 후)

| 항목 | 파일 | 설명 |
|------|------|------|
| 공유 로직 중복 | `cover-card.tsx` + `sa-list-detail-client.tsx` | → `src/lib/share.ts` 추출 |
| visibility 토글 중복 | `sa-list/page.tsx` + `sa-list-detail-client.tsx` | → `use-list-actions.ts` 훅 |
| Supabase 타입 캐스팅 | `lists-service.ts` 전반 | `as unknown as` 남발 → 생성 타입 사용 |
| 에러 삼킴 | `use-save-place`, `use-subscriptions` | `.catch(() => {})` → 최소 console.error |
| `fetch` 네이밍 | `use-lists.ts:19` | `window.fetch` 섀도잉 → `refetchLists` |

---

## C. DB 마이그레이션 (미실행)

`supabase/010_lists.sql` — Supabase에 아직 실행 안 됨.

**실행 후 검증 항목**:
1. 기본 리스트 자동 생성 트리거
2. place_count / subscriber_count 트리거
3. visibility 자동 강등 (place_count < 3 → unlisted)
4. default 리스트 삭제 방지
5. MAX_LISTS 15개 제한 트리거
6. RLS: private 리스트 구독 차단

---

## D. 빌드 검증

- `npm run build` 미실행 — `is_public` 잔여 참조 가능성
- `grep -r "is_public" src/` 로 확인 필요

---

## E. 배포 후 검증

| 항목 | 방법 |
|------|------|
| OG 카드 | `curl -A 'facebookexternalhit' URL` |
| 비로그인 접근 | public/unlisted 리스트 시크릿 모드 접근 |
| 큐레이션 시드 | 어드민 계정 type='admin' 리스트 2-3개 생성 |

---

## F. 추천 작업 순서

| 단계 | 작업 | 예상 규모 |
|------|------|-----------|
| **1** | `usePlaces()` → `usePlaceSearch()` 교체 | 1파일 |
| **2** | 빌드 검증 + `is_public` 잔여 grep | 0-N파일 |
| **3** | DB 마이그레이션 실행 + 트리거 검증 | SQL |
| **4** | 구독 버튼 loading 상태 추가 | 2파일 |
| **5** | 스낵바 onDismiss ref 보호 | 1파일 |
| **6** | toggleSubscription 원자적 처리 | 1파일 |
| **7** | 코드 정리 (중복 추출) | 3-4파일 |
| **8** | N+1 쿼리 → SQL RPC 전환 | 1파일+SQL |
