import { describe, expect, it } from 'vitest';
import type { EventLocation } from '../types';
import { filterLocations, matchesQuery } from './query';

function loc(overrides: Partial<EventLocation>): EventLocation {
  return {
    id: 'x',
    name: 'Union Square',
    address: '860 Broadway, New York, NY 10003',
    status: 'active',
    organizers: 'Org',
    lastEventUrl: null,
    lastEventDate: '2026-09-19',
    nextEventUrl: null,
    nextEventDate: '2026-10-17',
    avgCars: 1,
    avgHonks: 1,
    ...overrides,
  };
}

describe('matchesQuery', () => {
  it('matches everything with an empty query', () => {
    expect(matchesQuery(loc({ lastEventDate: null, nextEventDate: null }), {})).toBe(true);
  });

  it('searches names case-insensitively and ignores surrounding spaces', () => {
    expect(matchesQuery(loc({}), { search: '  SQUARE ' })).toBe(true);
    expect(matchesQuery(loc({}), { search: 'park' })).toBe(false);
  });

  it('does not search the address', () => {
    expect(matchesQuery(loc({}), { search: 'broadway' })).toBe(false);
  });

  it('filters by status', () => {
    expect(matchesQuery(loc({ status: 'active' }), { statuses: ['active'] })).toBe(true);
    expect(matchesQuery(loc({ status: 'active' }), { statuses: ['not active'] })).toBe(false);
    expect(matchesQuery(loc({}), { statuses: [] })).toBe(false);
  });

  it('matches a date range on either the last or the next event date', () => {
    expect(matchesQuery(loc({}), { dateFrom: '2026-09-01', dateTo: '2026-09-30' })).toBe(true); // last
    expect(matchesQuery(loc({}), { dateFrom: '2026-10-01', dateTo: '2026-10-31' })).toBe(true); // next
    expect(matchesQuery(loc({}), { dateFrom: '2026-09-20', dateTo: '2026-10-16' })).toBe(false); // between
  });

  it('treats range ends as inclusive and allows open-ended ranges', () => {
    expect(matchesQuery(loc({}), { dateFrom: '2026-10-17', dateTo: '2026-10-17' })).toBe(true);
    expect(matchesQuery(loc({}), { dateFrom: '2026-10-18' })).toBe(false);
    expect(matchesQuery(loc({}), { dateTo: '2026-09-19' })).toBe(true);
  });

  it('uses the remaining date when one is missing', () => {
    expect(matchesQuery(loc({ nextEventDate: null }), { dateFrom: '2026-09-01' })).toBe(true);
    expect(matchesQuery(loc({ lastEventDate: null }), { dateTo: '2026-09-30' })).toBe(false);
  });

  it('excludes locations without event dates while a date range is set', () => {
    expect(matchesQuery(loc({ lastEventDate: null, nextEventDate: null }), { dateFrom: '2000-01-01' })).toBe(false);
  });

  it('combines filters', () => {
    const query = { search: 'union', statuses: ['active' as const], dateFrom: '2026-10-01' };
    expect(matchesQuery(loc({}), query)).toBe(true);
    expect(matchesQuery(loc({ status: 'not active' }), query)).toBe(false);
  });
});

describe('filterLocations', () => {
  it('keeps order and returns only matches', () => {
    const a = loc({ id: 'a', name: 'Alpha' });
    const b = loc({ id: 'b', name: 'Beta' });
    const c = loc({ id: 'c', name: 'Alphabet' });
    expect(filterLocations([a, b, c], { search: 'alpha' }).map((l) => l.id)).toEqual(['a', 'c']);
  });
});
