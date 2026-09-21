import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { CustomPoint } from '@/domain/spots';
import { useChoosePoint } from '@/hooks';
import { usePoints } from '@/store';

export type MapDialog = 'save' | 'route' | 'places' | undefined;

/**
 * What the map's buttons do. Forecasting lives on Today, so opening and saving
 * both end there.
 */
export function useMapDialogs(point: CustomPoint | undefined) {
  const router = useRouter();
  const choosePoint = useChoosePoint();
  const keep = usePoints((state) => state.keep);
  const fallbackName = useTranslation().t('spots.custom.unnamed');
  const [dialog, setDialog] = useState<MapDialog>(undefined);

  const open = (): void => router.navigate('/');
  const close = (): void => setDialog(undefined);

  const save = (name: string): void => {
    close();
    if (point === undefined) return;
    const named = { ...point, label: name.trim() || point.label || fallbackName };
    choosePoint(named);
    keep(named);
    open();
  };

  return { dialog, show: setDialog, close, open, save };
}
