# Sauna Playlist — Hackathon Research & Action Plan
> Generated: 2026-04-04 | 3-hour sprint

---

## PART 1 — Market Research

### 1-A. Beli (Place Ranking App)
**Core mechanic**: Comparative scoring from actual visits. Every rating auto-populates your ranked list — no manual curation friction.

| Feature | Detail |
|---|---|
| Ranked lists | Ordered by personal score, not manual drag |
| Visit tracking | "Want to try" vs "visited" distinction |
| Labels / tags | Ambience labels (date night, casual, etc.) |
| Taste Match | % compatibility with a friend's palate |
| Friend feed | See what friends just rated |
| Leaderboards | City + global rankings |
| Recommendations | "Your Top 10 Italian" auto-generated |
| Notes + photos | Per-place rich entry |

**Key UI insight**: The list IS the ranking. Authenticity comes from "been there" signals — the curator's history is the product, not a manually built collection.

---

### 1-B. Spotify (Playlist Curation)
**Core mechanic**: Ordered sequence as identity expression. The playlist is personal branding.

| Feature | Detail |
|---|---|
| Custom cover art | Upload image or emoji-based visual |
| Collaborative playlist | Invite friends to add / remove / reorder |
| Subscriber / follower count | Visible social proof on every playlist |
| Blend | Merge two people's taste into one playlist |
| Share link | Anyone with link can view — no account needed |
| Smart Filters | Auto-filter library by mood / genre / activity |
| Playlist description | Editorial context paragraph |
| Prominent action button | "Play / Shuffle" is the CTA, not the title |

**Key UI insight**: Cover image + title = the creator's brand. Curators become influencers through visual identity. The prominent action button drives first engagement.

---

### 1-C. Letterboxd (Film List Curation)
**Core mechanic**: Thematic editorial lists. A list has a narrative — it's about a topic, not just a collection.

| Feature | Detail |
|---|---|
| Public / unlisted / private | Three-tier visibility |
| Editorial description | Intro paragraph sets the list's intent |
| Clone list (Pro) | Fork another user's list as your starting point |
| Featured lists hub | Editor-curated discovery page |
| No-login public view | Shareable URL anyone can read |
| Ranked vs unranked toggle | List can be ordered or just grouped |
| Curator identity header | Avatar + name prominent at top of every list |
| Niche list names | "Saunas that feel like a warm hug" — personality over utility |

**Key UI insight**: The list name + description tells a story. Discoverability is editorial (featured), not algorithmic. Curator identity is front and center — the person is the brand.

---

### 1-D. Pinterest (Visual Board Curation)
**Core mechanic**: Visual inspiration boards with sub-sections. Save/Pin is ubiquitous — frictionless capture from anywhere on the web.

| Feature | Detail |
|---|---|
| Masonry visual grid | Dense image grid over list view |
| Boards with sub-sections | One board can span multiple moods / neighborhoods |
| One-tap Save / Pin | Ubiquitous across the whole platform |
| Atmosphere over utility | Discovery is about feeling, not planning |

**Key UI insight**: Visual density matters. A grid of place images is more inspiring than a list of names. Sub-sections let one list hold multidimensional curation.

---

### 1-E. Yelp Collections + Corner + North (Place List Apps)
**Core mechanic**: Place lists with real spatial utility — built around maps and local context.

| Feature | Detail |
|---|---|
| Map / List toggle | Flip between card list and pin map on any list |
| Curator note per place | Short "why it's here" text on each entry |
| Distance + ratings inline | Utility info without leaving the list |
| Vibe-first list creation | Corner: "Date spots," "Hidden gems," "Outdoor therapy" |
| Follow curators (not just lists) | Corner: subscribe to a person's taste |
| Publish as interactive map | North: shareable link opens a web map — no app download needed |
| Collaborative invite | North: add editors via link / AirDrop / text |

**Key UI insight**: For place apps, the MAP is the power view — it answers "where do I go next?" instantly. Non-login map sharing is the acquisition funnel. Mood / vibe is the discovery entry point, not category.

