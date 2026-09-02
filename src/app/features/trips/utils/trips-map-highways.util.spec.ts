import {
  buildHighwayLineData,
  buildPlaceLabelData,
  parseMexicoHighwaysJson,
  type MexicoHighwaysJson,
} from './trips-map-highways.util';

describe('parseMexicoHighwaysJson', () => {
  it('returns empty buckets for invalid payloads', () => {
    expect(parseMexicoHighwaysJson(null)).toEqual({
      major: [],
      secondary: [],
      places: [],
    });
    expect(parseMexicoHighwaysJson({ major: 'nope' })).toEqual({
      major: [],
      secondary: [],
      places: [],
    });
  });

  it('keeps only polylines with two or more finite coordinates', () => {
    const parsed = parseMexicoHighwaysJson({
      major: [
        [
          [-99.13, 19.43],
          [-100.31, 25.68],
        ],
        [[-99, 19]],
        'skip',
      ],
      secondary: [
        [
          [-98.2, 19.0],
          [null, 19.1],
        ],
      ],
    });
    expect(parsed.major).toEqual([
      [
        [-99.13, 19.43],
        [-100.31, 25.68],
      ],
    ]);
    expect(parsed.secondary).toEqual([]);
    expect(parsed.places).toEqual([]);
  });

  it('parses compact place tuples', () => {
    const parsed = parseMexicoHighwaysJson({
      places: [
        ['Guadalajara', 1, -103.35, 20.67],
        ['bad'],
        ['Colima', 2, -103.73, 19.24],
      ],
    });
    expect(parsed.places).toEqual([
      { name: 'Guadalajara', rank: 1, coord: [-103.35, 20.67] },
      { name: 'Colima', rank: 2, coord: [-103.73, 19.24] },
    ]);
  });
});

describe('buildHighwayLineData', () => {
  it('draws major and secondary roads as one set of polylines', () => {
    const highways: MexicoHighwaysJson = {
      major: [
        [
          [-99.1, 19.4],
          [-100.3, 25.7],
        ],
      ],
      secondary: [
        [
          [-98.2, 19.0],
          [-97.8, 18.9],
        ],
      ],
      places: [],
    };
    expect(buildHighwayLineData(highways)).toEqual([
      {
        coords: [
          [-99.1, 19.4],
          [-100.3, 25.7],
        ],
      },
      {
        coords: [
          [-98.2, 19.0],
          [-97.8, 18.9],
        ],
      },
    ]);
  });
});

describe('buildPlaceLabelData', () => {
  it('uses a larger label for metros than for towns', () => {
    const data = buildPlaceLabelData({
      major: [],
      secondary: [],
      places: [
        { name: 'Ciudad de México', rank: 0, coord: [-99.13, 19.43] },
        { name: 'Colima', rank: 2, coord: [-103.73, 19.24] },
      ],
    });
    expect(data[0]?.label.fontSize).toBeGreaterThan(data[1]?.label.fontSize ?? 0);
    expect(data[0]?.name).toBe('Ciudad de México');
  });
});
