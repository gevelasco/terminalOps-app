/**
 * Builds public/geo/mexico-highways.json from Natural Earth 10m
 * (public domain): Mexico major + secondary highways and important places.
 *
 * Usage: node scripts/build-mexico-highways.mjs
 */
import { execFileSync } from 'node:child_process';
import { createWriteStream, readFileSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = join(ROOT, 'scripts', '.cache', 'ne_basemap');
const OUT_PATH = join(ROOT, 'public', 'geo', 'mexico-highways.json');

const ROADS_URL = 'https://naciscdn.org/naturalearth/10m/cultural/ne_10m_roads.zip';
const PLACES_URL =
  'https://naciscdn.org/naturalearth/10m/cultural/ne_10m_populated_places.zip';

const MEXICO_CODES = new Set(['MEX']);
const MAJOR_TYPES = new Set(['Major Highway']);
const SECONDARY_TYPES = new Set(['Secondary Highway']);
const COORD_DECIMALS = 4;
const SIMPLIFY_EPSILON = 0.006;
const MAX_PLACE_SCALERANK = 6;
const PLACE_NAME_ES = {
  'Mexico City': 'Ciudad de México',
};
const METRO_NAMES = new Set(['Ciudad de México', 'Guadalajara', 'Monterrey']);

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });

  const roadsDir = join(CACHE_DIR, 'roads');
  const placesDir = join(CACHE_DIR, 'places');
  await downloadAndUnzip(ROADS_URL, join(CACHE_DIR, 'ne_10m_roads.zip'), roadsDir);
  await downloadAndUnzip(
    PLACES_URL,
    join(CACHE_DIR, 'ne_10m_populated_places.zip'),
    placesDir,
  );

  const { major, secondary } = extractRoads(roadsDir);
  const places = extractPlaces(placesDir);

  const payload = { major, secondary, places };
  await writeFile(OUT_PATH, JSON.stringify(payload));
  await rm(CACHE_DIR, { recursive: true, force: true });

  const bytes = Buffer.byteLength(JSON.stringify(payload));
  console.log(
    `Wrote ${OUT_PATH} (${(bytes / 1024).toFixed(1)} KB, ${major.length} major, ${secondary.length} secondary, ${places.length} places)`,
  );
}