---

## PART 2 — Evaluation Dimensions

### The 4 Given
1. **Curation quality** — Does it help make better, more opinionated lists?
2. **Discoverability** — Does it help users find new lists / places?
3. **Shareability** — Does it make sharing natural and viral?
4. **Ease of use** — Low friction to create and maintain?

### 3 Additional Dimensions for Sauna Context
Before evaluating features, the sauna use case demands 3 extra dimensions that general platforms don't surface:

5. **Authenticity signal** — Does the feature confirm the curator has actually been there? Sauna recommendations live or die on firsthand trust.
6. **Tribe alignment** — Does it support 목욕파 / 사우너파 / 찜질파 context? This is the app's core differentiator — no other platform does this.
7. **Spatial / experiential richness** — Does it communicate *where* and *what it feels like*? Saunas are physical and atmospheric. A lat/lng + a vibe description are both essential.

---

## PART 3 — Feature Evaluation Matrix

Scoring: ✅ Strong | 🟡 Medium | ❌ Weak

| # | Feature | Source | Must-Have? | Sauna Suitability | Curation Quality | Discoverability | Shareability | Ease of Use | Authenticity | Tribe | Spatial/Vibe |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Cover color + emoji picker** | Spotify, existing model | ✅ Yes | ✅ High | 🟡 | 🟡 | ✅ | ✅ | ❌ | 🟡 | ✅ |
| 2 | **List description / editorial intro** | Letterboxd, existing | ✅ Yes | ✅ High | ✅ | 🟡 | 🟡 | 🟡 | ❌ | 🟡 | ✅ |
| 3 | **Tags / vibe labels** | Beli, Corner, existing | ✅ Yes | ✅ Very high | ✅ | ✅ | 🟡 | ✅ | ❌ | ✅ | ✅ |
| 4 | **Per-place memo / curator note** | Beli, Yelp, existing | ✅ Yes | ✅ Essential | ✅ | ❌ | 🟡 | 🟡 | ✅ | ❌ | ✅ |
| 5 | **Map / List toggle on detail** | Yelp, North, Corner | ✅ Yes | ✅✅ Critical | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅✅ |
| 6 | **IG Story export card** | Spotify, existing util | ✅ Yes | ✅✅ Perfect fit | ❌ | ✅ | ✅✅ | ✅ | ❌ | ✅ | ✅ |
| 7 | **Drag-to-reorder list items** | Spotify | ✅ Yes | ✅ High | ✅ | ❌ | ❌ | 🟡 | 🟡 | ❌ | ❌ |
| 8 | **Clone / fork a list** | Letterboxd | ✅ Yes | ✅ High | 🟡 | ✅ | ✅✅ | ✅ | ❌ | 🟡 | ❌ |
| 9 | **Curator identity display on detail** | Letterboxd | ✅ Yes | ✅ High | ✅ | 🟡 | ✅ | ✅ | ✅ | 🟡 | ❌ |
| 10 | **Subscriber count prominent** | Spotify, existing DB | ✅ Yes | ✅ High | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 11 | **Tribe / tag filter in Discover** | app-specific | ✅ Yes | ✅✅ Core differentiator | ❌ | ✅✅ | ❌ | ✅ | ❌ | ✅✅ | ❌ |
| 12 | **Infinite scroll in Discover** | existing gap | ✅ Yes | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| 13 | **No-login public view (existing slug)** | Letterboxd, North | ✅ Yes | ✅ | ❌ | ✅ | ✅✅ | ✅ | ❌ | ❌ | ❌ |
| 14 | **Visit status badge per item** | Beli, North | 🟡 Nice | ✅ High | ✅ | ❌ | 🟡 | ✅ | ✅✅ | ❌ | ❌ |
| 15 | **Sub-sections within a list** | Pinterest | ❌ Later | 🟡 Medium | ✅ | ❌ | ❌ | 🟡 | ❌ | 🟡 | ❌ |
| 16 | **Collaborative list editing** | Spotify | ❌ Later | 🟡 Medium | ❌ | ❌ | 🟡 | ❌ | ❌ | ❌ | ❌ |
| 17 | **Taste match / Blend** | Spotify, Beli | ❌ Later | 🟡 Medium | ❌ | 🟡 | ✅ | ❌ | ❌ | 🟡 | ❌ |
| 18 | **Ranked score (auto-order)** | Beli | ❌ Skip | 🟡 | 🟡 | ❌ | ❌ | ❌ | 🟡 | ❌ | ❌ |

