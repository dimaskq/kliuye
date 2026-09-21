import { Directory } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';

import { forgetFiles, pickAttachments, pruneOrphans } from '..';

const picker = ImagePicker.launchImageLibraryAsync as jest.MockedFunction<
  typeof ImagePicker.launchImageLibraryAsync
>;
const thumbnail = VideoThumbnails.getThumbnailAsync as jest.MockedFunction<
  typeof VideoThumbnails.getThumbnailAsync
>;

function asset(over: Record<string, unknown> = {}) {
  return { uri: 'file:///cache/IMG_0001.HEIC', width: 4032, height: 3024, type: 'image', ...over };
}

function returns(...assets: Record<string, unknown>[]) {
  picker.mockResolvedValueOnce({ canceled: false, assets } as never);
}

/** What the app's own media directory holds, as the mocked filesystem sees it. */
const stored = (): string[] =>
  new Directory('file:///documents/', 'catches').list().map((item) => String(item));

beforeEach(() => {
  pruneOrphans([]);
  picker.mockReset();
  thumbnail.mockReset();
  thumbnail.mockResolvedValue({ uri: 'file:///cache/frame.jpg', width: 1, height: 1 });
});

describe('pickAttachments', () => {
  it('copies a picked photo out of the system cache into app storage', async () => {
    returns(asset());
    const [image] = await pickAttachments(6);

    expect(image?.kind).toBe('image');
    expect(image?.uri).toContain('file:///documents/catches');
    expect(image?.uri).toMatch(/\.heic$/);
    /* A photo is its own thumbnail. */
    expect(image?.posterUri).toBe(image?.uri);
    expect([image?.width, image?.height]).toEqual([4032, 3024]);
  });

  it('gives a video a still frame to show in the list', async () => {
    returns(asset({ uri: 'file:///cache/CLIP.mov', type: 'video' }));
    const [video] = await pickAttachments(6);

    expect(video?.kind).toBe('video');
    expect(video?.uri).toMatch(/\.mov$/);
    expect(video?.posterUri).toMatch(/-poster\.jpg$/);
    expect(video?.posterUri).not.toBe(video?.uri);
  });

  it('still keeps the clip when no frame can be extracted', async () => {
    thumbnail.mockRejectedValueOnce(new Error('unsupported codec'));
    returns(asset({ uri: 'file:///cache/CLIP.mov', type: 'video' }));

    const [video] = await pickAttachments(6);
    expect(video?.kind).toBe('video');
    expect(video?.posterUri).toBe('');
  });

  it('gives every attachment its own id', async () => {
    returns(asset(), asset({ uri: 'file:///cache/IMG_0002.jpg' }));
    const picked = await pickAttachments(6);
    expect(new Set(picked.map((item) => item.id)).size).toBe(2);
  });

  it('adds nothing when the picker is dismissed', async () => {
    picker.mockResolvedValueOnce({ canceled: true, assets: null } as never);
    expect(await pickAttachments(6)).toEqual([]);
  });

  it('never opens the picker once the entry is full', async () => {
    expect(await pickAttachments(0)).toEqual([]);
    expect(picker).not.toHaveBeenCalled();
  });

  it('asks the system for no more than the free slots, and enforces it', async () => {
    returns(asset(), asset({ uri: 'file:///cache/b.jpg' }), asset({ uri: 'file:///cache/c.jpg' }));
    const picked = await pickAttachments(2);

    expect(picker).toHaveBeenCalledWith(expect.objectContaining({ selectionLimit: 2 }));
    expect(picked).toHaveLength(2);
  });

  it('asks for photos and videos, and never for EXIF', async () => {
    returns(asset());
    await pickAttachments(6);
    expect(picker).toHaveBeenCalledWith(
      expect.objectContaining({ mediaTypes: ['images', 'videos'], exif: false }),
    );
  });
});

describe('housekeeping', () => {
  it('sweeps files no entry refers to, and keeps the ones that are used', async () => {
    returns(asset({ uri: 'file:///cache/keep.jpg' }), asset({ uri: 'file:///cache/drop.jpg' }));
    const [kept, dropped] = await pickAttachments(6);
    expect(stored()).toHaveLength(2);

    pruneOrphans([kept!.uri]);

    expect(stored()).toEqual([kept?.uri]);
    expect(stored()).not.toContain(dropped?.uri);
  });

  it('deletes the files of an entry that was removed', async () => {
    returns(asset({ uri: 'file:///cache/CLIP.mov', type: 'video' }));
    const [video] = await pickAttachments(6);
    expect(stored()).toHaveLength(2);

    forgetFiles([video!.uri, video!.posterUri]);
    expect(stored()).toEqual([]);
  });

  it('treats an already missing file as nothing to do', () => {
    expect(() => forgetFiles(['file:///documents/catches/gone.jpg'])).not.toThrow();
  });
});
