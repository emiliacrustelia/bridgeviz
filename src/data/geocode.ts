import { REGION_CENTER, REGION_COUNTRY } from '../config';

const GEOCODE_URL = 'https://api.mapbox.com/search/geocode/v6/forward';

/**
 * Looks up an address with the Mapbox Geocoding API (v6).
 * Returns [lng, lat], or null when nothing matches.
 */
export async function geocodeAddress(address: string, token: string): Promise<[number, number] | null> {
  const params = new URLSearchParams({
    q: address,
    limit: '1',
    country: REGION_COUNTRY,
    proximity: REGION_CENTER.join(','),
    access_token: token,
  });
  const res = await fetch(`${GEOCODE_URL}?${params}`);
  if (!res.ok) throw new Error(`Geocoding failed (${res.status}) for "${address}"`);

  const body = await res.json();
  const feature = body.features?.[0];
  if (!feature) return null;

  const confidence = feature.properties?.match_code?.confidence;
  if (confidence && confidence !== 'exact' && confidence !== 'high') {
    console.warn(`Low-confidence match (${confidence}) for "${address}" → ${feature.properties.full_address}`);
  }
  return feature.geometry.coordinates as [number, number];
}
