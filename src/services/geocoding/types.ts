import type { LatLng } from '@/domain/geo';

export type Place = {
  id: string;
  /** Settlement name, already in the requested language. */
  name: string;
  /** "Болгарія · Varna" — country and region, joined for the result row. */
  context: string;
  coordinates: LatLng;
};
