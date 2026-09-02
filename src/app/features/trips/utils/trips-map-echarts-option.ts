import type { CallbackDataParams } from 'echarts/types/dist/shared';
import type { EChartsOption } from 'echarts';
import type { TripMapItem } from '@shared/models/api/api-trips-map.model';
import { computeTripsMapViewport } from '@features/trips/utils/trips-map-viewport.util';
import { tripsMapRouteColor } from '@features/trips/utils/trips-map-route-colors';
import {
  buildGeoRegionsForStateActivity,
  countManeuversByOriginState,
  type MexicoStatesGeoJson,
} from '@features/trips/utils/trips-map-state-activity';
import {
  formatTripsMapAddressTooltipHtml,
  isTripsMapGeoRegionTooltip,
  resolveTripsMapGeoTooltipName,
  resolveTripsMapPointDatum,
  resolveTripsMapTooltipItem,
  shortenTripsMapPointLabel,
  TRIPS_MAP_TOOLTIP_BASE,
} from '@features/trips/utils/trips-map-tooltip.util';
import {
  countManeuversByDestinationStateBreakdown,
  formatStateDestinationTooltipHtml,
} from '@features/trips/utils/trips-map-state-tooltip';
import {
  buildHighwayLineData,
  buildPlaceLabelData,
  hasMexicoHighways,
  hasMexicoPlaces,
  type MexicoHighwaysJson,
} from '@features/trips/utils/trips-map-highways.util';

export const TRIPS_MAP_GEO_NAME = 'mexico';

/** Polilínea [lng, lat] por tripId (geometría OSRM). */
export type TripMapRouteGeometryById = ReadonlyMap<
  string,
  ReadonlyArray<readonly [number, number]>
>;

export type TripsMapRouteDatum = {
  tripId: string;
  maneuverCode: string;
  status: string;
  coords: Array<[number, number]>;
  lineStyle: {
    color: string;
    width: number;
    opacity: number;
    curveness: number;
  };
  effect: {
    show: true;
    period: number;
    trailLength: number;
    symbol: string;
    symbolSize: number;
    color: string;
  };
};

export type TripsMapPointDatum = {
  name?: string;
  tripId: string;
  maneuverCode: string;
  kind: 'origin' | 'destination';
  value: [number, number];
  pointLabel: string;
};

function resolvePlottableCoords(
  lat: number | null,
  lng: number | null,
): { lat: number; lng: number } | null {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return { lat, lng };
}

function routeCoordsForItem(
  origin: { lng: number; lat: number },
  destination: { lng: number; lat: number },
  geometry: ReadonlyArray<readonly [number, number]> | undefined,
): Array<[number, number]> {
  if (geometry && geometry.length >= 2) {
    return geometry.map(([lng, lat]) => [lng, lat]);
  }
  return [
    [origin.lng, origin.lat],
    [destination.lng, destination.lat],
  ];
}

export function buildTripsMapChartData(
  items: readonly TripMapItem[],
  geometries?: TripMapRouteGeometryById,
) {
  const routes: TripsMapRouteDatum[] = [];
  const origins: TripsMapPointDatum[] = [];
  const destinations: TripsMapPointDatum[] = [];

  for (const item of items) {
    const { origin, destination } = item;
    const originCoords = resolvePlottableCoords(origin.lat, origin.lng);
    const destinationCoords = resolvePlottableCoords(destination.lat, destination.lng);

    if (originCoords) {
      origins.push({
        tripId: item.id,
        maneuverCode: item.maneuverCode,
        kind: 'origin',
        value: [originCoords.lng, originCoords.lat],
        pointLabel: origin.label,
      });
    }

    if (destinationCoords) {
      const destinationLabel = shortenTripsMapPointLabel(destination.label);
      destinations.push({
        name: destinationLabel,
        tripId: item.id,
        maneuverCode: item.maneuverCode,
        kind: 'destination',
        value: [destinationCoords.lng, destinationCoords.lat],
        pointLabel: destinationLabel,
      });
    }

    if (originCoords && destinationCoords) {
      const colors = tripsMapRouteColor(item.status);
      const coords = routeCoordsForItem(
        originCoords,
        destinationCoords,
        geometries?.get(item.id),
      );
      const followsRoad = coords.length > 2;
      routes.push({
        tripId: item.id,
        maneuverCode: item.maneuverCode,
        status: item.status,
        coords,
        lineStyle: {
          color: colors.line,
          width: followsRoad ? 2 : 1.4,
          opacity: followsRoad ? 0.8 : 0.55,
          curveness: 0,
        },
        effect: {
          show: true,
          period: followsRoad ? 8 : 6,
          trailLength: 0.12,
          symbol: 'arrow',
          symbolSize: 5,
          color: colors.effect,
        },
      });
    }
  }

  return { routes, origins, destinations };
}

