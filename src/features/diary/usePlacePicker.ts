import { useCallback, useEffect, useRef, useState } from 'react';

import type { LatLng } from '@/domain/geo';
import type { CustomPoint } from '@/domain/spots';
import { useDeviceLocation } from '@/hooks';
import { reverseGeocode } from '@/services/places';

import type { CatchFormState } from './useCatchForm';

type FormAccess = Pick<CatchFormState, 'form' | 'set'>;
type Apply = (point: LatLng, name?: string) => void;

export type PlacePicker = {
  /** Which chooser is open, if any. */
  open: 'map' | 'saved' | undefined;
  show: (which: 'map' | 'saved') => void;
  close: () => void;
  /** Waiting for the device to say where it is. */
  locating: boolean;
  /** The angler said no to location; the map and the list still work. */
  locationDenied: boolean;
  fromMap: (point: LatLng) => void;
  fromSaved: (point: CustomPoint) => void;
  fromHere: () => void;
};

/**
 * Sets the point, and names it — unless the angler typed a name of their own.
 * A name that arrived with an earlier point is fair game; a typed one is not.
 */
function useApplyPoint({ form, set }: FormAccess): Apply {
  const autoName = useRef(form.place);
  const typed = useRef(form.place);
  useEffect(() => {
    typed.current = form.place;
  }, [form.place]);

  return useCallback(
    (point, name) => {
      set('coordinates', { latitude: point.latitude, longitude: point.longitude });
      const nameIt = (found: string): void => {
        if (typed.current.trim() !== '' && typed.current !== autoName.current) return;
        autoName.current = found;
        set('place', found);
      };
      if (name !== undefined && name !== '') nameIt(name);
      else void reverseGeocode(point).then((found) => found !== undefined && nameIt(found));
    },
    [set],
  );
}

/** "Where I am": the position now, or as soon as the permission prompt is answered. */
function useHere(apply: Apply) {
  const device = useDeviceLocation();
  const [asked, setAsked] = useState(false);
  const pending = useRef(false);

  useEffect(() => {
    if (!pending.current || device.origin === undefined) return;
    pending.current = false;
    apply(device.origin, device.city);
  }, [apply, device.city, device.origin]);

  const fromHere = (): void => {
    if (device.origin !== undefined) return apply(device.origin, device.city);
    pending.current = true;
    setAsked(true);
    device.request();
  };
  const waiting = asked && device.origin === undefined && device.status !== 'denied';
  return { fromHere, locating: waiting, locationDenied: device.status === 'denied' };
}

/**
 * Where the fish was caught: a point on the map, where the angler stands, or a
 * saved place. The name stays a caption the angler can still type over.
 */
export function usePlacePicker(access: FormAccess): PlacePicker {
  const apply = useApplyPoint(access);
  const here = useHere(apply);
  const [open, setOpen] = useState<PlacePicker['open']>();

  return {
    open,
    show: setOpen,
    close: () => setOpen(undefined),
    ...here,
    fromMap: (point) => {
      setOpen(undefined);
      apply(point);
    },
    fromSaved: (point) => apply(point, point.label),
  };
}
