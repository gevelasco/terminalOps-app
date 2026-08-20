import type { TripMapItem } from '@shared/models/api/api-trips-map.model';
import type { LatLon } from '@shared/services/osrm-driving-route.service';
import { osrmRouteCacheKey } from '@shared/services/osrm-driving-route.util';

export type TripMapRoutePair = {
  key: string;
  from: LatLon;
  to: LatLon;
  tripIds: string[];
};

/** Pares origen→destino únicos para no repetir OSRM en el mapa. */
export function uniqueTripMapRoutePairs(
  items: readonly TripMapItem[],
): TripMapRoutePair[] {
  const byKey = new Map<string, TripMapRoutePair>();

  for (const item of items) {
    const from = plottableLatLon(item.origin.lat, item.origin.lng);
    const to = plottableLatLon(item.destination.lat, item.destination.lng);
    if (!from || !to) {
      continue;
    }
    const key = osrmRouteCacheKey(from, to);
    const existing = byKey.get(key);
    if (existing) {
      existing.tripIds.push(item.id);
      continue;
    }
    byKey.set(key, { key, from, to, tripIds: [item.id] });
  }

  return [...byKey.values()];
}

function plottableLatLon(
  lat: number | null,
  lng: number | null,
): LatLon | null {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return { lat, lon: lng };
}
