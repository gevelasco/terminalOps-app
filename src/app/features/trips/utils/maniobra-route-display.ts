import { parseNonNegativeNumber } from '@features/trips/utils/parse-non-negative';

/** Tope razonable para captura manual de km de ida (MX). */
export const MAX_ROUTE_KM_ONE_WAY = 20_000;

/** Texto de snapshot (CP, localidad, licencia) o em dash si no hay dato. */
export function snapshotTextOrDash(value: string | undefined | null): string {
  const t = value?.trim() ?? '';
  return t.length > 0 ? t : '—';
}

/** Formato de km de ruta (UI es-MX, una decimal). */
export function formatRouteKmEsMx(km: number): string {
  return km.toLocaleString('es-MX', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** Una decimal, alineado con la sugerencia OSRM en UI. */
export function normalizeRouteKmOneWay(km: number): number {
  return Math.round(km * 10) / 10;
}

/** Valor de input para km de ida (vacío si no hay sugerencia). */
export function formatRouteKmInputValue(km: number | null | undefined): string {
  if (km == null || !Number.isFinite(km) || km <= 0) {
    return '';
  }
  return formatRouteKmEsMx(km);
}

/**
 * Parsea km de ida capturados a mano. `null` si vacío, ≤ 0 o fuera de rango.
 */
export function parseRouteKmOneWayInput(raw: string): number | null {
  const n = parseNonNegativeNumber(raw);
  if (n == null || n <= 0 || n > MAX_ROUTE_KM_ONE_WAY) {
    return null;
  }
  return normalizeRouteKmOneWay(n);
}

/** Etiqueta para distancia OSRM guardada (`Trip.routeDistanceKm`, solo ida). */
export function storedRouteDistanceKmLabel(km: number | null | undefined): string {
  if (km === undefined || km === null || Number.isNaN(km)) {
    return '—';
  }
  return `${formatRouteKmEsMx(km)} km`;
}

/** Etiqueta para distancia operativa (route × 2). */
export function storedOperationalDistanceKmLabel(
  km: number | null | undefined,
): string {
  if (km === undefined || km === null || Number.isNaN(km)) {
    return '—';
  }
  return `${formatRouteKmEsMx(km)} km`;
}

/** Regla de negocio del formulario: local vs foránea por umbral de km OSRM. */
export function maneuverKindFromRouteKm(
  km: number | null,
): 'Local' | 'Foránea' | undefined {
  if (km === null || !Number.isFinite(km)) {
    return undefined;
  }
  return km <= 25 ? 'Local' : 'Foránea';
}
