import { useState } from 'react';

import { remainingSlots } from '@/domain/diary';
import type { Attachment } from '@/domain/diary';
import { pickAttachments } from '@/services/media';

export type Attachments = {
  busy: boolean;
  /** True after a picker that failed, so the form can say so instead of nothing. */
  failed: boolean;
  full: boolean;
  add: () => void;
  remove: (id: string) => void;
};

/**
 * Adding photos to the form in hand. Files are only ever written, never
 * deleted here: an entry the angler abandons is cleaned up by `pruneOrphans`,
 * so backing out of an edit can never destroy a saved entry's photo.
 */
export function useAttachments(
  media: readonly Attachment[],
  onChange: (media: readonly Attachment[]) => void,
): Attachments {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const free = remainingSlots(media);

  const add = (): void => {
    setBusy(true);
    pickAttachments(free)
      .then((picked) => {
        setFailed(false);
        if (picked.length > 0) onChange([...media, ...picked]);
      })
      .catch(() => setFailed(true))
      .finally(() => setBusy(false));
  };

  return {
    busy,
    failed,
    full: free === 0,
    add,
    remove: (id) => onChange(media.filter((item) => item.id !== id)),
  };
}
