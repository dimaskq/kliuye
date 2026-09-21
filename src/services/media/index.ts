import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Platform } from 'react-native';

import { makeCatchId } from '@/domain/diary';
import type { Attachment, MediaKind } from '@/domain/diary';

const FOLDER = 'catches';
/** Kept apart from the journal's folder, whose orphans get pruned. */
const PROFILE_FOLDER = 'profile';
/** A frame from a second in: the very first frame is often still black. */
const POSTER_AT_MS = 1000;
const IMAGE_QUALITY = 0.8;

/** Web has no app-owned storage here; the browser preview keeps the blob URI. */
const isWeb = Platform.OS === 'web';

function folder(name: string = FOLDER): Directory {
  const dir = new Directory(Paths.document, name);
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/**
 * Copies a picked file out of the system cache, which the OS may clear at any
 * moment, into the app's own documents directory.
 */
async function keep(sourceUri: string, name: string, into?: string): Promise<string> {
  if (isWeb) return sourceUri;
  const target = new File(folder(into), name);
  await new File(sourceUri).copy(target);
  return target.uri;
}

function extensionOf(uri: string, fallback: string): string {
  const match = /\.([a-z0-9]{2,5})(?:\?|$)/i.exec(uri);
  return match?.[1]?.toLowerCase() ?? fallback;
}

async function posterFor(videoUri: string, id: string): Promise<string> {
  try {
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, { time: POSTER_AT_MS });
    return await keep(uri, `${id}-poster.jpg`);
  } catch {
    /* No poster is a cosmetic loss: the row still shows the clip as a video. */
    return '';
  }
}

async function attach(asset: ImagePicker.ImagePickerAsset): Promise<Attachment> {
  const kind: MediaKind = asset.type === 'video' ? 'video' : 'image';
  const id = makeCatchId(Date.now(), Math.random());
  const name = `${id}.${extensionOf(asset.uri, kind === 'video' ? 'mp4' : 'jpg')}`;
  const uri = await keep(asset.uri, name);
  const posterUri = kind === 'video' ? await posterFor(asset.uri, id) : uri;
  return { id, kind, uri, posterUri, width: asset.width, height: asset.height };
}

/**
 * Opens the system photo picker. Since SDK 51 this needs no permission on
 * either platform — the OS hands back only what the user chose, which is why
 * the app declares no media permission at all (RELEASE.md §5).
 */
export async function pickAttachments(limit: number): Promise<Attachment[]> {
  if (limit <= 0) return [];
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    allowsMultipleSelection: true,
    selectionLimit: limit,
    quality: IMAGE_QUALITY,
    exif: false,
  });
  if (result.canceled) return [];
  return Promise.all(result.assets.slice(0, limit).map(attach));
}

/**
 * The angler's own photo, cropped square by the system picker. A fresh name
 * each time, so an image cache never shows the previous face.
 */
export async function pickAvatar(): Promise<string | undefined> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: IMAGE_QUALITY,
    exif: false,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  if (asset === undefined) return undefined;
  return keep(asset.uri, `avatar-${Date.now()}.${extensionOf(asset.uri, 'jpg')}`, PROFILE_FOLDER);
}

/** Removing an attachment removes its file; a missing file is not an error. */
export function forgetFiles(uris: readonly string[]): void {
  if (isWeb) return;
  for (const uri of uris) {
    try {
      new File(uri).delete();
    } catch {
      /* Already gone, or never written — nothing to clean up. */
    }
  }
}

/** Files left behind by a form the angler abandoned before saving. */
export function pruneOrphans(kept: readonly string[]): void {
  if (isWeb) return;
  try {
    const keep = new Set(kept);
    for (const item of folder().list()) {
      if (item instanceof File && !keep.has(item.uri)) item.delete();
    }
  } catch {
    /* Housekeeping only; never let it break opening the journal. */
  }
}
