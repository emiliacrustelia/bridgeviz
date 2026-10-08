# bridgeviz

Proof-of-concept map of event locations using Mapbox GL JS + TypeScript (Vite, no framework).

## Setup

```sh
npm install
cp .env.example .env.local   # then paste your public Mapbox token (pk.…)
npm run dev
npm test                     # unit tests for search/filter logic
```

## Structure

- `src/data/locations.json` – hard-coded locations; each has a full street `address`, and optionally
  `coordinates` (`[lng, lat]`) for spots without a usable address
- `src/data/query.ts` – `LocationQuery` (search, statuses, date range) and the filter logic
- `src/data/repository.ts` – `LocationsRepository` interface; the only way the UI gets data
- `src/data/staticRepository.ts` – PoC implementation: geocodes once, filters in the browser
- `src/data/geocode.ts` – turns addresses into map positions via the Mapbox Geocoding API (v6)
- `src/state.ts` / `src/actions.ts` – shared app state (query, results, selection, panel) and the
  actions that change it; UI modules subscribe to the store and never call each other directly
- `src/map.ts` – map setup, clustered pin layers kept in sync with the filtered results
- `src/ui/panel.ts`, `listView.ts`, `detailView.ts` – side panel: list with filters, detail view
- `src/config.ts` – map region; also biases address lookups toward that area

## Search and filters

- **Search** matches the location name (case-insensitive).
- **Status** checkboxes; with both checked no status filter is applied.
- **Date range** (inclusive) matches when the last *or* next event date falls in the range;
  locations with neither date are hidden while a range is set.
- Filters apply to both the table and the map pins. The visible map area never filters the table.
- The **Area** filter is shown disabled as a placeholder.

## Moving to an API

Add an `HttpLocationsRepository` implementing `LocationsRepository` and use it in `src/main.ts`
instead of `StaticLocationsRepository`. `LocationQuery` maps directly to query parameters:

```
GET    /api/locations?search=park&status=active&from=2026-10-01&to=2026-10-31   → LocationRecord[]
GET    /api/locations/:id                                                         → LocationRecord
POST   /api/locations            (planned CRUDL)
PUT    /api/locations/:id        (planned CRUDL)
DELETE /api/locations/:id        (planned CRUDL)
```

Records match `LocationRecord` in `src/types.ts`; dates are `YYYY-MM-DD`.

Addresses are currently geocoded in the browser on every page load (one API request per location).
That's fine for a PoC, but with a database the backend should geocode once when a location is saved
and store the coordinates. Note that Mapbox's terms only allow storing results from its *permanent*
geocoding mode, which is billed separately.

## Deploying to GitHub Pages

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site and publishes `dist/`
to https://emiliacrustelia.github.io/bridgeviz/.

One-time setup in the GitHub repo:

1. **Settings → Pages → Build and deployment → Source:** select **GitHub Actions**.
2. **Settings → Secrets and variables → Actions → New repository secret:** name `MAPBOX_TOKEN`,
   value = your public `pk.…` token.
3. In the Mapbox account, add `https://emiliacrustelia.github.io` to the token's allowed URLs.

Note: a public Mapbox token is always visible in the built JavaScript; the URL restriction is what protects it.
