# Sauna Playlist Feature Research & Action Plan

## 1. Market Research: Curation Services Analysis

To build a killer "Sauna Playlist" feature, we analyzed 5 leading curation platforms:

1. **Belli (Place Curation)**
   - **Core Functions**: Map-first visual curation, emoji markers, collaborative lists.
   - **UI Features**: Clean, minimalist cards, seamless Instagram Story sharing, short curator notes per place.
2. **Spotify (Music Curation)**
   - **Core Functions**: Custom cover art, descriptions, follower counts, collaborative playlists.
   - **UI Features**: Prominent "Play/Shuffle" (action) button, dark/immersive UI, visual grid of album art.
3. **Letterboxd (Movie Curation)**
   - **Core Functions**: Highly opinionated/niche lists (e.g., "Saunas that feel like a warm hug"), ranked vs. unranked lists.
   - **UI Features**: Dense visual grid of posters, comments section, clear curator identity.
4. **Pinterest (Visual Curation)**
   - **Core Functions**: Boards with sub-sections, ubiquitous "Save/Pin" button.
   - **UI Features**: Masonry layout, highly visual, focus on inspiration over pure utility.
5. **Yelp Collections (Local Curation)**
   - **Core Functions**: Map/List toggle, brief curator notes per location.
   - **UI Features**: Utilitarian, focus on ratings and distance, easy to bookmark.

---

## 2. Feature Evaluation & Suitability

### Additional Aspects to Consider (Pre-Evaluation)
Before evaluating, consider these aspects specific to *Sauna Curation*:
- **Spatial Context**: Saunas are physical. Users need to know *where* they are instantly.
- **Vibe/Atmosphere**: Saunas are experiential. Visuals (emojis, cover photos) matter more than text.
- **Trust**: Personal recommendations ("Why I love this place") are the main value driver.

### Feature Evaluation

| Feature | a. Must Have? | b. Suitability for Sauna | c. Contribution (Quality, Discovery, Shareability, Ease) |
| :--- | :--- | :--- | :--- |
| **Curator Notes per Place** (Belli, Yelp) | **Yes** | **High**: Explains *why* it's on the list (e.g., "Best cold plunge"). | Quality: High / Discovery: Med / Shareability: Med |
| **Map/List Toggle** (Yelp, Belli) | **Yes** | **High**: Crucial for planning a sauna trip. | Ease of Use: High / Discovery: High |
| **Custom Cover Art / Emojis** (Spotify) | **Yes** | **High**: Sets the "vibe" of the playlist. | Shareability: High / Quality: High |
| **IG Story Export** (Spotify, Belli) | **Yes** | **Perfect**: Aligns with your PWA goal. | Shareability: Maximum |
| **Collaborative Lists** (Spotify) | No (Time constraint) | Medium: Good for couples/friends. | Shareability: High, but too complex for 3 hours. |
| **Ranked Lists** (Letterboxd) | No | Low: Saunas are often mood-dependent, not strictly ranked. | Quality: Med / Ease of Use: Low |

---

## 3. Codebase Evaluation & 3-Hour Action Plan

### Current Codebase State
- You already have the foundation: `SaListPage` with 3 tabs (My Lists, Subscribed, Discover), `CoverCard`, list creation (`ListFormSheet`), and a detail view (`sa-list-detail-client.tsx`).
- You also have an `image-export.ts` utility.

### Prioritized Action Plan (for the next 3 hours)
Focus *only* on features that look great in an 8-slide presentation and demo video.

**Priority 1: "The Vibe" - Custom Covers & Emojis (30 mins)**
- **Action**: Update `ListFormSheet` to allow users to pick an emoji or a gradient background for their list cover (like Spotify covers).
- **Impact**: Makes the "Discover" tab visually stunning for the demo.

**Priority 2: "The Trust" - Curator Notes (45 mins)**
- **Action**: In `sa-list-detail-client.tsx`, add a small text field under each sauna where the creator can write a 1-line note (e.g., "Go on Tuesday mornings").
- **Impact**: Elevates the list from a generic bookmark folder to a *curated playlist*.

**Priority 3: "The Utility" - Map View Toggle (45 mins)**
- **Action**: Add a floating action button (FAB) in `sa-list-detail-client.tsx` that flips the view from a list of cards to a Map showing all saunas in that playlist.
- **Impact**: Huge "wow" factor for the demo video. Shows real utility.

**Priority 4: "The Viral Loop" - IG Story Export Card (60 mins)**
- **Action**: Hook up your existing `image-export.ts` to a "Share to IG" button on the playlist detail page. Generate a beautiful vertical card showing the List Title, Curator Name, and top 3 saunas.
- **Impact**: Directly answers your project goal (Instagram Story sharing PWA). Perfect for the final slide of your presentation.

### Presentation Flow Suggestion (15 secs per slide)
1. **Problem**: Finding good saunas is hard; generic maps lack "vibe".
2. **Solution**: Sauna Playlists - Curated by enthusiasts.
3. **Demo 1**: Browsing the "Discover" tab (Show custom covers).
4. **Demo 2**: Viewing a playlist (Show Curator Notes).
5. **Demo 3**: Map Toggle (Show spatial utility).
6. **Demo 4**: Sharing to IG Story (Show the export card).
7. **Tech Stack**: Next.js, Supabase, PWA.
8. **Vision**: The ultimate social utility for wellness.