async function downloadAndUnzip(url, zipPath, destDir) {
  await mkdir(destDir, { recursive: true });
  await download(url, zipPath);
  execFileSync('unzip', ['-o', zipPath, '-d', destDir], { stdio: 'ignore' });
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

function extractRoads(dir) {
  const records = readDbf(readFileSync(join(dir, 'ne_10m_roads.dbf')));
  const geometries = readShpPolylines(readFileSync(join(dir, 'ne_10m_roads.shp')));
  const major = [];
  const secondary = [];

  for (let i = 0; i < records.length; i++) {
    const props = records[i];
    const type = String(props.type ?? '').trim();
    const country = String(props.sov_a3 ?? props.adm0_a3 ?? '').trim();
    if (!MEXICO_CODES.has(country)) {
      continue;
    }
    const bucket = MAJOR_TYPES.has(type)
      ? major
      : SECONDARY_TYPES.has(type)
        ? secondary
        : null;
    if (!bucket) {
      continue;
    }
    for (const line of geometries[i] ?? []) {
      const simplified = roundLine(simplifyLine(line, SIMPLIFY_EPSILON));
      if (simplified.length >= 2) {
        bucket.push(simplified);
      }
    }
  }
  return { major, secondary };
}

function extractPlaces(dir) {
  const records = readDbf(readFileSync(join(dir, 'ne_10m_populated_places.dbf')));
  const points = readShpPoints(readFileSync(join(dir, 'ne_10m_populated_places.shp')));
  const places = [];
  const seen = new Set();

  for (let i = 0; i < records.length; i++) {
    const props = records[i];
    const country = String(props.ADM0_A3 ?? props.adm0_a3 ?? '').trim();
    if (!MEXICO_CODES.has(country)) {
      continue;
    }
    const feature = String(props.FEATURECLA ?? props.featurecla ?? '').trim();
    const scalerank = Number(props.SCALERANK ?? props.scalerank ?? 99);
    const isCapital = /admin-[01] capital/i.test(feature);
    if (!isCapital && !(Number.isFinite(scalerank) && scalerank <= MAX_PLACE_SCALERANK)) {
      continue;
    }
    const point = points[i];
    if (!point) {
      continue;
    }
    const rawName = String(props.NAME ?? props.NAMEASCII ?? props.name ?? '').trim();
    const name = PLACE_NAME_ES[rawName] ?? rawName;
    if (!name) {
      continue;
    }
    const key = name.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const rank =
      METRO_NAMES.has(name) || scalerank <= 1 ? 0 : isCapital || scalerank <= 3 ? 1 : 2;
    const factor = 10 ** COORD_DECIMALS;
    const lng = Math.round(point[0] * factor) / factor;
    const lat = Math.round(point[1] * factor) / factor;
    if (lng < -118.7 || lng > -86.4 || lat < 14.3 || lat > 32.8) {
      continue;
    }
    places.push([name, rank, lng, lat]);
  }

  places.sort((a, b) => a[1] - b[1] || String(a[0]).localeCompare(String(b[0]), 'es'));
  return places;
}

function readDbf(buf) {
  const recordCount = buf.readUInt32LE(4);
  const headerLength = buf.readUInt16LE(8);
  const recordLength = buf.readUInt16LE(10);
  const fields = [];
  let offset = 32;
  while (offset < headerLength - 1 && buf[offset] !== 0x0d) {
    const name = buf.subarray(offset, offset + 11).toString('ascii').replace(/\0/g, '').trim();
    const length = buf[offset + 16];
    fields.push({ name, length });
    offset += 32;
  }

  const records = [];
  let cursor = headerLength;
  for (let i = 0; i < recordCount; i++) {
    const deleted = buf[cursor] === 0x2a;
    let fieldOffset = cursor + 1;
    const record = {};
    for (const field of fields) {
      const raw = buf.subarray(fieldOffset, fieldOffset + field.length);
      const utf8 = raw.toString('utf8').replace(/\0/g, '').trim();
      record[field.name] = utf8.includes('\uFFFD')
        ? raw.toString('latin1').replace(/\0/g, '').trim()
        : utf8;
      fieldOffset += field.length;
    }
    if (!deleted) {
      records.push(record);
    }
    cursor += recordLength;
  }
  return records;
}

function readShpPolylines(buf) {
  return readShpRecords(buf, parsePolylineContent);
}

function readShpPoints(buf) {
  return readShpRecords(buf, parsePointContent);
}

function readShpRecords(buf, parseContent) {
  const geometries = [];
  let offset = 100;
  while (offset + 8 <= buf.length) {
    const contentLength = buf.readInt32BE(offset + 4) * 2;
    const contentStart = offset + 8;
    geometries.push(parseContent(buf, contentStart));
    offset = contentStart + contentLength;
  }
  return geometries;
}

function parsePolylineContent(buf, offset) {
  const shapeType = buf.readInt32LE(offset);
  if (shapeType !== 3 && shapeType !== 13 && shapeType !== 23) {
    return [];
  }
  const numParts = buf.readInt32LE(offset + 36);
  const numPoints = buf.readInt32LE(offset + 40);
  const partsStart = offset + 44;
  const parts = [];
  for (let i = 0; i < numParts; i++) {
    parts.push(buf.readInt32LE(partsStart + i * 4));
  }
  const pointsStart = partsStart + numParts * 4;
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const x = buf.readDoubleLE(pointsStart + i * 16);
    const y = buf.readDoubleLE(pointsStart + i * 16 + 8);
    points.push([x, y]);
  }
  const lines = [];
  for (let i = 0; i < parts.length; i++) {
    const start = parts[i];
    const end = i + 1 < parts.length ? parts[i + 1] : numPoints;
    const slice = points.slice(start, end);
    if (slice.length >= 2) {
      lines.push(slice);
    }
  }
  return lines;
}

function parsePointContent(buf, offset) {
  const shapeType = buf.readInt32LE(offset);
  if (shapeType !== 1 && shapeType !== 11 && shapeType !== 21) {
    return null;
  }
  return [buf.readDoubleLE(offset + 4), buf.readDoubleLE(offset + 12)];
}

function simplifyLine(points, epsilon) {
  if (points.length <= 2) {
    return points;
  }
  let maxDist = 0;
  let index = 0;
  const first = points[0];
  const last = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last);
    if (dist > maxDist) {
      index = i;
      maxDist = dist;
    }
  }
  if (maxDist <= epsilon) {
    return [first, last];
  }
  const left = simplifyLine(points.slice(0, index + 1), epsilon);
  const right = simplifyLine(points.slice(index), epsilon);
  return left.slice(0, -1).concat(right);
}

function perpendicularDistance(point, start, end) {
  const [x, y] = point;
  const [x1, y1] = start;
  const [x2, y2] = end;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    return Math.hypot(x - x1, y - y1);
  }
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(x - projX, y - projY);
}

function roundLine(points) {
  const factor = 10 ** COORD_DECIMALS;
  const rounded = [];
  let prev = '';
  for (const [lng, lat] of points) {
    const next = [Math.round(lng * factor) / factor, Math.round(lat * factor) / factor];
    const key = `${next[0]},${next[1]}`;
    if (key !== prev) {
      rounded.push(next);
      prev = key;
    }
  }
  return rounded;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