export function buildTripsMapEchartsOption(
  items: readonly TripMapItem[],
  geoJson?: MexicoStatesGeoJson | null,
  geometries?: TripMapRouteGeometryById,
  highways?: MexicoHighwaysJson | null,
): EChartsOption {
  const { routes, origins, destinations } = buildTripsMapChartData(
    items,
    geometries,
  );
  const viewport = computeTripsMapViewport(items);
  const stateBreakdown = geoJson
    ? countManeuversByDestinationStateBreakdown(items, geoJson)
    : new Map();
  const originStateCounts = geoJson ? countManeuversByOriginState(items, geoJson) : new Map();
  const destinationStateCounts = new Map(
    [...stateBreakdown.entries()].map(([name, breakdown]) => [name, breakdown.total]),
  );
  const stateRegions = buildGeoRegionsForStateActivity(
    originStateCounts,
    destinationStateCounts,
  );

  const formatStateTooltip = (stateName: string): string | null => {
    const breakdown = stateBreakdown.get(stateName);
    if (!breakdown || breakdown.total <= 0) {
      return null;
    }
    return formatStateDestinationTooltipHtml(stateName, breakdown);
  };

  const formatDestinationTooltip = (
    params: CallbackDataParams | CallbackDataParams[],
  ): string | undefined => {
    const item = resolveTripsMapTooltipItem(params);
    if (!item) {
      return undefined;
    }
    const datum = resolveTripsMapPointDatum(item, destinations);
    const label = datum?.pointLabel?.trim() || String(item.name ?? '').trim();
    const html = label ? formatTripsMapAddressTooltipHtml(label) : '';
    return html || undefined;
  };

  const formatSeriesTooltip = (
    item: NonNullable<ReturnType<typeof resolveTripsMapTooltipItem>>,
  ): string | null => {
    if (item.seriesName === 'Destino') {
      const datum = resolveTripsMapPointDatum(item, destinations);
      const label = datum?.pointLabel?.trim() || String(item.name ?? '').trim();
      return label ? formatTripsMapAddressTooltipHtml(label) : null;
    }

    const routeDatum =
      item.seriesName === 'Rutas' && typeof item.dataIndex === 'number'
        ? (routes[item.dataIndex] ?? null)
        : null;
    const data =
      routeDatum ??
      (item.seriesName === 'Origen'
        ? resolveTripsMapPointDatum(item, origins)
        : (item.data as TripsMapRouteDatum | TripsMapPointDatum | undefined));

    if (!data || !('maneuverCode' in data)) {
      return null;
    }
    if ('coords' in data) {
      const tracingRoad = data.coords.length > 2;
      return `<strong>${data.maneuverCode}</strong><br/>${
        tracingRoad ? 'Ruta por carretera' : 'Trazando ruta…'
      }`;
    }
    return `<strong>${data.maneuverCode}</strong><br/>Origen: ${data.pointLabel}`;
  };

  const tooltipFormatter = (
    params: CallbackDataParams | CallbackDataParams[],
  ): string | undefined => {
    const item = resolveTripsMapTooltipItem(params);
    if (!item) {
      return undefined;
    }

    if (item.componentType === 'geo') {
      const stateName = item.name != null ? String(item.name) : '';
      return stateName ? (formatStateTooltip(stateName) ?? undefined) : undefined;
    }

    const stateName = item.name != null ? String(item.name) : '';
    if (stateName && isTripsMapGeoRegionTooltip(item)) {
      return formatStateTooltip(stateName) ?? undefined;
    }

    return formatSeriesTooltip(item) ?? undefined;
  };

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      ...TRIPS_MAP_TOOLTIP_BASE,
      formatter: tooltipFormatter,
    },
    geo: {
      map: TRIPS_MAP_GEO_NAME,
      roam: true,
      ...(viewport.boundingCoords
        ? { boundingCoords: viewport.boundingCoords }
        : { center: viewport.center, zoom: viewport.zoom }),
      aspectScale: 0.75,
      layoutCenter: ['50%', '50%'],
      layoutSize: '100%',
      scaleLimit: { min: 0.8, max: 12 },
      tooltip: {
        show: true,
        ...TRIPS_MAP_TOOLTIP_BASE,
        formatter: (params) => {
          const stateName = resolveTripsMapGeoTooltipName(params);
          if (!stateName) {
            return undefined;
          }
          return formatStateTooltip(stateName) ?? undefined;
        },
      },
      label: {
        show: false,
        color: '#475569',
        fontSize: 10,
      },
      itemStyle: {
        areaColor: 'rgba(241, 239, 233, 0.96)',
        borderColor: 'rgba(100, 116, 139, 0.38)',
        borderWidth: 1,
      },
      regions: stateRegions,
      emphasis: {
        label: {
          show: false,
        },
        itemStyle: {
          areaColor: 'rgba(234, 236, 228, 0.94)',
          borderColor: 'rgba(100, 116, 139, 0.48)',
          borderWidth: 1.2,
          shadowBlur: 0,
          shadowColor: 'transparent',
        },
      },
    },
    series: [
      ...(hasMexicoHighways(highways)
        ? [
            {
              name: 'Carreteras',
              type: 'lines' as const,
              coordinateSystem: 'geo' as const,
              polyline: true,
              silent: true,
              animation: false,
              zlevel: 0,
              z: 1,
              lineStyle: {
                color: 'rgba(100, 116, 139, 0.9)',
                width: 0.8,
                opacity: 0.42,
                curveness: 0,
                cap: 'round' as const,
                join: 'round' as const,
              },
              emphasis: { disabled: true },
              effect: { show: false },
              data: buildHighwayLineData(highways),
            },
          ]
        : []),
      ...(hasMexicoPlaces(highways)
        ? [
            {
              name: 'Ciudades',
              type: 'scatter' as const,
              coordinateSystem: 'geo' as const,
              silent: true,
              animation: false,
              zlevel: 0,
              z: 3,
              symbol: 'circle',
              itemStyle: {
                color: 'rgba(71, 85, 105, 0.55)',
                borderWidth: 0,
              },
              label: {
                show: true,
                formatter: '{b}',
                position: 'right' as const,
                distance: 4,
                textBorderColor: 'rgba(248, 250, 252, 0.92)',
                textBorderWidth: 2,
              },
              labelLayout: { hideOverlap: true },
              emphasis: { disabled: true },
              data: buildPlaceLabelData(highways),
            },
          ]
        : []),
      {
        name: 'Rutas',
        type: 'lines',
        coordinateSystem: 'geo',
        polyline: true,
        zlevel: 1,
        data: routes,
      },
      {
        name: 'Origen',
        type: 'scatter',
        coordinateSystem: 'geo',
        zlevel: 2,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: '#16a34a',
          borderColor: '#ffffff',
          borderWidth: 1,
        },
        data: origins,
      },
      {
        name: 'Destino',
        type: 'scatter',
        coordinateSystem: 'geo',
        zlevel: 4,
        z: 4,
        symbol: 'pin',
        symbolSize: 28,
        itemStyle: {
          color: '#dc2626',
        },
        tooltip: {
          show: true,
          ...TRIPS_MAP_TOOLTIP_BASE,
          formatter: formatDestinationTooltip,
        },
        data: destinations,
      },
    ],
  } as EChartsOption;
}
