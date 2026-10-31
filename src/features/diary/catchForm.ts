import { speciesOf } from '@/domain/bite-index';
import type { SpeciesId } from '@/domain/bite-index';
import { formatWeight, parseWeight } from '@/domain/diary';
import type { Attachment, Catch, CatchDraft } from '@/domain/diary';
import type { LatLng } from '@/domain/geo';

/** The form keeps the weight as typed; only saving turns it into a number. */
export type CatchForm = {
  caughtAt: number;
  speciesId: SpeciesId;
  weight: string;
  place: string;
  /** The point on the map behind the name; the name is only its caption. */
  coordinates: LatLng | undefined;
  note: string;
  media: readonly Attachment[];
};

const FALLBACK_SPECIES: SpeciesId = 'pike';

/** "Усі види" is a forecast baseline, not a fish anyone lands. */
export function realSpecies(id: SpeciesId): SpeciesId {
  if (id !== 'all') return id;
  return speciesOf('freshwater')[0] ?? FALLBACK_SPECIES;
}

export function emptyForm(
  now: number,
  speciesId: SpeciesId,
  place: string,
  coordinates?: LatLng,
): CatchForm {
  return {
    caughtAt: now,
    speciesId: realSpecies(speciesId),
    weight: '',
    place,
    coordinates,
    note: '',
    media: [],
  };
}

export function formOf(entry: Catch): CatchForm {
  return {
    caughtAt: entry.caughtAt,
    speciesId: entry.speciesId,
    weight: formatWeight(entry.weightKg),
    place: entry.place,
    coordinates: entry.coordinates,
    note: entry.note,
    media: entry.media,
  };
}

export function draftOf(form: CatchForm): CatchDraft {
  return {
    caughtAt: form.caughtAt,
    speciesId: form.speciesId,
    weightKg: parseWeight(form.weight),
    place: form.place.trim(),
    coordinates: form.coordinates,
    note: form.note.trim(),
    media: form.media,
  };
}
