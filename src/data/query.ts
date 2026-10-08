import type { EventLocation, IsoDate, LocationStatus } from '../types';

/**
 * Search and filter options for listing locations.
 * Mirrors the future API: GET /api/locations?search=&status=&from=&to=
 */
export interface LocationQuery {
  /** Case-insensitive substring match on the location name. */
  search?: string;
  /** Only these statuses; undefined means all. */
  statuses?: LocationStatus[];
  /** Inclusive date range applied to last and next event dates. */
  dateFrom?: IsoDate;
  dateTo?: IsoDate;
}

export function hasDateRange(query: LocationQuery): boolean {
  return Boolean(query.dateFrom || query.dateTo);
}

/**
 * True when the location matches every filter in the query.
 * Date range: matches if the last or the next event date falls in the range;
 * locations with neither date are excluded while a range is set.
 */
export function matchesQuery(location: EventLocation, query: LocationQuery): boolean {
  const search = query.search?.trim().toLowerCase();
  if (search && !location.name.toLowerCase().includes(search)) return false;

  if (query.statuses && !query.statuses.includes(location.status)) return false;

  if (hasDateRange(query)) {
    const from = query.dateFrom ?? '0000-01-01';
    const to = query.dateTo ?? '9999-12-31';
    const dates = [location.lastEventDate, location.nextEventDate].filter((d) => d !== null);
    // YYYY-MM-DD strings compare correctly as text.
    if (!dates.some((d) => d >= from && d <= to)) return false;
  }

  return true;
}

export function filterLocations<T extends EventLocation>(locations: T[], query: LocationQuery): T[] {
  return locations.filter((location) => matchesQuery(location, query));
}
