import type { LocationQuery } from './data/query';
import type { LocationsRepository } from './data/repository';
import type { Store } from './state';

/** All state changes go through here, so UI modules never call each other directly. */
export class Actions {
  private requestSeq = 0;

  constructor(
    private readonly store: Store,
    private readonly repo: LocationsRepository,
  ) {}

  async init(): Promise<void> {
    const total = await this.repo.count();
    this.store.set({ total });
    await this.setQuery({});
  }

  /** Merges the patch into the current query and reloads results. */
  async setQuery(patch: LocationQuery): Promise<void> {
    const query = { ...this.store.get().query, ...patch };
    const seq = ++this.requestSeq;
    this.store.set({ query, loading: true });

    const results = await this.repo.list(query);
    if (seq !== this.requestSeq) return; // a newer query superseded this one

    const { selectedId } = this.store.get();
    const stillVisible = selectedId !== null && results.some((l) => l.id === selectedId);
    this.store.set({
      results,
      loading: false,
      ...(stillVisible ? {} : { selectedId: null, panelView: 'list' as const }),
    });
  }

  clearFilters(): Promise<void> {
    this.store.set({ query: {} });
    return this.setQuery({});
  }

  /** Select a location and show its details in the side panel. */
  select(id: string): void {
    this.store.set({ selectedId: id, panelOpen: true, panelView: 'detail' });
  }

  clearSelection(): void {
    this.store.set({ selectedId: null, panelView: 'list' });
  }

  backToList(): void {
    this.store.set({ panelView: 'list' });
  }

  togglePanel(): void {
    const open = !this.store.get().panelOpen;
    this.store.set(open ? { panelOpen: true } : { panelOpen: false, selectedId: null, panelView: 'list' });
  }
}
