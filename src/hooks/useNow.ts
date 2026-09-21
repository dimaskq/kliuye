import { useState } from 'react';

/**
 * The wall clock, read once when the screen mounts. Reading it during every
 * render would make "today" change under the user mid-interaction.
 */
export function useNow(): number {
  const [now] = useState(Date.now);
  return now;
}
