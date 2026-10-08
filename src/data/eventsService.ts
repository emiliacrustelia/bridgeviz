import type { EventFeature, EventFeatureCollection, LocationRecord } from '../types';
import { geocodeAddress } from './geocode';
import locations from './locations.json';

export interface LocationsResult {
  collection: EventFeatureCollection;
  /** Locations whose address couldn't be found; they get no pin. */
  unlocated: LocationRecord[];
}

/**
 * Single point of data access for the map.
 * PoC: reads hard-coded records. Later: replace the import with
 *   const records = await (await fetch('/api/locations')).json();
 */
export async function getLocations(token: string): Promise<LocationsResult> {
  const records = locations as LocationRecord[];
  const unlocated: LocationRecord[] = [];

  const features = await Promise.all(
    records.map(async ({ coordinates, ...properties }): Promise<EventFeature | null> => {
      const point = coordinates ?? (await geocodeAddress(properties.address, token).catch((err) => {
        console.error(err);
        return null;
      }));
      if (!point) {
        unlocated.push({ coordinates, ...properties });
        return null;
      }
      return { type: 'Feature', geometry: { type: 'Point', coordinates: point }, properties };
    }),
  );

  return {
    collection: { type: 'FeatureCollection', features: features.filter((f) => f !== null) },
    unlocated,
  };
}
