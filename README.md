# bridgeviz

Proof-of-concept map of event locations using Mapbox GL JS + TypeScript (Vite, no framework).

## Setup

```sh
npm install
cp .env.example .env.local   # then paste your public Mapbox token (pk.…)
npm run dev
```

## Structure

- `src/data/locations.json` – hard-coded locations (GeoJSON FeatureCollection, coordinates are `[lng, lat]`)
- `src/data/eventsService.ts` – `getLocations()`; the only place that knows where data comes from
- `src/types.ts` – `EventLocation`, the per-pin data contract
- `src/map.ts` – map setup, clustered pin layers, click/hover handling
- `src/ui/detailPanel.ts` – side panel (bottom sheet on mobile) showing a location's data

## Moving to an API

Replace the body of `getLocations()` with a `fetch` call. The endpoint should return a GeoJSON
`FeatureCollection` whose feature `properties` match `EventLocation` in `src/types.ts`.

## Deploying to GitHub Pages

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site and publishes `dist/`
to https://emiliacrustelia.github.io/bridgeviz/.

One-time setup in the GitHub repo:

1. **Settings → Pages → Build and deployment → Source:** select **GitHub Actions**.
2. **Settings → Secrets and variables → Actions → New repository secret:** name `MAPBOX_TOKEN`,
   value = your public `pk.…` token.
3. In the Mapbox account, add `https://emiliacrustelia.github.io` to the token's allowed URLs.

Note: a public Mapbox token is always visible in the built JavaScript; the URL restriction is what protects it.
