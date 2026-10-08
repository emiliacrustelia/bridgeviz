import type { Actions } from '../actions';
import type { LocationQuery } from '../data/query';
import type { AppState, Store } from '../state';
import { STATUS_COLORS, STATUS_LABELS } from '../status';
import type { LocationStatus } from '../types';
import { escapeHtml, formatDate } from './format';

const SEARCH_DEBOUNCE_MS = 200;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export function bindListView(store: Store, actions: Actions): void {
  const form = $<HTMLFormElement>('filters');
  const search = $<HTMLInputElement>('filter-search');
  const from = $<HTMLInputElement>('filter-from');
  const to = $<HTMLInputElement>('filter-to');
  const statusBoxes = [...form.querySelectorAll<HTMLInputElement>('input[name="status"]')];
  const count = $('result-count');
  const body = $('locations-body');
  const empty = $('empty-state');

  // --- Filters → query ---------------------------------------------------
  let searchTimer: number | undefined;
  search.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => actions.setQuery({ search: search.value }), SEARCH_DEBOUNCE_MS);
  });

  for (const box of statusBoxes) {
    box.addEventListener('change', () => {
      const checked = statusBoxes.filter((b) => b.checked).map((b) => b.value as LocationStatus);
      // All checked means "no status filter", so future statuses aren't silently hidden.
      actions.setQuery({ statuses: checked.length === statusBoxes.length ? undefined : checked });
    });
  }

  const onDateChange = () => {
    to.min = from.value;
    from.max = to.value;
    actions.setQuery({ dateFrom: from.value || undefined, dateTo: to.value || undefined });
  };
  from.addEventListener('change', onDateChange);
  to.addEventListener('change', onDateChange);

  form.addEventListener('submit', (e) => e.preventDefault());

  $('clear-filters').addEventListener('click', () => {
    clearTimeout(searchTimer);
    form.reset();
    to.min = '';
    from.max = '';
    actions.clearFilters();
  });

  // --- Rows → selection ---------------------------------------------------
  const selectRow = (target: EventTarget | null) => {
    const row = (target as HTMLElement | null)?.closest<HTMLTableRowElement>('tr[data-id]');
    if (row) actions.select(row.dataset.id!);
  };
  body.addEventListener('click', (e) => selectRow(e.target));
  body.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectRow(e.target);
    }
  });

  // --- Render -------------------------------------------------------------
  const render = (state: AppState, prev?: AppState) => {
    if (state.results !== prev?.results || state.loading !== prev?.loading || state.total !== prev?.total) {
      count.textContent = state.loading
        ? 'Loading…'
        : `Showing ${state.results.length} of ${state.total} location${state.total === 1 ? '' : 's'}`;
      $('clear-filters').hidden = isEmptyQuery(state.query);
    }
    if (state.results !== prev?.results) {
      body.innerHTML = state.results.map(rowHtml).join('');
      empty.hidden = state.loading || state.results.length > 0;
    }
    if (state.results !== prev?.results || state.selectedId !== prev?.selectedId) {
      for (const row of body.querySelectorAll<HTMLElement>('tr[data-id]')) {
        row.classList.toggle('selected', row.dataset.id === state.selectedId);
      }
    }
    // Returning to the list: keep the last-viewed location in view.
    if (state.panelView === 'list' && prev?.panelView === 'detail' && state.selectedId) {
      const row = body.querySelector<HTMLElement>(`tr[data-id="${CSS.escape(state.selectedId)}"]`);
      row?.scrollIntoView({ block: 'nearest' });
      row?.focus({ preventScroll: true });
    }
  };
  store.subscribe(render);
  render(store.get());
}

function isEmptyQuery(query: LocationQuery): boolean {
  return !query.search?.trim() && !query.statuses && !query.dateFrom && !query.dateTo;
}

function rowHtml(l: AppState['results'][number]): string {
  const notOnMap = l.position ? '' : ' <span class="tag" title="Address could not be found">not on map</span>';
  return `
    <tr data-id="${escapeHtml(l.id)}" tabindex="0">
      <td class="name">${escapeHtml(l.name)}${notOnMap}</td>
      <td><span class="dot" style="--dot:${STATUS_COLORS[l.status]}"></span>${STATUS_LABELS[l.status]}</td>
      <td class="date">${formatDate(l.lastEventDate)}</td>
      <td class="date">${formatDate(l.nextEventDate)}</td>
      <td class="num">${l.avgCars.toLocaleString()}</td>
      <td class="num">${l.avgHonks.toLocaleString()}</td>
    </tr>`;
}
