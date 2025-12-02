# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Map Reviews Timeline is a web application that displays Google Maps reviews in an X (Twitter)-style timeline UI. Users can select a map area and fetch reviews from nearby places, displaying them in a sortable timeline interface with interactive map markers.

**Key Features:**
- Light/Dark mode theme switching with localStorage persistence
- Fully responsive design (mobile, tablet, desktop)
- Interactive markers with scroll-to-review functionality
- Place search with Text Search API (New)
- Compact review cards without avatars for efficient display

**Key Technologies:**
- TypeScript + Vite (fast HMR development)
- Google Maps JavaScript API + Places API (New)
- Biome for linting/formatting (Rust-based, replaces ESLint/Prettier)
- Advanced Markers with MarkerClusterer for map pins
- Vanilla TypeScript (no framework dependencies)

## Development Commands

```bash
# Development
npm run dev              # Start dev server at http://localhost:8000

# Build & Preview
npm run build            # TypeScript compile + Vite production build
npm run preview          # Preview production build

# Code Quality
npm run check            # Lint + format check (run before commits)
npm run check:fix        # Auto-fix lint and format issues
npm run lint             # Lint only
npm run format           # Format only

# Type Checking
npx tsc --noEmit         # Type check without emitting files
```

## Environment Setup

**Required:** Set `VITE_GOOGLE_MAPS_API_KEY` environment variable with a valid Google Maps API key.

```bash
# Development
VITE_GOOGLE_MAPS_API_KEY="your_key" npm run dev

# Or export in shell
export VITE_GOOGLE_MAPS_API_KEY="your_key"
```

**API Key Priority:**
- Environment variable (`VITE_GOOGLE_MAPS_API_KEY`) takes priority if set
- Falls back to localStorage (`googleMapsApiKey`) if environment variable is not set
- Settings button is hidden when environment variable is present

**Required Google Cloud APIs:**
- Maps JavaScript API
- Places API (New) - NOT the legacy Places API

## Architecture Overview

### Service Layer Pattern

The codebase uses a **service-based architecture** with most orchestration in `app.ts`:

```
┌─────────────┐
│   app.ts    │  Entry point - handles most UI logic and orchestration
└──────┬──────┘
       │
       ├──────────────────────┐
       │                      │
   ┌───▼────────┐        ┌────▼──────────┐
   │  Services  │        │   Managers    │  (Available but currently unused)
   └────────────┘        └───────────────┘
       │                      │
       ├── PlacesService      ├── UIManager        (DOM references)
       ├── MarkerService      └── ReviewManager    (Sorting logic)
       ├── MapService
       └── StorageService     (Available but unused)
```

**Note:** While the architecture supports service/manager separation, the current implementation centralizes most logic in `app.ts` for simplicity. Managers and some services exist but are not actively used.

### Key Architectural Decisions

1. **Places API (New) Integration**
   - Uses the NEW Places API (not legacy)
   - **Nearby Search:** `fields: ['id', 'displayName', 'formattedAddress', 'location', 'types']`
   - **Place Details:** `fields: ['displayName', 'reviews', 'types', 'location']`
   - **Text Search:** `fields: ['displayName', 'formattedAddress', 'location']` for place name search
   - Parallel fetching with `Promise.allSettled` for performance
   - Maximum 5 reviews per place (API limitation)
   - Maximum 20 places per search (app limitation)

2. **Advanced Markers with Clustering**
   - Uses `google.maps.marker.AdvancedMarkerElement` (requires `mapId`)
   - Color-coded by rating: green (4-5★), yellow (3★), red (1-2★)
   - `@googlemaps/markerclusterer` for grouping markers when zoomed out
   - Marker click → scroll to review card with highlight animation

3. **No Framework/Library Dependencies**
   - Pure TypeScript with vanilla DOM manipulation
   - No React/Vue/Angular - keeps bundle small and fast
   - Direct event listeners and manual DOM updates

