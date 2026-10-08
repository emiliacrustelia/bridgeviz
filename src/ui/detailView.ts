import type { Actions } from '../actions';
import type { AppState, Store } from '../state';
import { STATUS_COLORS, STATUS_LABELS } from '../status';
import type { PlacedLocation } from '../types';
import { escapeHtml, formatDate } from './format';

export function bindDetailView(store: Store, actions: Actions): void {
  const view = document.getElementById('detail-view') as HTMLElement;

  view.addEventListener('click', (e) => {
    const action = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action;
    if (action === 'back') actions.backToList();
    if (action === 'close-panel') actions.togglePanel();
  });

  const render = (state: AppState, prev?: AppState) => {
    if (state.selectedId === prev?.selectedId && state.panelView === prev?.panelView && state.results === prev?.results) {
      return;
    }
    const location = state.results.find((l) => l.id === state.selectedId);
    if (state.panelView !== 'detail' || !location) {
      view.innerHTML = '';
      return;
    }
    view.innerHTML = detailHtml(location);
    view.scrollTop = 0;
    view.querySelector<HTMLElement>('[data-action="back"]')?.focus({ preventScroll: true });
  };
  store.subscribe(render);
}

function eventLine(date: string | null, url: string | null, none: string): string {
  if (!date && !url) return `<span class="muted">${none}</span>`;
  const link = url ? ` · <a href="${escapeHtml(url)}" target="_blank" rel="noopener">View ↗</a>` : '';
  return `${formatDate(date)}${link}`;
}

function detailHtml(l: PlacedLocation): string {
  const notOnMap = l.position ? '' : '<p class="notice">This address couldn’t be found, so it has no pin on the map.</p>';
  return `
    <header class="panel-header">
      <button class="link-btn back-btn" type="button" data-action="back">← Back to list</button>
      <button class="icon-btn" type="button" data-action="close-panel" aria-label="Close panel">×</button>
    </header>
    <span class="status-chip" style="--chip:${STATUS_COLORS[l.status]}">${STATUS_LABELS[l.status]}</span>
    <h2>${escapeHtml(l.name)}</h2>
    <p class="address">${escapeHtml(l.address)}</p>
    ${notOnMap}
    <div class="stats">
      <div><span class="stat-value">${l.avgCars.toLocaleString()}</span><span class="stat-label">avg cars</span></div>
      <div><span class="stat-value">${l.avgHonks.toLocaleString()}</span><span class="stat-label">avg honks</span></div>
    </div>
    <dl>
      <dt>Organizers</dt><dd>${escapeHtml(l.organizers)}</dd>
      <dt>Last event</dt><dd>${eventLine(l.lastEventDate, l.lastEventUrl, 'None yet')}</dd>
      <dt>Next event</dt><dd>${eventLine(l.nextEventDate, l.nextEventUrl, 'None scheduled')}</dd>
    </dl>`;
}
