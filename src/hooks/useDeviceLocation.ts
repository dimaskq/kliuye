import * as Location from 'expo-location';
import { useCallback, useEffect } from 'react';

import type { LatLng } from '@/domain/geo';
import { reverseGeocode } from '@/services/places';
import { useLocation } from '@/store';
import type { LocationStatus } from '@/store';

export type DeviceLocation = {
  status: LocationStatus;
  origin: LatLng | undefined;
  city: string | undefined;
  /** Asks for the permission. Only ever called from an explicit tap. */
  request: () => void;
};

async function readPosition(): Promise<LatLng> {
  const known = await Location.getLastKnownPositionAsync({});
  const fix =
    known ??
    (await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low,
      /* Android would otherwise pop Google's "Location Accuracy" sheet at launch
         whenever location services are off; the app just carries on without. */
      mayShowUserSettingsDialog: false,
    }));
  return { latitude: fix.coords.latitude, longitude: fix.coords.longitude };
}

/**
 * Coarse, when-in-use location shared by every screen. Denial is a normal
 * state: the app keeps working from the bundled catalogue.
 */
export function useDeviceLocation(): DeviceLocation {
  const { status, origin, city, hydrated, setDenied, setPosition, setHydrated } = useLocation();

  const load = useCallback(async () => {
    try {
      const position = await readPosition();
      setPosition(position, await reverseGeocode(position));
    } catch {
      setDenied();
    }
  }, [setDenied, setPosition]);

  useEffect(() => {
    if (hydrated) return;
    /* Reads the stored answer without prompting; a prompt needs an explicit tap. */
    void Location.getForegroundPermissionsAsync().then((permission) =>
      permission.granted ? load() : setHydrated(),
    );
  }, [hydrated, load, setHydrated]);

  const request = useCallback(() => {
    void Location.requestForegroundPermissionsAsync().then((permission) =>
      permission.granted ? load() : setDenied(),
    );
  }, [load, setDenied]);

  return { status, origin, city, request };
}