---

## PART 4 — Prioritized Action Plan (3-Hour Sprint)

### Tier 0 — Already Working (show in demo, zero build time)
- Create / edit list, visibility (private / unlisted / public) ✓
- Tags + description ✓
- Per-place memo (curator note) ✓ — **already built, just demo it**
- Subscribe / unsubscribe + subscriber count in DB ✓
- Discover tab with featured carousel ✓
- Share URL via slug ✓
- `image-export.ts` utility exists ✓

### Tier 1 — Build NOW (highest demo impact, achievable in 3h)

| Priority | Feature | Why | Est. Time |
|---|---|---|---|
| 🥇 1 | **Cover color picker in ListFormSheet** | `cover_color` already in model + `CoverCard`. Add a color swatch grid. Instant visual identity — maximum demo pop for minimum effort. | 20 min |
| 🥇 2 | **Map / List toggle on detail page** | FAB button. Pass `place.lat/lng` from list items to existing map component. Highest spatial/vibe score. The "wow" moment in the demo. | 45 min |
| 🥇 3 | **IG Story export card** | Hook `image-export.ts` to a "Share to Story" button. Card: list title + curator + top 3 places + cover color bg. Core PWA goal. `image-export.ts` already exists — effort is lower than it looks. | 50 min |
| 🥈 4 | **Tribe / tag filter chips in Discover** | One filter chip row above list grid. Filter `getPublicLists` by tag. App's core differentiator — nobody else has this. | 25 min |
| 🥈 5 | **Curator identity + subscriber count on detail** | Move owner avatar/nickname to list header. Surface subscriber count prominently. Already in DB — just needs UI. | 15 min |
| 🥈 6 | **Clone / fork a list** | "Save as my list" button. DB: copy list row + all items with new `owner_id`. Redirect to new list. Highest shareability + viral mechanic. | 30 min |

**Total: ~3h05min** — trim #6 if needed; highest complexity but strongest virality.

### Tier 2 — If time permits
- Drag-to-reorder list items (adds curation intentionality, good for polish)
- Infinite scroll in Discover (pagination already in service layer — one hook change)
- Visit status badge on items (authenticity signal, backfill from existing log data)

---

## Presentation Talking Points (8 slides × 15s)

1. **Problem** — Finding great saunas is word-of-mouth chaos. Maps have no vibe.
2. **Insight** — Letterboxd for saunas: curated, opinionated, personal.
3. **Demo: Discover tab** — Tribe-filtered list grid with beautiful custom covers.
4. **Demo: List detail** — Curator notes per place + map toggle.
5. **Demo: Map view** — All your sauna picks on one map, instantly.
6. **Demo: IG Story export** — One tap → shareable story card.
7. **Viral loop** — Clone a list, subscribe, follow curators.
8. **Vision** — The Spotify of Korean sauna culture. Curators, not just bookmarks.

---

## Key Decision: What Makes This Different from Google Maps Lists

| Google Maps Lists | Sauna Playlist |
|---|---|
| Bookmark dump, no order | Curated, opinionated, reorderable |
| No personality | Cover color + tribe identity |
| Share = dead link | Share = follow a curator |
| No context per place | Curator notes ("go Tuesday morning") |
| Generic algorithm | Tribe-filtered discovery |
| No export | IG Story card, one tap |
