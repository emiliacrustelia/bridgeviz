import 'mapbox-gl/dist/mapbox-gl.css';
import './style.css';
import { Actions } from './actions';
import { StaticLocationsRepository } from './data/staticRepository';
import { bindLocationsLayer, createMap } from './map';
import { initialState, Store } from './state';
import { bindDetailView } from './ui/detailView';
import { bindListView } from './ui/listView';
import { bindPanel } from './ui/panel';

const status = document.getElementById('status') as HTMLElement;

function setStatus(message: string | null, isError = false): void {
  status.hidden = message === null;
  status.textContent = message ?? '';
  status.classList.toggle('error', isError);
}

async function init(): Promise<void> {
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  if (!token) {
    setStatus('Missing VITE_MAPBOX_TOKEN — copy .env.example to .env.local and add your Mapbox token.', true);
    return;
  }

  const store = new Store(initialState);
  const actions = new Actions(store, new StaticLocationsRepository(token));

  bindPanel(store, actions);
  bindListView(store, actions);
  bindDetailView(store, actions);

  const map = createMap(document.getElementById('map')!, token);
  setStatus('Loading locations…');

  // Load data in parallel with the map style.
  await Promise.all([actions.init(), new Promise<void>((resolve) => map.once('load', () => resolve()))]);
  bindLocationsLayer(map, store, actions);

  const unplaced = store.get().results.filter((l) => !l.position);
  if (unplaced.length > 0) {
    setStatus(`Couldn't find ${unplaced.length} address(es): ${unplaced.map((l) => l.name).join(', ')}`, true);
  } else {
    setStatus(null);
  }
}

init().catch((err) => {
  console.error(err);
  setStatus('Failed to load locations.', true);
});
