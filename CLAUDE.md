# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Map Reviews Timelineは、Google Maps上で表示している範囲内のスポットの口コミを、X（旧Twitter）風のタイムラインUIで一覧表示するWebアプリケーションです。バックエンドを持たず、完全にフロントエンドのみで動作します。

## Technology Stack

- **Frontend**: Vanilla JavaScript (No frameworks)
- **APIs**:
  - Google Maps JavaScript API
  - Google Places API (New)
- **Storage**: localStorage (for API key persistence)
- **Styling**: Pure CSS with X-inspired dark theme

## Architecture

### File Structure

```
map-reviews-timeline/
├── index.html      # Main HTML structure
├── style.css       # X-style dark theme CSS
├── app.js          # Core application logic
├── README.md       # Japanese setup guide
└── CLAUDE.md       # This file
```

### Key Components

#### 1. API Key Management (`app.js`)
- API keys are stored in localStorage
- Modal UI for initial setup and configuration
- Keys are validated on Google Maps script load

#### 2. Map Integration (`app.js`)
- Initialized via `initMap()` function
- Default center: Tokyo Station (35.6812, 139.7671)
- Dark theme map styling
- Uses `google.maps.places.PlacesService` for API calls

#### 3. Review Fetching Flow (`app.js`)
```
User clicks "Get Reviews" button
  → Get current map bounds
  → Nearby Search API (max 20 places)
  → For each place:
      → Place Details API (with reviews field)
      → Extract up to 5 reviews per place
  → Combine all reviews into timeline
  → Sort and display
```

#### 4. Timeline UI (`index.html`, `style.css`)
- X-style review cards
- Displays: author, rating (stars), text, timestamp, place name
- Infinite scroll layout
- Sort options: newest/oldest/highest/lowest rating

### API Constraints

**Critical limitations to be aware of:**
- Google Places API returns maximum 5 reviews per place
- Nearby Search radius limited to 5,000m
- App limits to 20 places per search to control API costs
- No pagination - single batch fetch only

### Data Flow

```
localStorage (API Key)
  ↓
Google Maps Script Load
  ↓
Map Initialization
  ↓
User Action (Search Button)
  ↓
Nearby Search (bounds → places[])
  ↓
Place Details (placeId → reviews[])
  ↓
Review Aggregation (allReviews[])
  ↓
Sort & Display (Timeline DOM)
```

### Important Functions

- `loadGoogleMapsScript()`: Dynamically loads Google Maps API
- `searchReviews()`: Main orchestrator for review fetching
- `searchNearbyPlaces()`: Wraps Places Nearby Search API
- `getPlaceDetails()`: Wraps Place Details API
- `createReviewCard()`: Generates review card HTML
- `sortAndDisplayReviews()`: Handles sorting logic

## Development Commands

### Local Development

This app requires a local server (Google Maps API doesn't work with `file://` protocol):

```bash
# Using Python
python -m http.server 8000

# Using Node.js http-server
npx http-server -p 8000

# Using VS Code Live Server extension
Right-click index.html → "Open with Live Server"
```

### Testing

Since this is vanilla JS without build tools:
- Test manually by opening in browser
- Check browser console for API errors
- Monitor Network tab for API requests/responses

## Common Development Tasks

### Modifying Map Styles

Map styles are defined in `initMap()` function in app.js. The current dark theme uses:
- Background: `#242f3e`
- Water: `#17263c`
- Text fill: `#746855`

### Changing Review Card Layout

Review cards are generated in `createReviewCard()` function. The structure follows:
```
.review-card
  └── .review-header
      ├── .avatar
      └── .review-meta
  └── .review-body
      ├── .place-info
      ├── .rating
      └── .review-text
```

### Adding New Sort Options

1. Add option to `<select id="sortSelect">` in index.html
2. Add case to switch statement in `sortAndDisplayReviews()` in app.js

### Adjusting Search Parameters

In `searchReviews()` function:
- `totalPlaces`: Currently set to `Math.min(places.length, 20)`
- Can be increased but will increase API costs proportionally

## Security Considerations

- API keys are stored in localStorage (browser-side only)
- No server-side validation or proxy
- Users must secure their own API keys
- API key restrictions should be configured in Google Cloud Console

## API Cost Management

Each search operation costs:
- 1 Nearby Search request
- N Place Details requests (where N ≤ 20)

Fields requested in Place Details:
- `name` - Basic Data
- `reviews` - Contact Data (more expensive)
- `types` - Basic Data
- `geometry` - Basic Data

**To reduce costs:**
- Limit `totalPlaces` in `searchReviews()`
- Remove fields from `getPlaceDetails()` request
- Implement caching (not currently implemented)

## Known Limitations

1. **5 reviews per place**: Google API limitation
2. **No review pagination**: API doesn't support it
3. **No real-time updates**: Static snapshot of reviews
4. **No review filtering**: Can't filter by keywords, date range, etc.
5. **No place markers**: Map doesn't show searched places (potential enhancement)

## Future Enhancement Ideas

- Add place markers on map with click-to-highlight
- Implement review text search/filter
- Cache results in localStorage to reduce API calls
- Export reviews to CSV/JSON
- Add review sentiment analysis
- Implement place type filtering
