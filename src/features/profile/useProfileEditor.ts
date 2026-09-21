import { useRef, useState } from 'react';

import { forgetFiles, pickAvatar } from '@/services/media';
import { useAngler } from '@/store';

/** The photo being chosen, and every file picked on the way to it. */
function usePhotoDraft() {
  const [photo, setPhoto] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const picked = useRef<string[]>([]);

  const choose = (): void => {
    setBusy(true);
    pickAvatar()
      .then((uri) => {
        setFailed(false);
        if (uri === undefined) return;
        picked.current.push(uri);
        setPhoto(uri);
      })
      .catch(() => setFailed(true))
      .finally(() => setBusy(false));
  };

  const reset = (uri: string): string[] => {
    const all = picked.current;
    picked.current = [];
    setPhoto(uri);
    setFailed(false);
    return all;
  };

  return { photo, busy, failed, choose, remove: () => setPhoto(''), reset };
}

/**
 * Editing the local profile as a draft: nothing changes until Save, and a
 * photo picked and then abandoned is deleted rather than left on the disk.
 */
export function useProfileEditor() {
  const { displayName, avatarUri, setDisplayName, setAvatarUri } = useAngler();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(displayName);
  const draft = usePhotoDraft();

  const start = (): void => {
    setName(displayName);
    draft.reset(avatarUri);
    setOpen(true);
  };

  const finish = (saved: boolean): void => {
    const kept = saved ? draft.photo : avatarUri;
    const unused = [...draft.reset(kept), ...(saved ? [avatarUri] : [])];
    forgetFiles(unused.filter((uri) => uri !== '' && uri !== kept));
    if (saved) {
      setDisplayName(name.trim());
      setAvatarUri(kept);
    }
    setOpen(false);
  };

  return {
    open,
    name,
    setName,
    start,
    draft,
    save: () => finish(true),
    cancel: () => finish(false),
  };
}

export type ProfileEditor = ReturnType<typeof useProfileEditor>;
