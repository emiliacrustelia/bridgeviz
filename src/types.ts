import type { Feature, FeatureCollection, Point } from 'geojson';

export type LocationStatus = 'active' | 'not active';

/** Properties attached to each pin. This is the contract the future API must return. */
export interface EventLocation {
  id: string;
  name: string;
  /** Full street address; used to place the pin unless `coordinates` is given. */
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

/** A location as stored in the data source: coordinates are optional overrides. */
export interface LocationRecord extends EventLocation {
  /** [longitude, latitude]; set this for spots without a usable street address. */
  coordinates?: [number, number];
}

export type EventFeature = Feature<Point, EventLocation>;
export type EventFeatureCollection = FeatureCollection<Point, EventLocation>;
