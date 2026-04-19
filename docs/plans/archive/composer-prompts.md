# Composer Prompts — Sauna Playlist Sprint
> Paste each block into a fresh Composer session. Do them in order — each builds on the last.

---

## FEATURE 1 — Cover Color Picker in List Form
> Est. 20 min · Start here, pure frontend, zero risk

**Objective**
Add a color swatch picker to the list creation and edit form so users can choose a cover color for their list. The color should be saved and visually reflected on the list card in the feed.

**Context**
- The data model (`SaList` type and `lists-service.ts`) already has a `cover_color` field and the `createList` / `updateList` functions already accept it — the DB column exists.
- `CoverCard` component already uses `cover_color` to render the list card background — so once the value is saved, it will automatically show up in the feed.
- `ListFormSheet` (`src/components/features/list-form-sheet.tsx`) is the shared form used for both create and edit. It currently does NOT include `cover_color` in its props, state, or submit payload.
- `ListManageSheet` (`src/components/features/list-manage-sheet.tsx`) handles the edit flow and renders `ListFormSheet` internally — it will need to pass the current `cover_color` as `initialData` and forward the new value to `updateList`.
- In `sa-list/page.tsx`, the create flow calls `listsService.createList(...)` directly in the `onSubmit` handler — `cover_color` needs to be added to that call too.

**Constraints**
- Do NOT create a full color picker library. Use a fixed palette of 8–10 hand-picked colors as swatches (circles or rounded squares with a checkmark/ring on selected state).
- Colors should feel on-brand: warm stone tones, deep slate, terracotta, sage green, warm navy — avoid neons or pastels that clash with the app's earthy aesthetic.
- The swatch row should sit between the title field and the tags field in the form.
- Default color if none selected: pick a neutral from the palette (e.g. warm stone).
- Keep the dirty-detection logic (`onDirtyChange`) working correctly — a color change should mark the form as dirty.

**Key Considerations**
- `initialData` in `ListFormSheetProps` needs a `cover_color?: string` field added.
- The `onSubmit` callback's data shape needs `cover_color?: string` added.
- In `sa-list/page.tsx` create handler, thread `data.cover_color` into the `createList` call.
- In `ListManageSheet`, pass `list.cover_color` as `initialData.cover_color` and include `cover_color` in the `updateList` call.
- Store the hex string directly (e.g. `'#c2a47e'`). No need for a color name mapping.

---

## FEATURE 2 — Tag/Tribe Filter Chips in Discover Tab
> Est. 25 min · Requires service + hook + UI changes

**Objective**
Add a horizontal filter chip row to the Discover (발견) tab that lets users filter public lists by tag. The first chip is "전체" (all). Subsequent chips are preset tribe/vibe tags. Selecting a chip re-fetches public lists filtered by that tag.

**Context**
- The Discover tab is in `src/app/sa-list/page.tsx` inside `renderTab()` when `activeTab === '발견'`.
- `usePublicLists(limit)` in `src/hooks/use-lists.ts` calls `getPublicLists(limit, offset)` in `src/lib/lists-service.ts`.
- `getPublicLists` currently takes only `limit` and `offset` — no tag filter exists.
- Lists in the DB have a `tags` column of type `TEXT[]` (Postgres array). Filtering by tag means checking if the array contains the selected tag using Supabase's `.contains('tags', [tag])` filter.
- The `usePublicLists` hook returns `{ data, loading, error }` — it will need to accept an optional `tag` param and re-fetch when it changes.

**Constraints**
- Preset chip tags (hardcode these, do not make them dynamic): `전체`, `목욕`, `사우나`, `찜질`, `데이트`, `혼욕`, `뷰맛집`
- "전체" chip = no tag filter (fetch all public lists as before).
- Chip UI: horizontal scrollable row, pill shape, filled style when active (use `var(--color-primary)`), ghost/outline when inactive. Use `scrollbar-hide` class. Place this row above the featured carousel section.
- The featured/curated split (`is_featured` check) should still work after filtering — filter by tag first, then split the results client-side by `is_featured`.
- Do NOT add server-side pagination for the filtered results — just use `limit: 20` as before.

**Key Considerations**
- Add an optional `tag?: string` parameter to `getPublicLists()`. When `tag` is provided, add `.contains('tags', [tag])` to the Supabase query chain before `.range()`.
- Update `usePublicLists` hook signature to `usePublicLists(limit: number, tag?: string)` and re-run the fetch when `tag` changes (add `tag` to the dependency array or re-key the hook).
- In `sa-list/page.tsx`, add `const [activeTag, setActiveTag] = useState<string>('전체')` and pass `activeTag === '전체' ? undefined : activeTag` to `usePublicLists`.
- The chip row is purely presentational — `TypeTab` component is already used for the 3 main tabs so do not reuse it; build a simple inline chip row instead to avoid style conflicts.

---

