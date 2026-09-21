import { onlineManager } from '@tanstack/react-query';
import { File } from 'expo-file-system';

import { clearTileCache } from '@/services/tiles';
import { usePreferences } from '@/store';
import { act, renderHook, waitFor } from '@tests/render';

import { useTileCache, useTilePrefetch } from '../useOfflineMaps';

const KYIV = [{ latitude: 50.45, longitude: 30.52 }];
const download = File.downloadFileAsync as jest.Mock;
const PREFETCH_DELAY_MS = 2000;

beforeEach(async () => {
  onlineManager.setOnline(true);
  usePreferences.getState().setToggle('offlineMaps', true);
  await clearTileCache();
  download.mockClear();
});

afterEach(() => {
  onlineManager.setOnline(true);
});

async function settle(): Promise<void> {
  await act(async () => {
    jest.advanceTimersByTime(PREFETCH_DELAY_MS);
  });
}

describe('useTilePrefetch', () => {
  it('stores the map around the point once the pin has settled', async () => {
    await renderHook(() => useTilePrefetch(KYIV));
    expect(download).not.toHaveBeenCalled();

    await settle();
    await waitFor(() => expect(download).toHaveBeenCalled());
  });

  it('fetches nothing without a connection — there is nothing to fetch with', async () => {
    onlineManager.setOnline(false);
    await renderHook(() => useTilePrefetch(KYIV));
    await settle();
    expect(download).not.toHaveBeenCalled();
  });

  it('respects the switch in settings', async () => {
    usePreferences.getState().setToggle('offlineMaps', false);
    await renderHook(() => useTilePrefetch(KYIV));
    await settle();
    expect(download).not.toHaveBeenCalled();
  });

  it('has nothing to do without a point', async () => {
    await renderHook(() => useTilePrefetch([]));
    await settle();
    expect(download).not.toHaveBeenCalled();
  });

  it('drops the fetch when the screen goes away before the delay is up', async () => {
    const { unmount } = await renderHook(() => useTilePrefetch(KYIV));
    await unmount();
    /* Nothing can render after the unmount, so the timer runs outside `act`. */
    jest.advanceTimersByTime(PREFETCH_DELAY_MS);
    await Promise.resolve();
    expect(download).not.toHaveBeenCalled();
  });
});

describe('useTileCache', () => {
  it('measures what is stored and gives it back on request', async () => {
    const { result } = await renderHook(() => useTileCache());
    await waitFor(() => expect(result.current.busy).toBe(false));
    expect(result.current.bytes).toBe(0);

    await act(async () => {
      result.current.clear();
    });
    await waitFor(() => expect(result.current.busy).toBe(false));
    expect(result.current.bytes).toBe(0);
  });
});
