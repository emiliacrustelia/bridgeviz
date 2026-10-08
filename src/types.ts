import type { Feature, FeatureCollection, Point } from 'geojson';

export type LocationStatus = 'active' | 'not active';

/** Calendar date, YYYY-MM-DD. */
export type IsoDate = string;

/** Properties attached to each pin. This is the contract the future API must return. */
export interface EventLocation {
  id: string;
  name: string;
  /** Full street address; used to place the pin unless `coordinates` is given. */
  address: string;
  status: LocationStatus;
  organizers: string;
  /** null when there is no past event */
  lastEventUrl: string | null;
  lastEventDate: IsoDate | null;
  /** null when no upcoming event is scheduled */
  nextEventUrl: string | null;
  nextEventDate: IsoDate | null;
  /** positive integers */
  avgCars: number;
  avgHonks: number;
}

/** A location as stored in the data source: coordinates are optional overrides. */
export interface LocationRecord extends EventLocation {
  /** [longitude, latitude]; set this for spots without a usable street address. */
  coordinates?: [number, number];
}

/** A location with its resolved map position (null when the address couldn't be found). */
export interface PlacedLocation extends EventLocation {
  position: [number, number] | null;
}

export type EventFeature = Feature<Point, EventLocation>;
export type EventFeatureCollection = FeatureCollection<Point, EventLocation>;