4. **Google Maps Script Loading**
   - Must include `libraries=places,geometry,marker` in script URL
   - `mapId: 'DEMO_MAP_ID'` required for Advanced Markers
   - Async/defer script loading with error handling

### Data Flow

```
User Action (Click "Get Reviews")
    ↓
searchReviews() in app.ts
    ↓
PlacesService.searchNearbyPlaces()  → Fetch places in bounds
    ↓
PlacesService.getPlaceDetails()     → Parallel fetch (Promise.allSettled)
    ↓
Build Review[] array with placeLocation
    ↓
sortAndDisplayReviews()             → Sort and render cards
    ↓
MarkerService.createMarkersFromReviews()  → Create map markers
    ↓
User clicks marker → scrollToReviewCard() → Highlight + scroll
```

### Important Type Definitions

**Review Interface** (`src/types/index.ts`):
```typescript
interface Review {
  author_name: string;
  profile_photo_url?: string;
  rating: number;
  text: string;
  time: number;              // Unix timestamp in seconds
  placeName?: string;
  placeTypes?: string[];
  placeLocation?: google.maps.LatLng;  // Critical for markers
}
```

**PlaceDetailsResult Interface**:
- Adapter pattern between Places API (New) response and app's Review format
- Handles New API field names: `displayName`, `authorAttribution`, `publishTime`

## Critical Implementation Details

### Places API (New) Field Access

The New Places API has different field names than legacy:
- ✅ `place.displayName` (not `name`)
- ✅ `review.authorAttribution.displayName` (not `author_name`)
- ✅ `review.text.text` or `review.text` (text can be object or string)
- ✅ `review.publishTime.seconds` (not `time`)
- ✅ `place.location` (not `geometry.location`)

### Advanced Marker Requirements

1. Map must have `mapId` property set (can be 'DEMO_MAP_ID' for dev)
2. Load marker library: `libraries=places,geometry,marker`
3. Use `google.maps.marker.AdvancedMarkerElement` (not legacy `Marker`)
4. PinElement for custom colors: `new google.maps.marker.PinElement({ background, borderColor, glyphColor })`

### Marker-Review Linking

- Each review card gets unique ID: `review-${btoa(encodeURIComponent(placeName-time))}`
  - Uses `encodeURIComponent` before `btoa` to handle Japanese characters safely
  - Removes `=` padding characters from base64 string
- `MarkerService` maintains `Map<AdvancedMarkerElement, Review>` for lookup
- Click handler: `marker.addListener('click', () => onMarkerClick(review))`
- Scroll + highlight animation on card when marker clicked

### Place Search (Text Search API)

- Uses Places API (New) Text Search: `Place.searchByText()`
- Searches by text query (地名や住所)
- Retrieves first result and centers map on location
- Uses `maxResultCount: 1` to limit API costs

## UI/UX Design Patterns

### Theme Switching

