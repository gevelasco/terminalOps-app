import type { TripMapItem } from '@shared/models/api/api-trips-map.model';
import { buildTripsMapChartData, buildTripsMapEchartsOption } from './trips-map-echarts-option';

function item(): TripMapItem {
  return {
    id: 't-1',
    maneuverCode: 'CHI-0001',
    status: 'in_transit',
    origin: {
      lat: 19.43,
      lng: -99.13,
      label: 'CDMX',
      source: 'operational_center',
    },
    destination: {
      lat: 25.68,
      lng: -100.31,
      label: 'MTY',
      source: 'destination_rate',
    },
    geoQuality: 'resolved',
  };
}

describe('buildTripsMapChartData', () => {
  it('falls back to origin-destination when OSRM geometry is missing', () => {
    const { routes } = buildTripsMapChartData([item()]);
    expect(routes[0]?.coords).toEqual([
      [-99.13, 19.43],
      [-100.31, 25.68],
    ]);
    expect(routes[0]?.lineStyle.curveness).toBe(0);
  });

  it('uses the road polyline when geometry is available', () => {
    const geometry: Array<[number, number]> = [
      [-99.13, 19.43],
      [-99.5, 20.1],
      [-100.0, 22.0],
      [-100.31, 25.68],
    ];
    const { routes } = buildTripsMapChartData(
      [item()],
      new Map([['t-1', geometry]]),
    );
    expect(routes[0]?.coords).toEqual(geometry);
    expect(routes[0]?.coords.length).toBeGreaterThan(2);
  });
});

describe('buildTripsMapEchartsOption highways', () => {
  it('omits the highway layer when there are no roads', () => {
    const option = buildTripsMapEchartsOption([item()]);
    const series = option.series as Array<{ name?: string }>;
    expect(series.map((entry) => entry.name)).toEqual(['Rutas', 'Origen', 'Destino']);
  });

  it('gives idle states a muted fill so roads do not sit on white', () => {
    const option = buildTripsMapEchartsOption([item()]);
    const geo = option.geo as { itemStyle?: { areaColor?: string } };
    expect(geo.itemStyle?.areaColor).toBe('rgba(241, 239, 233, 0.96)');
  });

  it('draws silent gray highways under the colored trip route', () => {
    const option = buildTripsMapEchartsOption([item()], null, undefined, {
      major: [
        [
          [-99.13, 19.43],
          [-100.31, 25.68],
        ],
      ],
      secondary: [
        [
          [-98.2, 19.0],
          [-97.8, 18.9],
        ],
      ],
      places: [],
    });
    const series = option.series as Array<{
      name?: string;
      silent?: boolean;
      zlevel?: number;
      data?: unknown[];
      lineStyle?: { width?: number };
    }>;
    expect(series[0]?.name).toBe('Carreteras');
    expect(series[0]?.silent).toBeTrue();
    expect(series[0]?.zlevel).toBe(0);
    expect(series[0]?.data).toHaveSize(2);
    expect(series[0]?.lineStyle?.width).toBe(0.8);
    expect(series[1]?.name).toBe('Rutas');
    expect(series[1]?.zlevel).toBe(1);
  });

  it('labels important cities under the trip route and hides overlap', () => {
    const option = buildTripsMapEchartsOption([item()], null, undefined, {
      major: [],
      secondary: [],
      places: [{ name: 'Guadalajara', rank: 1, coord: [-103.35, 20.67] }],
    });
    const series = option.series as Array<{
      name?: string;
      silent?: boolean;
      labelLayout?: { hideOverlap?: boolean };
    }>;
    expect(series[0]?.name).toBe('Ciudades');
    expect(series[0]?.silent).toBeTrue();
    expect(series[0]?.labelLayout?.hideOverlap).toBeTrue();
    expect(series[1]?.name).toBe('Rutas');
  });
});
