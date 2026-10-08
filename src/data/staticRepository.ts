import type { LocationRecord, PlacedLocation } from '../types';
import { geocodeAddress } from './geocode';
import { filterLocations, type LocationQuery } from './query';
import type { LocationsRepository } from './repository';
import locations from './locations.json';

/** Simulated network delay so loading states get exercised in the PoC. */
const FAKE_LATENCY_MS = 150;

const delay = () => new Promise((resolve) => setTimeout(resolve, FAKE_LATENCY_MS));

/** Serves the hard-coded locations; addresses are geocoded once on first use. */
export class StaticLocationsRepository implements LocationsRepository {
  private placed?: Promise<PlacedLocation[]>;

  constructor(private readonly token: string) {}

  async list(query: LocationQuery): Promise<PlacedLocation[]> {
    const all = await this.load();
    await delay();
    return filterLocations(all, query);
  }

  async get(id: string): Promise<PlacedLocation | null> {
    return (await this.load()).find((l) => l.id === id) ?? null;
  }

  async count(): Promise<number> {
    return (await this.load()).length;
  }

  private load(): Promise<PlacedLocation[]> {
    this.placed ??= Promise.all((locations as LocationRecord[]).map((r) => this.place(r))).then((all) =>
      all.sort((a, b) => a.name.localeCompare(b.name)),
    );
    return this.placed;
  }

  private async place({ coordinates, ...location }: LocationRecord): Promise<PlacedLocation> {
    const position =
      coordinates ??
      (await geocodeAddress(location.address, this.token).catch((err) => {
        console.error(err);
        return null;
      }));
    if (!position) console.warn(`No map position for "${location.name}" (${location.address})`);
    return { ...location, position };
  }
}