- **Light/Dark Mode Toggle**: Sun (☀️) and Moon (🌙) emoji button in map search bar
- **Theme Persistence**: Saved to localStorage as 'theme' key ('dark' or 'light')
- **CSS Implementation**: Body classes `.dark-mode` and `.light-mode`
- **Color Scheme**:
  - Dark: Black backgrounds (#000000, #16181c), light text (#e7e9ea)
  - Light: White backgrounds (#ffffff, #f7f9f9), dark text (#0f1419)
- **Default**: Dark mode (matches X/Twitter style)

### Responsive Design

- **Breakpoints**:
  - Desktop: Default (full width)
  - Tablet: ≤1024px (map 50vh, vertical split)
  - Mobile: ≤640px (map 45vh, compact layout)
- **Mobile Optimizations**:
  - Search bar wraps on small screens
  - Buttons full-width on mobile
  - Font sizes reduced (14px → 13-14px)
  - Map controls stack vertically
  - Compact review cards without avatars

### Review Card Design

- **No Avatars**: Display name and time only (compact layout)
- **Inline Metadata**: "Name · Time" format with middle dot separator
- **Text Overflow**: Long names ellipsized (`text-overflow: ellipsis`)
- **Click Actions**:
  - Place name → Pan map to location
  - Card highlight on marker click

## Terminology Standards

**IMPORTANT:** Use Japanese katakana "クチコミ" (not "口コミ") throughout:
- UI text: "この範囲のクチコミを取得"
- Comments: "クチコミを取得"
- Error messages: "クチコミが見つかりませんでした"

Other standard terms:
- "評価" for rating
- "スポット" for place
- "タイムライン" for timeline

## Biome Configuration

**Biome replaces both ESLint and Prettier:**
- Configured in `biome.json`
- 2-space indentation, 100 char line width
- Single quotes, ES5 trailing commas
- `noExplicitAny` set to "warn" (allowed but discouraged)
- `noForEach` disabled (forEach is allowed)

**Run `npm run check` before every commit.**

## WSL2 Optimization

The Vite config is optimized for WSL2 development:
- `host: true` - Listen on all network interfaces
- `usePolling: true` - File watching via polling (100ms interval)
- `strictPort: false` - Try alternative ports if 8000 is busy
- `open: false` - Don't auto-open browser (manual open on Windows)

If HMR isn't working in WSL2, these settings should fix it.

## Common Development Patterns

### Service vs Manager Separation

- **Services** (`src/services/`): API calls, external integrations, data processing
  - `MapService`: Map initialization and theme (currently minimal, most logic in app.ts)
  - `PlacesService`: Places API (New) integration - nearby search, details, text search
  - `MarkerService`: Advanced Markers creation, clustering, click handling
  - `StorageService`: localStorage wrapper (available but currently unused)
- **Managers** (`src/managers/`): DOM manipulation, UI state, event handling
  - `UIManager`: DOM element references and UI state (available but currently unused)
  - `ReviewManager`: Review sorting and display logic (available but currently unused)
- **Current Architecture**: Most logic is in `app.ts` for simplicity
  - Services are instantiated but managers are not currently used
  - Direct DOM manipulation in `app.ts` rather than through UIManager
  - Future refactor could consolidate into managers for better separation

### Review Display

Review rendering happens in `app.ts` → `createReviewCard()` function. The `ReviewManager` has an unused `createReviewCard()` method that could be used for consolidation in future refactoring.

### Error Handling

- Use `try/catch` with `Promise.allSettled` for parallel API requests
- Show user-friendly errors via `showError()` function (Japanese messages)
- Log detailed errors to console for debugging
- Never expose API keys or sensitive data in error messages

## API Considerations

**Rate Limits:**
- Places API (New) charges by field
- App fetches: displayName, reviews, types, location
- Max 20 places × 5 reviews = 100 reviews per search
- Consider caching results to reduce API calls

**Cost Optimization:**
- Google Maps Platform has $200/month free tier
- Monitor usage in Google Cloud Console
- Set budget alerts to avoid surprises
- Narrow search radius to reduce place count

## Debugging Tips

**Map not showing:**
- Check `VITE_GOOGLE_MAPS_API_KEY` is set
- Verify Maps JavaScript API is enabled in Google Cloud
- Check browser console for API key errors

**No reviews loading:**
- Verify Places API (NEW) is enabled (not legacy)
- Check `fields` array includes required fields
- Ensure map bounds contain actual places
- Look for `PERMISSION_DENIED` in console

**Markers not appearing:**
- Verify `mapId` is set in map options
- Check `marker` library is loaded in script URL
- Ensure reviews have `placeLocation` property set
- Console log `markerService.getMarkerCount()` to verify creation

**HMR not working (WSL2):**
- Vite config already has `usePolling: true`
- Try `npm run dev` again
- Check file permissions in WSL2
