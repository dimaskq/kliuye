import * as Location from 'expo-location';

import { CUSTOM_SPOT_ID } from '@/domain/spots';
import { useSelection } from '@/store';
import { act, renderHook, waitFor } from '@tests/render';

import { usePickPoint } from '../usePickPoint';

const mocked = Location as jest.Mocked<typeof Location>;
const VARNA = { latitude: 43.21, longitude: 27.91 };
const KYIV = { latitude: 50.45, longitude: 30.52 };
/* Places the geocoder has never named, so no cached name can stand in. */
const NAMELESS = { latitude: 44.11, longitude: 28.63 };
const UNREACHABLE = { latitude: 45.32, longitude: 29.74 };
const initialSelection = useSelection.getState();

beforeEach(() => {
  jest.useRealTimers();
  useSelection.setState(initialSelection, true);
  mocked.reverseGeocodeAsync.mockResolvedValue([{ city: 'Варна' }] as never);
});

describe('usePickPoint', () => {
  it('takes effect at once, then fills in the settlement name', async () => {
    const { result } = await renderHook(() => usePickPoint());
    await act(async () => {
      result.current(VARNA);
    });

    expect(useSelection.getState().selectedSpotId).toBe(CUSTOM_SPOT_ID);
    await waitFor(() => expect(useSelection.getState().customPoint?.label).toBe('Варна'));
    expect(useSelection.getState().customPoint).toMatchObject(VARNA);
  });

  it('keeps the point when the geocoder has no name for it', async () => {
    mocked.reverseGeocodeAsync.mockResolvedValue([] as never);
    const { result } = await renderHook(() => usePickPoint());
    await act(async () => {
      result.current(NAMELESS);
    });

    await waitFor(() => expect(useSelection.getState().customPoint).toMatchObject(NAMELESS));
    expect(useSelection.getState().customPoint?.label).toBe('');
  });

  it('survives a geocoder that throws, as it does in a browser', async () => {
    mocked.reverseGeocodeAsync.mockRejectedValue(new Error('not supported on web'));
    const { result } = await renderHook(() => usePickPoint());
    await act(async () => {
      result.current(UNREACHABLE);
    });

    await waitFor(() => expect(useSelection.getState().customPoint).toMatchObject(UNREACHABLE));
    expect(useSelection.getState().customPoint?.label).toBe('');
  });

  it('drops a late name for a point the user has already moved away from', async () => {
    let resolveFirst: (value: unknown) => void = () => undefined;
    mocked.reverseGeocodeAsync
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)) as never)
      .mockResolvedValueOnce([{ city: 'Київ' }] as never);

    const { result } = await renderHook(() => usePickPoint());
    await act(async () => {
      result.current(VARNA);
    });
    await act(async () => {
      result.current(KYIV);
    });
    await waitFor(() => expect(useSelection.getState().customPoint?.label).toBe('Київ'));

    await act(async () => {
      resolveFirst([{ city: 'Варна' }]);
    });
    expect(useSelection.getState().customPoint).toEqual({ ...KYIV, label: 'Київ' });
  });
});
