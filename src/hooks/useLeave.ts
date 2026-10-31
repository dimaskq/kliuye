import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/**
 * Leaves a page: back where the angler came from, or — when the page was the
 * first thing opened, after a reload or from a link — to `fallback`. A bare
 * `router.back()` there does nothing ("GO_BACK was not handled") and left the
 * journal form with no way out.
 */
export function useLeave(fallback: Href = '/'): () => void {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  }, [fallback, router]);
}
