import { getJson } from '../http';
import { array, object, schema, string } from '../validation';

/**
 * OpenFreeMap: free vector maps from OpenStreetMap data, with no key and no
 * account. Its terms allow an app to save areas for offline use — at most
 * 3,000 tiles or 50 MB per download, at most four requests at a time, under a
 * User-Agent naming the app — which is exactly how the offline map works.
 *
 * OpenStreetMap's own tile servers forbid that kind of prefetch, so the app
 * never talks to them from a phone.
 */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** Names the current planet build; its tile URLs change with every rebuild. */
export const TILEJSON_URL = 'https://tiles.openfreemap.org/planet';

/** The source in the style that the saved tiles stand in for. */
export const VECTOR_SOURCE = 'openmaptiles';

/** Sent with every offline download, as the provider's terms ask. */
export const USER_AGENT = 'Kliuye (com.kliuye.app; fishing forecast; offline map)';

const tileJsonSchema = schema(object({ tiles: array(string) }));

/** The `{z}/{x}/{y}` template of the current vector tile set. */
export async function vectorTileTemplate(signal?: AbortSignal): Promise<string> {
  const parsed = tileJsonSchema.safeParse(await getJson(TILEJSON_URL, { signal }));
  const template = parsed.success ? parsed.data.tiles[0] : undefined;
  if (template === undefined) throw new Error('TileJSON lists no tiles');
  return template;
}
