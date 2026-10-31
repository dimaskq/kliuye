/**
 * The browser hands back a `blob:` address that dies with the page, so a photo
 * in the journal was a blank tile after a reload. The preview instead keeps the
 * picture itself, scaled down and inlined as a JPEG data URL, small enough for
 * the browser's storage.
 */
const QUALITY = 0.82;

function load(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image could not be read'));
    image.src = uri;
  });
}

export async function persistableImage(uri: string, maxSide: number): Promise<string> {
  if (uri.startsWith('data:')) return uri;
  try {
    const image = await load(uri);
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', QUALITY);
  } catch {
    /* Better a picture that lasts the session than none at all. */
    return uri;
  }
}
