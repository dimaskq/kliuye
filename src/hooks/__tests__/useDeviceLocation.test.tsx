import * as Location from 'expo-location';

import { useLocation } from '@/store';
import { act, renderHook, waitFor } from '@tests/render';

import { useDeviceLocation } from '../useDeviceLocation';

const mocked = Location as jest.Mocked<typeof Location>;
const FIX = { coords: { latitude: 43.21, longitude: 27.91 } };
const initialLocation = useLocation.getState();

beforeEach(() => {
  jest.useRealTimers();
  useLocation.setState(initialLocation, true);
  mocked.getForegroundPermissionsAsync.mockResolvedValue({ granted: false } as never);
  mocked.requestForegroundPermissionsAsync.mockResolvedValue({ granted: false } as never);
  mocked.getLastKnownPositionAsync.mockResolvedValue(FIX as never);
  mocked.reverseGeocodeAsync.mockResolvedValue([{ city: 'Варна' }] as never);
});

describe('useDeviceLocation', () => {
  it('never prompts on mount — it only reads the stored answer', async () => {
    const { result } = await renderHook(() => useDeviceLocation());
    await waitFor(() => expect(mocked.getForegroundPermissionsAsync).toHaveBeenCalled());
    expect(mocked.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('loads the position and its settlement once the permission is granted', async () => {
    mocked.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
    const { result } = await renderHook(() => useDeviceLocation());
    await act(async () => {
      result.current.request();
    });

    await waitFor(() => expect(result.current.status).toBe('granted'));
    expect(result.current.origin).toEqual({ latitude: 43.21, longitude: 27.91 });
    expect(result.current.city).toBe('Варна');
  });

  it('reads a position straight away when the permission is already granted', async () => {
    mocked.getForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
    const { result } = await renderHook(() => useDeviceLocation());
    await waitFor(() => expect(result.current.status).toBe('granted'));
  });

  it('records a refusal without throwing, leaving the app usable', async () => {
    const { result } = await renderHook(() => useDeviceLocation());
    await act(async () => {
      result.current.request();
    });
    await waitFor(() => expect(result.current.status).toBe('denied'));
    expect(result.current.origin).toBeUndefined();
  });

  it('falls back to a fresh fix when there is no last known position', async () => {
    mocked.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mocked.getLastKnownPositionAsync.mockResolvedValue(null as never);
    mocked.getCurrentPositionAsync.mockResolvedValue(FIX as never);

    const { result } = await renderHook(() => useDeviceLocation());
    await act(async () => {
      result.current.request();
    });
    await waitFor(() => expect(mocked.getCurrentPositionAsync).toHaveBeenCalled());
    expect(mocked.getCurrentPositionAsync).toHaveBeenCalledWith(
      expect.objectContaining({ mayShowUserSettingsDialog: false }),
    );
  });

  it('keeps the position when reverse geocoding fails', async () => {
    mocked.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
    /* A shore no name was ever learned for: nothing cached can fill it in. */
    mocked.getLastKnownPositionAsync.mockResolvedValue({
      coords: { latitude: 46.17, longitude: 30.35 },
    } as never);
    mocked.reverseGeocodeAsync.mockRejectedValue(new Error('offline'));

    const { result } = await renderHook(() => useDeviceLocation());
    await act(async () => {
      result.current.request();
    });
    await waitFor(() => expect(result.current.status).toBe('granted'));
    expect(result.current.city).toBeUndefined();
  });

  it('treats a position failure as a refusal rather than a crash', async () => {
    mocked.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mocked.getLastKnownPositionAsync.mockRejectedValue(new Error('no gps'));
    mocked.getCurrentPositionAsync.mockRejectedValue(new Error('no gps'));

    const { result } = await renderHook(() => useDeviceLocation());
    await act(async () => {
      result.current.request();
    });
    await waitFor(() => expect(result.current.status).toBe('denied'));
  });
});
