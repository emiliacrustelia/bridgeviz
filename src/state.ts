import type { LocationQuery } from './data/query';
import type { PlacedLocation } from './types';

export interface AppState {
  query: LocationQuery;
  /** Locations matching the query; drives both the table and the map pins. */
  results: PlacedLocation[];
  total: number;
  loading: boolean;
  selectedId: string | null;
  panelOpen: boolean;
  panelView: 'list' | 'detail';
}

type Listener = (state: AppState, prev: AppState) => void;

/** Minimal observable store: UI modules subscribe and re-render the parts that changed. */
export class Store {
  private listeners = new Set<Listener>();

  constructor(private state: AppState) {}

  get(): AppState {
    return this.state;
  }

  set(patch: Partial<AppState>): void {
    const prev = this.state;
    this.state = { ...prev, ...patch };
    for (const listener of this.listeners) listener(this.state, prev);
  }

  subscribe(listener: Listener): void {
    this.listeners.add(listener);
  }
}

export const initialState: AppState = {
  query: {},
  results: [],
  total: 0,
  loading: true,
  selectedId: null,
  panelOpen: false,
  panelView: 'list',
};
