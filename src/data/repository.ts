import type { PlacedLocation } from '../types';
import type { LocationQuery } from './query';

/**
 * Data access for locations. The static implementation filters in the browser;
 * an HTTP implementation will pass the query to the backend instead.
 * create / update / remove will be added with the CRUDL service.
 */
export interface LocationsRepository {
  /** Matching locations, in the repository's default order (name). */
  list(query: LocationQuery): Promise<PlacedLocation[]>;
  get(id: string): Promise<PlacedLocation | null>;
  /** Total number of locations, ignoring filters. */
  count(): Promise<number>;
}
