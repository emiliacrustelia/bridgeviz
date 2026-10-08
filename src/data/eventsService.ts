import type { EventFeatureCollection } from '../types';
import locations from './locations.json';

/** Simulated network delay so loading states get exercised in the PoC. */
const FAKE_LATENCY_MS = 300;

/**
 * Single point of data access for the map.
 * PoC: returns hard-coded GeoJSON. Later: replace the body with
 *   const res = await fetch('/api/locations'); return res.json();
 */
export async function getLocations(): Promise<EventFeatureCollection> {
  await new Promise((resolve) => setTimeout(resolve, FAKE_LATENCY_MS));
  return locations as EventFeatureCollection;
}
