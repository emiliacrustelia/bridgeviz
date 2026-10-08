# bridgeviz

Proof-of-concept map of event locations using Mapbox GL JS + TypeScript (Vite, no framework).

## Setup

```sh
npm install
cp .env.example .env.local   # then paste your public Mapbox token (pk.…)
npm run dev
```

## Structure

- `src/data/locations.json` – hard-coded locations; each has a full street `address`, and optionally
  `coordinates` (`[lng, lat]`) for spots without a usable address
- `src/data/geocode.ts` – turns addresses into map positions via the Mapbox Geocoding API (v6)
- `src/config.ts` – map region; also biases address lookups toward that area
- `src/data/eventsService.ts` – `getLocations()`; the only place that knows where data comes from
- `src/types.ts` – `EventLocation`, the per-pin data contract
- `src/map.ts` – map setup, clustered pin layers, click/hover handling
- `src/ui/detailPanel.ts` – side panel (bottom sheet on mobile) showing a location's data

## Moving to an API

Replace the JSON import in `getLocations()` with a `fetch` call. The endpoint should return an array
of objects matching `LocationRecord` in `src/types.ts`.

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
