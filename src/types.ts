import type { Feature, FeatureCollection, Point } from 'geojson';

export type LocationStatus = 'active' | 'not active';

/** Properties attached to each pin. This is the contract the future API must return. */
export interface EventLocation {
  id: string;
  name: string;
  address: string;
  status: LocationStatus;
  organizers: string;
  lastEventUrl: string;
  /** null when no upcoming event is scheduled */
  nextEventUrl: string | null;
  /** positive integers */
  avgCars: number;
  avgHonks: number;
}

export type EventFeature = Feature<Point, EventLocation>;
export type EventFeatureCollection = FeatureCollection<Point, EventLocation>;
