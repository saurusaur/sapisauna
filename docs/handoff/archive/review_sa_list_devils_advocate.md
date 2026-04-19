# SA-LIST Devil's Advocate Review — 2026-03-23

## 1. Architecture & Performance

### CRITICAL: `usePlaces()` loads ALL 229 places into memory for search
- **File**: `src/app/sa-list/[id]/page.tsx:58`
- `const { data: allPlaces } = usePlaces()` fetches the entire places table on every list detail page mount, even when the user never opens the "add place" sheet.
- With 229 places this is tolerable but architecturally wrong. At 1000+ places this becomes a real problem.
- **Fix**: Lazy-load places only when the add-sheet opens. Better: use a server-side search endpoint with ILIKE/trigram instead of client-side `.filter()`.

### HIGH: `savedMap` grows without bounds, never evicts
- **File**: `src/hooks/use-save-place.ts:21`
- `savedMap: Record<string, string[]>` accumulates entries as the user browses places. Never cleared except on component unmount (which in a SPA rarely happens for context-level hooks).
- With 229 places, worst case ~229 entries, fine. But if `useSavePlace()` is used in a context provider (likely), this map lives for the entire session.
- **Fix**: Either use a LRU cache or accept the tradeoff and document the max size. Or switch to React Query which handles cache eviction.

### HIGH: N+1 pattern in `getPlaceSaveCounts`
- **File**: `src/lib/lists-service.ts:277-302`
- Fetches ALL `list_items` rows matching the place IDs, joins `lists` to get `owner_id`, then aggregates in JS. For a popular place with many saves, this pulls unnecessary data.
- **Fix**: Use a SQL `COUNT(DISTINCT owner_id)` via an RPC or a view. Example: `SELECT place_id, COUNT(DISTINCT lists.owner_id) FROM list_items JOIN lists ON ... WHERE place_id IN (...) GROUP BY place_id`.

### HIGH: `toggleSubscription` has a TOCTOU race condition
- **File**: `src/lib/lists-service.ts:218-239`
- Checks if subscription exists, then inserts or deletes. Two rapid taps can cause a double-insert (unique constraint will catch it but throws an unhandled error) or double-delete (silent no-op but returns wrong boolean).
- **Fix**: Use `upsert` with `onConflict` for insert, or wrap in a Postgres function. At minimum, catch the unique violation and retry.

### MEDIUM: Three hooks fetch overlapping data independently
- **File**: `sa-list/page.tsx:35-37`
- `useMyLists()`, `useSubscribedLists()`, and `usePublicLists()` all fire on mount simultaneously. `useSavePlace()` also calls `getMyLists()` independently. So when viewing sa-list page, `getMyLists` fires twice.
- **Fix**: Lift `myLists` into a shared context, or use React Query/SWR with key-based dedup.

### MEDIUM: `useSubscription` hook fires per-card in the feed
- **File**: `sa-list/page.tsx:230` — `SubscribedCoverCard` creates one `useSubscription(list.id)` per card.
- With 20 public lists in the discovery tab, that's 20 concurrent `isSubscribed()` queries on mount.
- **Fix**: Batch — fetch all subscription statuses in one query: `SELECT list_id FROM list_subscriptions WHERE user_id = ? AND list_id IN (...)`.

### MEDIUM: `router.refresh()` after list update won't work as expected
- **File**: `sa-list/[id]/page.tsx:76, 105`
- `router.refresh()` in App Router re-fetches server components, but this is a fully client-side page (`'use client'`). The `useList(listId)` hook won't re-run because its dependency (`listId`) hasn't changed. The user will see stale data until they navigate away and back.
- **Fix**: Add a `refresh` function to `useList` (like `useListItems` has) and call that instead.

### LOW: `nanoid` adds bundle weight for a simple slug
- **File**: `src/lib/lists-service.ts:6, 10`
- `nanoid(8)` for slug generation. Works but adds a dependency. `crypto.randomUUID().slice(0,8)` would work with zero deps.
- **Fix**: Minor, not urgent.

