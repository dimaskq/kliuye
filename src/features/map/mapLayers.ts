import type { MapLayer } from '@/store';
import type { IconName } from '@/ui';

/** One glyph per look, so the choice reads before its name does. */
export const MAP_LAYER_ICONS: Readonly<Record<MapLayer, IconName>> = {
  standard: 'map',
  terrain: 'mountain',
  light: 'sun',
  dark: 'moon',
};