## FEATURE 3 — Curator Identity + Subscriber Count on Detail
> Est. 15 min · Pure UI, safest feature

**Objective**
Make the list curator's identity and subscriber count visually prominent on the list detail page so that when a non-owner views a public list, they immediately see who made it and how popular it is — building trust and social proof before they decide to subscribe.

**Context**
- The detail header is in `src/app/sa-list/[id]/sa-list-detail-client.tsx` inside the `<DataState>` block under `<header>`.
- Current state: `@owner_nickname`, place count, and subscriber count are all rendered as a small single line of `text-xs text-stone-400` — visually equivalent weight, hard to scan.
- `list.owner_nickname` and `list.owner_tribe` are available on the `SaList` type (joined from the DB).
- `list.subscriber_count` is in the DB and already fetched — it just needs more visual prominence.
- The subscribe button already exists below the meta row for non-owners.

**Constraints**
- Do NOT redesign the whole header. Only modify the curator meta section (the `<div className="flex items-center gap-3 mt-2 ...">` block and surrounding area).
- Do NOT add a new network call or data fetch — use only what's already on the `list` object.
- Keep the existing logic: `list.owner_nickname` is only shown if present, subscriber count is only shown if `> 0`. The only change: make it `> 0` OR show "첫 번째 구독자가 되어보세요" when 0 (for non-owners only).
- Mobile-first: the curator row should be scannable in under 2 seconds.

**Key Considerations**
- Split the meta into two visual layers: (1) curator identity row — slightly larger, the name as `@nickname` in medium weight with the owner's tribe badge as a colored dot or emoji if `owner_tribe` is available; (2) stats row — `장소 N개 · 구독 N명` in smaller muted text below.
- Subscriber count: make the number itself stand out — e.g. display as `구독자 {N}명` in a slightly heavier weight when `> 0`, rather than buried in a list of equally-weighted strings.
- The visibility badge (공개/링크공유/비공개) already exists for owners — leave it in place, just reorder so curator identity comes before stats.
- The subscribe button position should remain below this block, unchanged.

---

## FEATURE 4 — IG Story Export Card for Lists
> Est. 20–25 min · Highest risk, do last

**Objective**
Add a "Story 공유" button to the list detail page that generates a 1080×1920 PNG card showing the list's identity (title, curator, cover color, top 3 places) and triggers the native share sheet so users can post it to Instagram Stories.

**Context**
- `src/lib/image-export.ts` already has a full Canvas renderer (`renderCard`), `shareImage`, and `downloadImage` utilities. The infrastructure (font loading, canvas sizing at 1080×1920, blob creation, share sheet trigger) is all there.
- The existing `renderCard` is built for a single sauna visit log. A list card needs a completely different layout — add a new exported function `renderListCard(params)` in the same file without modifying the existing `renderCard`.
- `shareList` in `src/lib/share.ts` currently shares a URL — this is different: it shares an image file.
- The "Story 공유" button should appear in the detail header action row (next to the existing share icon), but only when `list.visibility !== 'private'` and `items.length > 0`.

**Constraints**
- Keep the card layout simple — this is a 20-min build, not a full design system. Simple is better than broken.
- Card layout (1080×1920, all coordinates at 2x density): solid `cover_color` background (fall back to `'#6b7280'` if null). Top section: list title in large bold Oswald, curator `@nickname` below it. Middle section: numbered list of top 3 place names (from `items`, up to 3, each on its own line). Bottom footer: `SA-LIST` on left, app name `SA-PI SAUNA` on right, both in small muted white.
- Reuse the existing helper functions already in `image-export.ts`: `loadImage`, `setLetterSpacing`, `setShadow`, the `W`, `H`, `PX`, `PY` constants, and the font loading pattern (`await document.fonts.ready`).
- Text colors: all white. Use `rgba(255,255,255,0.7)` for secondary text (curator name, footer).
- Do NOT import any new libraries.
- If `navigator.share` is unavailable (desktop), fall back to `downloadImage` — this is already handled inside `shareImage`.

**Key Considerations**
- `renderListCard` params should be: `{ title: string, ownerNickname?: string, coverColor?: string | null, placeNames: string[] }`.
- In `sa-list-detail-client.tsx`, derive `placeNames` as `items.slice(0, 3).filter(i => i.place).map(i => i.place!.name)` — no new data fetch needed.
- Add a `useState<boolean>` for `sharing` to show a loading state on the button while the canvas renders (it takes ~300–500ms).
- The button should use the `share` Material Symbol icon, placed in the header action row alongside the existing share button. Label it as a text button `Story` or just use the icon — keep it lightweight.
- Wrap the `renderListCard` + `shareImage` call in a try/catch and show `showError('공유에 실패했어요')` on failure.
- Test consideration: on desktop where `navigator.share` is unavailable, the image will download instead — this is acceptable and already handled by `shareImage`.