---

## 2. UX Gaps & Anti-patterns

### HIGH: Delete has no confirmation dialog
- **File**: `sa-list/[id]/page.tsx:348`
- `handleDelete()` fires immediately on tap. A list with 50 places is gone instantly. The undo toast pattern is used for place removal but NOT for list deletion.
- **Fix**: Either add a confirmation dialog ("이 리스트를 삭제할까요? 장소 N개가 포함되어 있어요") or implement undo for deletion (soft delete with 5-second window).

### HIGH: Share for private lists leaks UUID-based access
- **File**: `cover-card.tsx:41, sa-list/[id]/page.tsx:158`
- Private lists use UUID as share ID. But RLS policy `lists_select` allows `owner_id = auth.uid()` only. So if someone receives a shared UUID link for a private list, they get... nothing (RLS blocks it). The share button is misleading for private lists.
- **Fix**: Either hide the share button for private lists, or show a warning "비공개 리스트는 공유해도 다른 사람이 볼 수 없어요".

### HIGH: Discovery tab is nearly useless at current scale
- **File**: `sa-list/page.tsx:146-164`
- Sorted by `subscriber_count` only. With <100 users, most lists will have 0-1 subscribers. The tab will show an arbitrary order of lists all showing "구독 0명", which provides zero signal for the user.
- **Fix**: For MVP, consider curated editorial lists only. Or sort by `place_count` DESC as a secondary signal. Or add a "최근 공개" sort option.

### MEDIUM: Snackbar auto-dismisses in 5 seconds but has interactive elements
- **File**: `src/components/ui/snackbar.tsx:39`
- The snackbar shows up to 3 list toggle buttons + "새로" + "..." — that's 5 interactive targets that auto-vanish in 5 seconds. Users on slow networks may not even see the options load before it disappears.
- **Fix**: Pause the auto-dismiss timer while user is interacting (e.g., on hover/touch). Or increase to 8 seconds. Or remove auto-dismiss and add an explicit close button.

### MEDIUM: No loading/disabled state on subscribe button during network call
- **File**: `sa-list/[id]/page.tsx:234-249`, `cover-card.tsx:133-149`
- `toggleSubscribe` is async but the button has no disabled state during the request. Double-tap will fire two toggles, potentially canceling itself out.
- **Fix**: Add `loading` state from `useSubscription` to disable the button during toggle.

### MEDIUM: Bottom sheet handle is decorative, not draggable
- **File**: `src/components/ui/bottom-sheet.tsx:51-53`
- The visual handle suggests swipe-to-dismiss but there's no touch gesture handler. Users will try to drag it down and nothing happens.
- **Fix**: Either implement touch-drag dismiss or remove the handle visual to avoid false affordance.

### LOW: "저장됨" snackbar `onDismiss` in useEffect dependency causes infinite re-render risk
- **File**: `src/components/ui/snackbar.tsx:47`
- `onDismiss` is in the useEffect dep array. If the parent doesn't memoize `onDismiss`, every render creates a new function reference, resetting the 5-second timer.
- **Fix**: Wrap parent's onDismiss in useCallback, or use useRef for the callback inside snackbar.

### LOW: No keyboard trap management in bottom sheets
- **File**: `src/components/ui/bottom-sheet.tsx`
- Focus can tab out of the bottom sheet into the background content. No `aria-modal`, no focus trap, no `role="dialog"`.
- **Fix**: Add focus trap (e.g., `@headlessui/react` Dialog or manual implementation). Add ARIA attributes.

---

## 3. Data Integrity Risks

