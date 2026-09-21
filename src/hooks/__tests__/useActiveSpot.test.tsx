import { CURRENT_LOCATION_SPOT_ID, DEFAULT_SPOT } from '@/domain/spots';
import { useLocation, useSelection } from '@/store';
import { renderHook, waitFor } from '@tests/render';

import { useActiveSpot } from '../useActiveSpot';

const VARNA = { latitude: 43.21, longitude: 27.91 };
const initialLocation = useLocation.getState();
const initialSelection = useSelection.getState();

beforeEach(() => {
  jest.useRealTimers();
  useLocation.setState({ ...initialLocation, hydrated: true }, true);
  useSelection.setState(initialSelection, true);
});

describe('useActiveSpot', () => {
  it('falls back to the bundled water when nothing is known', async () => {
    const { result } = await renderHook(() => useActiveSpot());
    expect(result.current.spot.id).toBe(DEFAULT_SPOT.id);
    expect(result.current.isCurrentLocation).toBe(false);
    expect(result.current.canOfferLocation).toBe(true);
  });

  it('forecasts for the device position once one is known', async () => {
    useLocation.setState({ status: 'granted', origin: VARNA, city: 'Варна', hydrated: true });
    const { result } = await renderHook(() => useActiveSpot());

    await waitFor(() => expect(result.current.isCurrentLocation).toBe(true));
    expect(result.current.spot.coordinates).toEqual(VARNA);
    expect(result.current.spot.id).toBe(CURRENT_LOCATION_SPOT_ID);
    expect(result.current.city).toBe('Варна');
    expect(result.current.canOfferLocation).toBe(false);
  });

  it('leaves the wind direction neutral for a position with no known bank', async () => {
    useLocation.setState({ status: 'granted', origin: VARNA, hydrated: true });
    const { result } = await renderHook(() => useActiveSpot());
    expect(result.current.spot.shoreBearingDeg).toBeUndefined();
  });

  it('lets an explicit choice win over the device position', async () => {
    useLocation.setState({ status: 'granted', origin: VARNA, hydrated: true });
    useSelection.setState({ selectedSpotId: 's3' });
    const { result } = await renderHook(() => useActiveSpot());

    expect(result.current.spot.id).toBe('s3');
    expect(result.current.isCurrentLocation).toBe(false);
  });

  it('stops offering the permission once a water was chosen by hand', async () => {
    useSelection.setState({ selectedSpotId: 's2' });
    const { result } = await renderHook(() => useActiveSpot());
    expect(result.current.canOfferLocation).toBe(false);
  });

  it('stops offering the permission after a refusal', async () => {
    useLocation.setState({ status: 'denied', hydrated: true });
    const { result } = await renderHook(() => useActiveSpot());
    expect(result.current.canOfferLocation).toBe(false);
    expect(result.current.spot.id).toBe(DEFAULT_SPOT.id);
  });
});
