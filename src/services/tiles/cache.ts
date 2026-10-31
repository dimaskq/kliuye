import { Directory, File, Paths } from 'expo-file-system';

import { MAP_STYLE_URL, USER_AGENT, vectorTileTemplate } from './source';
import { tileUrl } from './tileMath';
import type { Tile } from './tileMath';

/**
 * Saved vector tiles are kept as `{z}/{x}/{y}`, two directories deep with no
 * file extension, so the offline map can read them with a plain `file://`
 * template (see `offlineStyle` in the map feature). The map style sits beside
 * them, so offline the map looks the way it does online.
 */
const FOLDER = 'map-vector';
const STYLE_FILE = 'style.json';

/**
 * Raster tiles from OpenStreetMap's servers, as earlier versions kept them.
 * Once OSM blocked the app, what it saved there was its "Access blocked"
 * picture, so the folder is dropped rather than drawn.
 */
const LEGACY_FOLDER = 'map-tiles';

/** Roughly a dozen saved areas — enough for a season, small enough to ignore. */
export const TILE_CACHE_LIMIT_BYTES = 48 * 1024 * 1024;

/** The provider's terms allow four requests at a time; never more. */
const PARALLEL_DOWNLOADS = 4;

const REQUEST = { headers: { 'User-Agent': USER_AGENT }, idempotent: true } as const;

let legacyDropped = false;

function dropLegacy(): void {
  if (legacyDropped) return;
  legacyDropped = true;
  try {
    const legacy = new Directory(Paths.document, LEGACY_FOLDER);
    if (legacy.exists) legacy.delete();
  } catch {
    /* Already gone, or unreadable — either way the map never looks there. */
  }
}

function root(): Directory {
  dropLegacy();
  const directory = new Directory(Paths.document, FOLDER);
  directory.create({ intermediates: true, idempotent: true });
  return directory;
}

/** Where the map should look for saved tiles. */
export function tileCachePath(): string | undefined {
  try {
    return root().uri;
  } catch {
    return undefined;
  }
}

/** The map style saved with the tiles, or `undefined` before the first save. */
export function savedMapStyle(): unknown {
  try {
    const file = new File(root(), STYLE_FILE);
    return file.exists ? (JSON.parse(file.textSync()) as unknown) : undefined;
  } catch {
    return undefined;
  }
}

function tileFile(tile: Tile): File {
  const directory = new Directory(root(), String(tile.z), String(tile.x));
  directory.create({ intermediates: true, idempotent: true });
  return new File(directory, String(tile.y));
}

function withSignal(signal: AbortSignal | undefined) {
  return signal === undefined ? REQUEST : { ...REQUEST, signal };
}

/** The style is small and changes rarely; clearing the cache fetches it afresh. */
async function saveStyle(signal: AbortSignal | undefined): Promise<void> {
  const file = new File(root(), STYLE_FILE);
  if (file.exists) return;
  await File.downloadFileAsync(MAP_STYLE_URL, file, withSignal(signal));
}

/** True when the tile was fetched now; false when it was already there or failed. */
async function download(
  template: string,
  tile: Tile,
  signal: AbortSignal | undefined,
): Promise<boolean> {
  try {
    const file = tileFile(tile);
    if (file.exists) return false;
    /* A non-2xx answer throws here, so an error page is never kept as a tile. */
    await File.downloadFileAsync(tileUrl(template, tile), file, withSignal(signal));
    return true;
  } catch {
    /* A missing tile is a blank square on the map, never a failure to report. */
    return false;
  }
}

function files(directory: Directory): File[] {
  const found: File[] = [];
  for (const item of directory.list()) {
    if (item instanceof File) found.push(item);
    else found.push(...files(item));
  }
  return found;
}

function sizeOf(file: File): number {
  try {
    return file.size;
  } catch {
    /* A file deleted between listing and reading has no size to add. */
    return 0;
  }
}

export function tileCacheSize(): Promise<number> {
  try {
    return Promise.resolve(files(root()).reduce((total, file) => total + sizeOf(file), 0));
  } catch {
    return Promise.resolve(0);
  }
}

export function clearTileCache(): Promise<void> {
  try {
    root().delete();
  } catch {
    /* Nothing cached, or already gone — either way there is nothing to free. */
  }
  return Promise.resolve();
}

function ageOf(file: File): number {
  try {
    return file.info().modificationTime ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Oldest tiles go first. Tiles are worth exactly what they cost to fetch again,
 * so the cache is trimmed silently rather than asking the angler about it. The
 * style is never trimmed: without it no tile can be drawn.
 */
function enforceLimit(limit: number): void {
  try {
    const entries = files(root())
      .filter((file) => !file.uri.endsWith(STYLE_FILE))
      .map((file) => ({ file, size: sizeOf(file) }));
    let total = entries.reduce((sum, entry) => sum + entry.size, 0);
    if (total <= limit) return;

    for (const entry of entries.sort((a, b) => ageOf(a.file) - ageOf(b.file))) {
      if (total <= limit) return;
      entry.file.delete();
      total -= entry.size;
    }
  } catch {
    /* Housekeeping only; a cache that cannot be trimmed still serves tiles. */
  }
}

/**
 * Downloads whatever is missing, at most four at a time, together with the map
 * style. Returns how many tiles were saved; with no answer from the tile server
 * it saves nothing and says so with a zero.
 */
export async function cacheTiles(
  tiles: readonly Tile[],
  signal?: AbortSignal,
  limit: number = TILE_CACHE_LIMIT_BYTES,
): Promise<number> {
  if (tiles.length === 0 || signal?.aborted === true) return 0;

  let template: string;
  try {
    template = await vectorTileTemplate(signal);
    await saveStyle(signal);
  } catch {
    return 0;
  }

  let next = 0;
  let saved = 0;

  const worker = async (): Promise<void> => {
    while (next < tiles.length && signal?.aborted !== true) {
      const tile = tiles[next];
      next += 1;
      if (tile !== undefined && (await download(template, tile, signal))) saved += 1;
    }
  };

  const lanes = Math.min(PARALLEL_DOWNLOADS, tiles.length);
  await Promise.all(Array.from({ length: lanes }, worker));
  if (saved > 0) enforceLimit(limit);
  return saved;
}
