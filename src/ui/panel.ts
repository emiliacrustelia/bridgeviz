import type { Actions } from '../actions';
import type { AppState, Store } from '../state';

/** Open/close behaviour of the side panel and switching between list and detail views. */
export function bindPanel(store: Store, actions: Actions): void {
  const panel = document.getElementById('side-panel') as HTMLElement;
  const toggle = document.getElementById('list-toggle') as HTMLButtonElement;
  const listView = document.getElementById('list-view') as HTMLElement;
  const detailView = document.getElementById('detail-view') as HTMLElement;

  toggle.addEventListener('click', () => actions.togglePanel());
  listView.querySelector('[data-action="close-panel"]')!.addEventListener('click', () => actions.togglePanel());

  document.addEventListener('keydown', (e) => {
    // Let Escape clear a search box or close a date picker first.
    if (e.key !== 'Escape' || (e.target as HTMLElement).matches('input, select')) return;
    const { panelOpen, panelView } = store.get();
    if (panelView === 'detail') actions.backToList();
    else if (panelOpen) actions.togglePanel();
  });

  const render = (state: AppState, prev?: AppState) => {
    if (state.panelOpen !== prev?.panelOpen) {
      panel.hidden = !state.panelOpen;
      toggle.setAttribute('aria-expanded', String(state.panelOpen));
      toggle.classList.toggle('active', state.panelOpen);
      toggle.title = state.panelOpen ? 'Hide list' : 'Show list';
    }
    if (state.panelView !== prev?.panelView) {
      listView.hidden = state.panelView !== 'list';
      detailView.hidden = state.panelView !== 'detail';
    }
  };
  store.subscribe(render);
  render(store.get());
}