### CRITICAL: `place_count` trigger has a double-decrement bug
- **File**: `supabase/010_lists.sql:138-141`
- In `update_place_count()` DELETE branch: `UPDATE lists SET place_count = place_count - 1 ... WHERE id = OLD.list_id;` then immediately `UPDATE lists SET is_public = false WHERE id = OLD.list_id AND ... AND place_count - 1 < 3;`
- The second UPDATE checks `place_count - 1 < 3`, but `place_count` was already decremented by the first UPDATE in the same trigger. So the effective check is `(original - 1) - 1 < 3` = `original < 5`. A list with 4 places that removes one should still have 3 and stay public, but this logic would set it private.
- **Fix**: Use `place_count < 3` (not `place_count - 1 < 3`) in the second UPDATE since the count was already decremented.

### HIGH: MAX_LISTS (15) is enforced client-side only
- **File**: `sa-list/page.tsx:47`, `save-bottom-sheet.tsx:76`
- `if (myLists.length >= MAX_LISTS)` — this is a UI check only. A user can bypass it via direct API calls or racing concurrent requests.
- **Fix**: Add a Postgres CHECK or trigger: `CREATE OR REPLACE FUNCTION check_list_limit() ...` that counts existing lists before INSERT.

### HIGH: RLS allows subscribing to private lists
- **File**: `supabase/010_lists.sql:105-106`
- `subscriptions_insert` policy: `WITH CHECK (user_id = auth.uid())` — only checks that you're inserting your own user_id. No check that the list is public or owned by you. Anyone who knows a private list's UUID can subscribe to it.
- **Fix**: Add: `AND EXISTS (SELECT 1 FROM lists WHERE id = list_id AND (is_public = true OR owner_id = auth.uid()))`.

### MEDIUM: Counter drift over time
- **File**: `supabase/010_lists.sql:111-149`
- Triggers are AFTER triggers, so if the UPDATE fails (e.g., concurrent update deadlock), the count drifts. No periodic reconciliation mechanism.
- **Fix**: Add a scheduled job or admin function: `UPDATE lists SET place_count = (SELECT COUNT(*) FROM list_items WHERE list_id = lists.id), subscriber_count = (SELECT COUNT(*) FROM list_subscriptions WHERE list_id = lists.id)`.

### MEDIUM: Default list deletion is not prevented
- **File**: `src/lib/lists-service.ts:146-153`
- `deleteList` has no check for `type = 'default'`. If a user somehow triggers delete on their default list (e.g., modified request), it's gone. The auto-create trigger only fires on user INSERT, not on list DELETE.
- **Fix**: Add RLS policy or trigger: `BEFORE DELETE ON lists ... IF OLD.type = 'default' THEN RAISE EXCEPTION 'Cannot delete default list';`.

### LOW: `owner_id` from `myLists[0]` in SaveBottomSheet
- **File**: `save-bottom-sheet.tsx:84`
- `owner_id: myLists[0]?.owner_id || ''` — if `myLists` is empty (race condition or error), this passes an empty string as owner_id. The INSERT will fail at DB level due to FK constraint, but the error message ("리스트 생성에 실패했어요") doesn't explain why.
- **Fix**: Use `user.id` from auth context instead.

---

## 4. Feature Value Assessment

### HIGH: Overengineered for current scale (229 places, <100 users)
- **Assessment**: The full Spotify-style playlist system (create, subscribe, discover, share) is designed for a mature product with thousands of users. At current scale:
  - **Personal lists**: With 229 places, a user realistically saves 5-20. One default list covers 90% of use cases. Custom lists add marginal value.
  - **Discovery tab**: Needs critical mass (~50+ public lists with 3+ places each) to be useful. Currently likely 0.
  - **Subscriptions**: Needs social graph to drive discovery. Without it, subscribing is manual URL sharing only.
- **Recommendation**: Ship default save (heart) + one custom list capability. Defer discovery/subscription until user count justifies it. The DB schema is fine to keep — just don't surface the UI until there's content.

### MEDIUM: Admin/curated list types are defined but unused
- **File**: `types/index.ts:204`, `supabase/010_lists.sql:14`
- `admin` and `curated` types exist in the schema and types but no UI or service logic creates them. Dead code.
- **Fix**: Either implement admin tooling to create curated lists (which would actually solve the empty-discovery problem) or remove the types from the CHECK constraint. The schema is cheap to keep; the ambiguity is the problem.

