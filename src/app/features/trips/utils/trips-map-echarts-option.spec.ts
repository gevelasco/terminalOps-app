import type { TripMapItem } from '@shared/models/api/api-trips-map.model';
import { buildTripsMapChartData } from './trips-map-echarts-option';

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
