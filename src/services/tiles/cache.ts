import { Directory, File, Paths } from 'expo-file-system';

import { tileUrl } from './tileMath';
import type { Tile } from './tileMath';

/**
 * Prefetched tiles are kept as `{z}/{x}/{y}`, two directories deep with no file
 * extension, so the offline map can read them with a plain `file://` template
 * (see `offlineStyle` in the map feature).
 */
const FOLDER = 'map-tiles';

/** Roughly a dozen prefetched areas — enough for a season, small enough to ignore. */
export const TILE_CACHE_LIMIT_BYTES = 48 * 1024 * 1024;

const PARALLEL_DOWNLOADS = 4;
/** The OSM tile policy asks every client to identify itself. */
const USER_AGENT = 'Kliuye/1.0 (fishing forecast; offline map cache)';

function root(): Directory {
  const directory = new Directory(Paths.document, FOLDER);
  directory.create({ intermediates: true, idempotent: true });
  return directory;
}

/** Where the map itself should keep and look for tiles. */
export function tileCachePath(): string | undefined {
  try {
    return root().uri;
  } catch {
    return undefined;
  }
}

function tileFile(tile: Tile): File {
  const directory = new Directory(root(), String(tile.z), String(tile.x));
  directory.create({ intermediates: true, idempotent: true });
  return new File(directory, String(tile.y));
}

/** True when the tile was fetched now; false when it was already there or failed. */
async function download(tile: Tile, signal: AbortSignal | undefined): Promise<boolean> {
  try {
    const file = tileFile(tile);
    if (file.exists) return false;
    await File.downloadFileAsync(tileUrl(tile), file, {
      headers: { 'User-Agent': USER_AGENT },
      idempotent: true,
      ...(signal === undefined ? {} : { signal }),
    });
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
 * so the cache is trimmed silently rather than asking the angler about it.
 */
function enforceLimit(limit: number): void {
  try {
    const entries = files(root()).map((file) => ({ file, size: sizeOf(file) }));
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

/** Downloads whatever is missing, a few at a time. Returns how many were saved. */
export async function cacheTiles(
  tiles: readonly Tile[],
  signal?: AbortSignal,
  limit: number = TILE_CACHE_LIMIT_BYTES,
): Promise<number> {
  let next = 0;
  let saved = 0;

  const worker = async (): Promise<void> => {
    while (next < tiles.length && signal?.aborted !== true) {
      const tile = tiles[next];
      next += 1;
      if (tile !== undefined && (await download(tile, signal))) saved += 1;
    }
  };

  const lanes = Math.min(PARALLEL_DOWNLOADS, tiles.length);
  await Promise.all(Array.from({ length: lanes }, worker));
  if (saved > 0) enforceLimit(limit);
  return saved;
}
