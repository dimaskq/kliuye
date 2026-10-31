import type { Polygon } from '@/domain/coast';

import { decodeLines, decodePolygons } from './geometry';
import type { Line } from './geometry';

export type { Line } from './geometry';

/**
 * Just enough of the Mapbox Vector Tile format (protobuf, spec v2) to read
 * water: the `water` layer with its `class` field and polygon outlines, and the
 * `waterway` layer's river and stream lines. Every other layer is skipped
 * without being decoded.
 */

export type WaterFeature = {
  className: string | undefined;
  polygons: Polygon[];
};

export type WaterLayer = {
  extent: number;
  features: WaterFeature[];
};

export type WaterwayLayer = {
  extent: number;
  lines: Line[];
};

const WATER_LAYER = 'water';
const WATERWAY_LAYER = 'waterway';
const DEFAULT_EXTENT = 4096;
const LINESTRING = 2;
const POLYGON = 3;

/* Protobuf wire types. */
const VARINT = 0;
const FIXED64 = 1;
const LENGTH_DELIMITED = 2;
const FIXED32 = 5;

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

type RawLayer = {
  extent: number;
  classOf: (feature: RawFeature) => string | undefined;
  raw: RawFeature[];
};

function readRawLayer(reader: Reader, end: number): RawLayer {
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
  const classOf = (feature: RawFeature): string | undefined => {
    let className: string | undefined;
    for (let i = 0; i + 1 < feature.tags.length; i += 2) {
      if (feature.tags[i] === classKey) className = values[feature.tags[i + 1]!];
    }
    return className;
  };

  return { extent, classOf, raw };
}

/** The named layer, undecoded, or `undefined` when the tile has none. */
function findLayer(bytes: Uint8Array, name: string): RawLayer | undefined {
  const reader = new Reader(bytes);
  while (!reader.done) {
    const tag = reader.varint();
    if (Math.floor(tag / 8) === 3 && (tag & 0x7) === LENGTH_DELIMITED) {
      const end = reader.end();
      const start = reader.position;
      if (layerName(reader, end) === name) {
        reader.position = start;
        return readRawLayer(reader, end);
      }
    } else {
      reader.skip(tag & 0x7);
    }
  }
  return undefined;
}

/**
 * The tile's `water` layer, or `undefined` when the tile has none — a tile
 * wholly on land.
 * @throws Error on a malformed tile.
 */
export function readWaterLayer(bytes: Uint8Array): WaterLayer | undefined {
  const layer = findLayer(bytes, WATER_LAYER);
  if (layer === undefined) return undefined;
  return {
    extent: layer.extent,
    features: layer.raw
      .filter((feature) => feature.type === POLYGON)
      .map((feature) => ({
        className: layer.classOf(feature),
        polygons: decodePolygons(feature.geometry),
      })),
  };
}

/**
 * The tile's rivers, canals and streams as lines, or `undefined` when it has
 * none. Narrow water is drawn only this way, never as a polygon.
 * @throws Error on a malformed tile.
 */
export function readWaterwayLayer(bytes: Uint8Array): WaterwayLayer | undefined {
  const layer = findLayer(bytes, WATERWAY_LAYER);
  if (layer === undefined) return undefined;
  return {
    extent: layer.extent,
    lines: layer.raw
      .filter((feature) => feature.type === LINESTRING)
      .flatMap((feature) => decodeLines(feature.geometry)),
  };
}
