import 'mapbox-gl/dist/mapbox-gl.css';
import './style.css';
import { getLocations } from './data/eventsService';
import { addEventsLayer, createMap } from './map';

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

  const map = createMap('map', token);
  setStatus('Loading locations…');

  // Fetch data in parallel with the map style loading.
  const [{ collection, unlocated }] = await Promise.all([
    getLocations(token),
    new Promise<void>((resolve) => map.once('load', () => resolve())),
  ]);

  addEventsLayer(map, collection);
  if (unlocated.length > 0) {
    const names = unlocated.map((l) => l.name).join(', ');
    setStatus(`Couldn't find ${unlocated.length} address(es): ${names}`, true);
  } else {
    setStatus(null);
  }
}

init().catch((err) => {
  console.error(err);
  setStatus('Failed to load locations.', true);
});