### MEDIUM: Sort order fields exist but are unused
- **File**: `lists.sort_order`, `list_items.sort_order`
- Both default to 0 and are never updated. Items are sorted by `created_at DESC`. Manual reordering would require drag-and-drop UI that doesn't exist.
- **Fix**: Remove from initial scope or implement. Currently they just add schema noise.

---

## 5. Code Quality

### HIGH: Duplicated share logic across 2 files
- **Files**: `cover-card.tsx:44-59`, `sa-list/[id]/page.tsx:157-168`
- Nearly identical share handler with the same fallback chain. Both construct the URL the same way.
- **Fix**: Extract to a shared `useShare(url, title)` hook or utility function.

### HIGH: Duplicated public toggle logic across 2 files
- **Files**: `sa-list/page.tsx:71-85`, `sa-list/[id]/page.tsx:68-80`
- Same validation (place_count < 3) and error message in both places.
- **Fix**: Move to a `useListActions(list)` hook that returns `togglePublic`, `deleteList`, etc.

### HIGH: `SaveBottomSheet` creates new `useSavePlace()` instance
- **File**: `save-bottom-sheet.tsx:36`
- If `useSavePlace()` is also used by the parent component (e.g., explore page), each gets its own `savedMap` and `myLists` state. Changes in one aren't reflected in the other until next fetch.
- **Fix**: Lift `useSavePlace()` into a React context provider so all consumers share the same cache.

### MEDIUM: Type safety issues with Supabase join casting
- **File**: `lists-service.ts:57-59, 79-83, 251-258`
- Heavy use of `as unknown as Record<string, unknown>` and manual field extraction from joined data. This bypasses TypeScript's type safety entirely.
- **Fix**: Use Supabase generated types (`supabase gen types typescript`) and proper typed queries. Or define explicit response interfaces.

### MEDIUM: Inconsistent error handling — some `.catch(() => {})` silently swallow errors
- **Files**: `use-save-place.ts:38`, `use-subscriptions.ts:46`
- `.catch(() => {})` hides network errors, auth errors, and RLS violations from the user. The user sees a loaded state with missing data and no error indication.
- **Fix**: At minimum log to console. Better: set an error state and show a retry option.

### MEDIUM: `useMyLists` named `fetch` shadows global `fetch`
- **File**: `src/hooks/use-lists.ts:19`
- `const fetch = useCallback(...)` shadows `window.fetch`. Not a bug but confusing.
- **Fix**: Rename to `loadMyLists` or `refetch`.

### LOW: `cover-card.tsx:60` — `shareId` uses `list.id` but `handleShare` dependency array has `[list.id, ...]` while using `shareId` variable
- The dependency array is correct but `shareId` is not in the useCallback closure cleanly — it's computed from `list.slug` which isn't in deps. If `list.slug` changes without `list.id` changing (unlikely but possible after updateList), the share URL would be stale.
- **Fix**: Add `shareId` computation inside the callback, or add `list.slug, list.is_public` to deps.

---

## Summary by Severity

| Severity | Count | Key Items |
|----------|-------|-----------|
| CRITICAL | 2 | place_count double-decrement bug; allPlaces full-load |
| HIGH | 10 | No delete confirmation; private list subscribe RLS gap; client-only MAX_LISTS; N+1 queries; race conditions; stale data after update; duplicated logic; overengineered for scale |
| MEDIUM | 10 | Counter drift; feed N+1 per card; snackbar auto-dismiss; type safety; silent error swallowing; unused schema fields |
| LOW | 5 | Bundle size; naming shadows; a11y gaps; dep array edge case; nanoid |

## Top 3 Actions Before Ship

1. **Fix the `place_count` trigger bug** (SQL, 1 line change, prevents data corruption)
2. **Add RLS check on `list_subscriptions` INSERT** (SQL, prevents private list subscription leak)
3. **Add delete confirmation or prevent default list deletion** (prevents data loss)
