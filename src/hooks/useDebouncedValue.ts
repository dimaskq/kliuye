import { useEffect, useState } from 'react';

/** Holds a value back until it has stopped changing, so typing is not a request per key. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, value]);

  return settled;
}
