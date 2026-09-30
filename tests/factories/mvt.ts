/**
 * A minimal Mapbox Vector Tile encoder, so tests describe a tile as data —
 * layers, features, rings in tile units — instead of shipping binary fixtures.
 */

export type TestFeature = {
  /** 1 point, 2 line, 3 polygon. */
  type?: number;
  properties?: Record<string, string>;
  /** Rings as the tile stores them: closed implicitly, y grows downward. */
  rings: [number, number][][];
};

export type TestLayer = {
  name: string;
  extent?: number;
  features: TestFeature[];
};

function varint(value: number): number[] {
  const out: number[] = [];
  let rest = value;
  while (rest >= 0x80) {
    out.push((rest % 0x80) | 0x80);
    rest = Math.floor(rest / 0x80);
  }
  out.push(rest);
  return out;
}

function zigzag(value: number): number {
  return value >= 0 ? value * 2 : -value * 2 - 1;
}

function key(field: number, wireType: number): number[] {
  return varint(field * 8 + wireType);
}

export function bytesField(field: number, bytes: number[]): number[] {
  return [...key(field, 2), ...varint(bytes.length), ...bytes];
}

function stringField(field: number, text: string): number[] {
  return bytesField(field, [...new TextEncoder().encode(text)]);
}

function packed(field: number, values: number[]): number[] {
  return bytesField(field, values.flatMap(varint));
}

function geometry(rings: [number, number][][]): number[] {
  const commands: number[] = [];
  let x = 0;
  let y = 0;
  for (const ring of rings) {
    const [first, ...rest] = ring;
    commands.push((1 << 3) | 1, zigzag(first![0] - x), zigzag(first![1] - y));
    [x, y] = first!;
    commands.push((rest.length << 3) | 2);
    for (const [px, py] of rest) {
      commands.push(zigzag(px - x), zigzag(py - y));
      [x, y] = [px, py];
    }
    commands.push((1 << 3) | 7);
  }
  return commands;
}

export function encodeLayer({ name, extent, features }: TestLayer): number[] {
  const keys: string[] = [];
  const values: string[] = [];
  const index = (list: string[], item: string): number => {
    if (!list.includes(item)) list.push(item);
    return list.indexOf(item);
  };

  const encodedFeatures = features.map((feature) => {
    const tags = Object.entries(feature.properties ?? {}).flatMap(([k, v]) => [
      index(keys, k),
      index(values, v),
    ]);
    return bytesField(2, [
      ...packed(2, tags),
      ...key(3, 0),
      ...varint(feature.type ?? 3),
      ...packed(4, geometry(feature.rings)),
    ]);
  });

  return bytesField(3, [
    ...stringField(1, name),
    ...encodedFeatures.flat(),
    ...keys.flatMap((k) => stringField(3, k)),
    ...values.flatMap((v) => bytesField(4, stringField(1, v))),
    ...(extent === undefined ? [] : [...key(5, 0), ...varint(extent)]),
  ]);
}

export function encodeTile(layers: TestLayer[]): Uint8Array {
  return new Uint8Array(layers.flatMap(encodeLayer));
}

/** An axis-aligned square ring, clockwise in the tile's y-down grid — an outer ring. */
export function square(x: number, y: number, size: number): [number, number][] {
  return [
    [x, y],
    [x + size, y],
    [x + size, y + size],
    [x, y + size],
  ];
}

/** The same square wound the other way — a hole. */
export function hole(x: number, y: number, size: number): [number, number][] {
  return square(x, y, size).reverse();
}
