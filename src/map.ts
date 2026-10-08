import mapboxgl, { type GeoJSONSource, type MapMouseEvent } from 'mapbox-gl';
import type { EventFeatureCollection, EventLocation } from './types';
import { STATUS_COLORS } from './status';
import { hideDetails, showDetails } from './ui/detailPanel';
import { escapeHtml } from './ui/format';

const SOURCE_ID = 'events';
const CLUSTER_LAYER = 'event-clusters';
const CLUSTER_COUNT_LAYER = 'event-cluster-count';
const PIN_LAYER = 'event-pins';

const NYC_CENTER: [number, number] = [-73.96, 40.75];

export function createMap(container: string, token: string): mapboxgl.Map {
  mapboxgl.accessToken = token;
  const map = new mapboxgl.Map({
    container,
    style: 'mapbox://styles/mapbox/light-v11',
    center: NYC_CENTER,
    zoom: 11,
  });
  map.addControl(new mapboxgl.NavigationControl(), 'top-left');
  return map;
}

export function addEventsLayer(map: mapboxgl.Map, data: EventFeatureCollection): void {
  const byId = new Map<string, EventLocation>(data.features.map((f) => [f.properties.id, f.properties]));
  let selectedId: string | undefined;

  map.addSource(SOURCE_ID, {
    type: 'geojson',
    data,
    promoteId: 'id',
    cluster: true,
    clusterRadius: 40,
    clusterMaxZoom: 13,
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
      'circle-radius': ['case', ['boolean', ['feature-state', 'selected'], false], 12, 8],
      'circle-stroke-width': ['case', ['boolean', ['feature-state', 'selected'], false], 4, 2],
      'circle-stroke-color': '#fff',
    },
  });

  fitToData(map, data);

  const setSelected = (id: string | undefined) => {
    if (selectedId) map.setFeatureState({ source: SOURCE_ID, id: selectedId }, { selected: false });
    selectedId = id;
    if (id) map.setFeatureState({ source: SOURCE_ID, id }, { selected: true });
  };

  // Click a pin → show its details.
  map.on('click', PIN_LAYER, (e) => {
    const id = e.features?.[0]?.properties?.id as string | undefined;
    const location = id ? byId.get(id) : undefined;
    if (!id || !location) return;
    hideDetails();
    setSelected(id);
    showDetails(location, () => setSelected(undefined));
    map.easeTo({ center: e.lngLat, duration: 500 });
  });

  // Click a cluster → zoom in to expand it.
  map.on('click', CLUSTER_LAYER, (e) => {
    const feature = e.features?.[0];
    if (!feature || feature.geometry.type !== 'Point') return;
    const clusterId = feature.properties?.cluster_id as number;
    const center = feature.geometry.coordinates as [number, number];
    (map.getSource(SOURCE_ID) as GeoJSONSource).getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (!err && zoom != null) map.easeTo({ center, zoom });
    });
  });

  // Click empty map → close the panel.
  map.on('click', (e: MapMouseEvent) => {
    const hits = map.queryRenderedFeatures(e.point, { layers: [PIN_LAYER, CLUSTER_LAYER] });
    if (hits.length === 0) hideDetails();
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

function fitToData(map: mapboxgl.Map, data: EventFeatureCollection): void {
  if (data.features.length === 0) return;
  const bounds = new mapboxgl.LngLatBounds();
  for (const f of data.features) bounds.extend(f.geometry.coordinates as [number, number]);
  map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 0 });
}
