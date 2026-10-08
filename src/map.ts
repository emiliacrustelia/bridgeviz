import mapboxgl, { type GeoJSONSource, type MapMouseEvent } from 'mapbox-gl';
import type { Actions } from './actions';
import { REGION_CENTER } from './config';
import type { Store } from './state';
import { STATUS_COLORS } from './status';
import type { EventFeature, EventFeatureCollection, PlacedLocation } from './types';
import { escapeHtml } from './ui/format';

const SOURCE_ID = 'events';
const CLUSTER_LAYER = 'event-clusters';
const CLUSTER_COUNT_LAYER = 'event-cluster-count';
const PIN_LAYER = 'event-pins';

/** Zoom used when focusing a single pin; above clusterMaxZoom so it isn't hidden in a cluster. */
const FOCUS_ZOOM = 14;

export function createMap(container: HTMLElement, token: string): mapboxgl.Map {
  mapboxgl.accessToken = token;
  const map = new mapboxgl.Map({
    container,
    style: 'mapbox://styles/mapbox/light-v11',
    center: REGION_CENTER,
    zoom: 11,
  });
  map.addControl(new mapboxgl.NavigationControl(), 'top-left');
  // Mapbox only tracks window resizes; the side panel also changes the container size.
  new ResizeObserver(() => map.resize()).observe(container);
  return map;
}

function toFeatureCollection(locations: PlacedLocation[]): EventFeatureCollection {
  const features: EventFeature[] = [];
  for (const { position, ...properties } of locations) {
    if (position) features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: position }, properties });
  }
  return { type: 'FeatureCollection', features };
}

/** Adds the pin layers and keeps them in sync with the store (results + selection). */
export function bindLocationsLayer(map: mapboxgl.Map, store: Store, actions: Actions): void {
  map.addSource(SOURCE_ID, {
    type: 'geojson',
    data: toFeatureCollection(store.get().results),
    promoteId: 'id',
    cluster: true,
    clusterRadius: 40,
    clusterMaxZoom: FOCUS_ZOOM - 1,
  });

  map.addLayer({
    id: CLUSTER_LAYER,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': '#334155',
      'circle-radius': ['step', ['get', 'point_count'], 16, 5, 20, 10, 26],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff',
    },
  });

  map.addLayer({
    id: CLUSTER_COUNT_LAYER,
    type: 'symbol',
    source: SOURCE_ID,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-size': 13,
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
    },
    paint: { 'text-color': '#fff' },
  });

  map.addLayer({
    id: PIN_LAYER,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': [
        'match',
        ['get', 'status'],
        ...Object.entries(STATUS_COLORS).flat(),
        '#64748b',
      ] as mapboxgl.ExpressionSpecification,
      'circle-radius': ['case', ['boolean', ['feature-state', 'selected'], false], 11, 8],
      'circle-stroke-width': ['case', ['boolean', ['feature-state', 'selected'], false], 3, 2],
      'circle-stroke-color': ['case', ['boolean', ['feature-state', 'selected'], false], '#0f172a', '#fff'],
    },
  });

  const source = map.getSource(SOURCE_ID) as GeoJSONSource;
  let fitted = false;

  const setSelectedState = (id: string | null, selected: boolean) => {
    if (id) map.setFeatureState({ source: SOURCE_ID, id }, { selected });
  };

  const sync = (state = store.get(), prev?: typeof state) => {
    if (state.results !== prev?.results) {
      source.setData(toFeatureCollection(state.results));
      setSelectedState(state.selectedId, true);
      // Fit to the pins once on first load; afterwards filters never move the map.
      if (!fitted && !state.loading) {
        fitToLocations(map, state.results);
        fitted = true;
      }
    }
    if (state.selectedId !== prev?.selectedId) {
      setSelectedState(prev?.selectedId ?? null, false);
      setSelectedState(state.selectedId, true);
      const position = state.results.find((l) => l.id === state.selectedId)?.position;
      if (position) map.flyTo({ center: position, zoom: Math.max(map.getZoom(), FOCUS_ZOOM), duration: 800 });
    }
  };
  store.subscribe(sync);
  sync();

  map.on('click', PIN_LAYER, (e) => {
    const id = e.features?.[0]?.properties?.id as string | undefined;
    if (id) actions.select(id);
  });

  // Click a cluster → zoom in to expand it.
  map.on('click', CLUSTER_LAYER, (e) => {
    const feature = e.features?.[0];
    if (!feature || feature.geometry.type !== 'Point') return;
    const clusterId = feature.properties?.cluster_id as number;
    const center = feature.geometry.coordinates as [number, number];
    source.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (!err && zoom != null) map.easeTo({ center, zoom });
    });
  });

  // Click empty map → deselect.
  map.on('click', (e: MapMouseEvent) => {
    const hits = map.queryRenderedFeatures(e.point, { layers: [PIN_LAYER, CLUSTER_LAYER] });
    if (hits.length === 0 && store.get().selectedId) actions.clearSelection();
  });

  // Hover: pointer cursor + name tooltip.
  const hoverPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });
  map.on('mouseenter', PIN_LAYER, (e) => {
    map.getCanvas().style.cursor = 'pointer';
    const feature = e.features?.[0];
    if (!feature || feature.geometry.type !== 'Point') return;
    const name = String(feature.properties?.name ?? '');
    hoverPopup
      .setLngLat(feature.geometry.coordinates as [number, number])
      .setHTML(`<strong>${escapeHtml(name)}</strong>`)
      .addTo(map);
  });
  map.on('mouseleave', PIN_LAYER, () => {
    map.getCanvas().style.cursor = '';
    hoverPopup.remove();
  });
  map.on('mouseenter', CLUSTER_LAYER, () => (map.getCanvas().style.cursor = 'pointer'));
  map.on('mouseleave', CLUSTER_LAYER, () => (map.getCanvas().style.cursor = ''));
}

function fitToLocations(map: mapboxgl.Map, locations: PlacedLocation[]): void {
  const positions = locations.flatMap((l) => (l.position ? [l.position] : []));
  if (positions.length === 0) return;
  const bounds = new mapboxgl.LngLatBounds();
  for (const p of positions) bounds.extend(p);
  map.fitBounds(bounds, { padding: 60, maxZoom: FOCUS_ZOOM, duration: 0 });
}
