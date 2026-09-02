/** Compact Natural Earth 10m extract: Mexico highways and important places. */
export type MexicoMapPlaceRank = 0 | 1 | 2;

export type MexicoMapPlace = {
  name: string;
  rank: MexicoMapPlaceRank;
  coord: readonly [number, number];
};

export type MexicoHighwaysJson = {
  major: ReadonlyArray<ReadonlyArray<readonly [number, number]>>;
  secondary: ReadonlyArray<ReadonlyArray<readonly [number, number]>>;
  places: readonly MexicoMapPlace[];
};

export const EMPTY_MEXICO_HIGHWAYS: MexicoHighwaysJson = {
  major: [],
  secondary: [],
  places: [],
};

export type HighwayLineDatum = {
  coords: Array<[number, number]>;
};

export type MexicoPlaceLabelDatum = {
  name: string;
  rank: MexicoMapPlaceRank;
  value: [number, number];
  symbolSize: number;
  label: {
    fontSize: number;
    fontWeight: 400 | 500 | 600;
    color: string;
  };
};

function isFiniteCoord(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parsePolyline(value: unknown): Array<[number, number]> | null {
  if (!Array.isArray(value) || value.length < 2) {
    return null;
  }
  const coords: Array<[number, number]> = [];
  for (const point of value) {
    if (!Array.isArray(point) || point.length < 2) {
      return null;
    }
    const lng = point[0];
    const lat = point[1];
    if (!isFiniteCoord(lng) || !isFiniteCoord(lat)) {
      return null;
    }
    coords.push([lng, lat]);
  }
  return coords.length >= 2 ? coords : null;
}

function parseBucket(value: unknown): Array<Array<[number, number]>> {
  if (!Array.isArray(value)) {
    return [];
  }
  const lines: Array<Array<[number, number]>> = [];
  for (const entry of value) {
    const line = parsePolyline(entry);
    if (line) {
      lines.push(line);
    }
  }
  return lines;
}

function parsePlaceRank(value: unknown): MexicoMapPlaceRank {
  if (value === 0 || value === 1 || value === 2) {
    return value;
  }
  return 2;
}

function parsePlace(value: unknown): MexicoMapPlace | null {
  if (Array.isArray(value) && value.length >= 4) {
    const name = typeof value[0] === 'string' ? value[0].trim() : '';
    const lng = value[2];
    const lat = value[3];
    if (!name || !isFiniteCoord(lng) || !isFiniteCoord(lat)) {
      return null;
    }
    return { name, rank: parsePlaceRank(value[1]), coord: [lng, lat] };
  }
  return null;
}

function parsePlaces(value: unknown): MexicoMapPlace[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const places: MexicoMapPlace[] = [];
  for (const entry of value) {
    const place = parsePlace(entry);
    if (place) {
      places.push(place);
    }
  }
  return places;
}

export function parseMexicoHighwaysJson(raw: unknown): MexicoHighwaysJson {
  if (!raw || typeof raw !== 'object') {
    return EMPTY_MEXICO_HIGHWAYS;
  }
  const record = raw as Record<string, unknown>;
  return {
    major: parseBucket(record['major']),
    secondary: parseBucket(record['secondary']),
    places: parsePlaces(record['places']),
  };
}

export function hasMexicoHighways(
  highways: MexicoHighwaysJson | null | undefined,
): highways is MexicoHighwaysJson {
  return Boolean(highways && (highways.major.length > 0 || highways.secondary.length > 0));
}

export function hasMexicoPlaces(
  highways: MexicoHighwaysJson | null | undefined,
): highways is MexicoHighwaysJson {
  return Boolean(highways && highways.places.length > 0);
}

function toLineData(
  lines: ReadonlyArray<ReadonlyArray<readonly [number, number]>>,
): HighwayLineDatum[] {
  return lines.map((coords) => ({
    coords: coords.map(([lng, lat]) => [lng, lat] as [number, number]),
  }));
}

export function buildHighwayLineData(
  highways: MexicoHighwaysJson | null | undefined,
): HighwayLineDatum[] {
  if (!highways) {
    return [];
  }
  return toLineData([...highways.major, ...highways.secondary]);
}

const PLACE_LABEL_STYLE: Record<
  MexicoMapPlaceRank,
  MexicoPlaceLabelDatum['label'] & { symbolSize: number }
> = {
  0: { fontSize: 11, fontWeight: 600, color: '#334155', symbolSize: 4 },
  1: { fontSize: 9, fontWeight: 500, color: '#475569', symbolSize: 3 },
  2: { fontSize: 8, fontWeight: 400, color: '#94a3b8', symbolSize: 0 },
};

export function buildPlaceLabelData(
  highways: MexicoHighwaysJson | null | undefined,
): MexicoPlaceLabelDatum[] {
  if (!highways) {
    return [];
  }
  return highways.places.map((place) => {
    const style = PLACE_LABEL_STYLE[place.rank];
    return {
      name: place.name,
      rank: place.rank,
      value: [place.coord[0], place.coord[1]],
      symbolSize: style.symbolSize,
      label: {
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        color: style.color,
      },
    };
  });
}
