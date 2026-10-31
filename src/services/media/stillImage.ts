/**
 * On a phone a picked file is copied into the app's own folder, so its address
 * outlives the picker. Nothing to do here; the browser preview has its own
 * version of this file.
 */
export function persistableImage(uri: string, _maxSide: number): Promise<string> {
  return Promise.resolve(uri);
}
