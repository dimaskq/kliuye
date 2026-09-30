import type { Polygon } from '@/domain/coast';

/**
 * Just enough of the Mapbox Vector Tile format (protobuf, spec v2) to read the
 * sea: the `water` layer, its `class` field and its polygon outlines. Every
 * other layer is skipped without being decoded.
 */

export type WaterFeature = {
  className: string | undefined;
  polygons: Polygon[];
};

export type WaterLayer = {
  extent: number;
  features: WaterFeature[];
};

const WATER_LAYER = 'water';
const DEFAULT_EXTENT = 4096;
const POLYGON = 3;

/* Protobuf wire types. */
const VARINT = 0;
const FIXED64 = 1;
const LENGTH_DELIMITED = 2;
const FIXED32 = 5;

/* Geometry commands. */
const MOVE_TO = 1;
const LINE_TO = 2;
const CLOSE_PATH = 7;

class Reader {
  position = 0;

  constructor(private readonly bytes: Uint8Array) {}

  get done(): boolean {
    return this.position >= this.bytes.length;
  }

  /* Multiplies rather than shifts: tile values can pass 2^31, where JS bit ops wrap. */
  varint(): number {
    let value = 0;
    let factor = 1;
    let byte: number;
    do {
      if (this.done) throw new Error('Truncated vector tile');
      byte = this.bytes[this.position++]!;
      value += (byte & 0x7f) * factor;
      factor *= 128;
    } while (byte >= 0x80);
    return value;
  }

  /** The end offset of a length-delimited field that starts here. */
  end(): number {
    const length = this.varint();
    const end = this.position + length;
    if (end > this.bytes.length) throw new Error('Truncated vector tile');
    return end;
  }

  string(): string {
    const end = this.end();
    let text = '';
    for (let i = this.position; i < end; i += 1)
      text += `%${this.bytes[i]!.toString(16).padStart(2, '0')}`;
    this.position = end;
    try {
      return decodeURIComponent(text);
    } catch {
      /* Malformed UTF-8 in some name we never look at must not sink the tile. */
      return '';
    }
  }

  packed(): number[] {
    const end = this.end();
    const values: number[] = [];
    while (this.position < end) values.push(this.varint());
    return values;
  }

  skip(wireType: number): void {
    if (wireType === VARINT) this.varint();
    else if (wireType === FIXED64) this.position += 8;
    else if (wireType === LENGTH_DELIMITED) this.position = this.end();
    else if (wireType === FIXED32) this.position += 4;
    else throw new Error(`Unsupported wire type ${wireType}`);
  }
}

function zigzag(value: number): number {
  return value % 2 === 0 ? value / 2 : -(value + 1) / 2;
}

/** Closes a ring and files it: an outer ring opens a polygon, anything else is its hole. */
function closeRing(ring: [number, number][], polygons: [number, number][][][]): void {
  if (ring.length === 0) return;
  ring.push(ring[0]!);
  if (signedArea(ring) > 0 || polygons.length === 0) polygons.push([ring]);
  else polygons.at(-1)!.push(ring);
}

/**
 * Turns the command stream into rings. A new outer ring — positive area in the
 * tile's y-down grid — starts a new polygon; the rings after it are its holes.
 */
function decodePolygons(geometry: readonly number[]): Polygon[] {
  const polygons: [number, number][][][] = [];
  let ring: [number, number][] = [];
  let x = 0;
  let y = 0;
  let i = 0;

  while (i < geometry.length) {
    const command = geometry[i]! & 0x7;
    const count = geometry[i]! >> 3;
    i += 1;
    if (command === CLOSE_PATH) {
      closeRing(ring, polygons);
      ring = [];
      continue;
    }
    for (let n = 0; n < count; n += 1) {
      x += zigzag(geometry[i]!);
      y += zigzag(geometry[i + 1]!);
      i += 2;
      if (command === MOVE_TO) ring = [[x, y]];
      else if (command === LINE_TO) ring.push([x, y]);
    }
  }
  return polygons;
}

function signedArea(ring: readonly (readonly [number, number])[]): number {
  let sum = 0;
  for (let i = 1; i < ring.length; i += 1) {
    const [ax, ay] = ring[i - 1]!;
    const [bx, by] = ring[i]!;
    sum += ax * by - bx * ay;
  }
  return sum / 2;
}

type RawFeature = { type: number; tags: number[]; geometry: number[] };

function readFeature(reader: Reader, end: number): RawFeature {
  const feature: RawFeature = { type: 0, tags: [], geometry: [] };
  while (reader.position < end) {
    const tag = reader.varint();
    const field = Math.floor(tag / 8);
    if (field === 2) feature.tags = reader.packed();
    else if (field === 3) feature.type = reader.varint();
    else if (field === 4) feature.geometry = reader.packed();
    else reader.skip(tag & 0x7);
  }
  return feature;
}

/** Only string values matter here: `class` is the one field we read. */
function readValue(reader: Reader, end: number): string | undefined {
  let value: string | undefined;
  while (reader.position < end) {
    const tag = reader.varint();
    if (Math.floor(tag / 8) === 1) value = reader.string();
    else reader.skip(tag & 0x7);
  }
  return value;
}

/** The layer's name, found without decoding its features. */
function layerName(reader: Reader, end: number): string {
  let name = '';
  while (reader.position < end) {
    const tag = reader.varint();
    if (Math.floor(tag / 8) === 1) name = reader.string();
    else reader.skip(tag & 0x7);
  }
  return name;
}

function readLayer(reader: Reader, end: number): WaterLayer {
  let extent = DEFAULT_EXTENT;
  const keys: string[] = [];
  const values: (string | undefined)[] = [];
  const raw: RawFeature[] = [];

  while (reader.position < end) {
    const tag = reader.varint();
    const field = Math.floor(tag / 8);
    if (field === 2) {
      const featureEnd = reader.end();
      raw.push(readFeature(reader, featureEnd));
    } else if (field === 3) keys.push(reader.string());
    else if (field === 4) {
      const valueEnd = reader.end();
      values.push(readValue(reader, valueEnd));
    } else if (field === 5) extent = reader.varint();
    else reader.skip(tag & 0x7);
  }

  const classKey = keys.indexOf('class');
  const features = raw
    .filter((feature) => feature.type === POLYGON)
    .map((feature) => {
      let className: string | undefined;
      for (let i = 0; i + 1 < feature.tags.length; i += 2) {
        if (feature.tags[i] === classKey) className = values[feature.tags[i + 1]!];
      }
      return { className, polygons: decodePolygons(feature.geometry) };
    });

  return { extent, features };
}

/**
 * The tile's `water` layer, or `undefined` when the tile has none — a tile
 * wholly on land.
 * @throws Error on a malformed tile.
 */
export function readWaterLayer(bytes: Uint8Array): WaterLayer | undefined {
  const reader = new Reader(bytes);
  while (!reader.done) {
    const tag = reader.varint();
    if (Math.floor(tag / 8) === 3 && (tag & 0x7) === LENGTH_DELIMITED) {
      const end = reader.end();
      const start = reader.position;
      if (layerName(reader, end) === WATER_LAYER) {
        reader.position = start;
        return readLayer(reader, end);
      }
    } else {
      reader.skip(tag & 0x7);
    }
  }
  return undefined;
}
