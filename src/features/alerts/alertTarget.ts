import { SPECIES_IDS } from '@/domain/bite-index';
import type { SpeciesId } from '@/domain/bite-index';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import type { Language } from '@/i18n';
import { readJson, removeKey, storageKeys, writeJson } from '@/services/storage';
import { nullable, number, object, schema, string } from '@/services/validation';

/**
 * What the background refresh needs to plan alerts without the app open: the
 * place (it cannot ask for the position in the background, by design), its
 * name, the species and the language. Written only while alerts are on.
 */
export type AlertTarget = {
  latitude: number;
  longitude: number;
  shoreBearingDeg: number | null;
  place: string;
  species: SpeciesId;
  language: Language;
};

const shape = schema(
  object({
    latitude: number,
    longitude: number,
    shoreBearingDeg: nullable(number),
    place: string,
    species: string,
    language: string,
  }),
);

function parse(input: unknown): AlertTarget | undefined {
  const result = shape.safeParse(input);
  if (!result.success) return undefined;
  const { species, language } = result.data;
  if (!SPECIES_IDS.includes(species as SpeciesId)) return undefined;
  if (!SUPPORTED_LANGUAGES.includes(language as Language)) return undefined;
  return { ...result.data, species: species as SpeciesId, language: language as Language };
}

export function saveAlertTarget(target: AlertTarget): Promise<void> {
  return writeJson(storageKeys.alertTarget, target);
}

export function readAlertTarget(): Promise<AlertTarget | undefined> {
  return readJson(storageKeys.alertTarget, parse);
}

export function clearAlertTarget(): Promise<void> {
  return removeKey(storageKeys.alertTarget);
}
