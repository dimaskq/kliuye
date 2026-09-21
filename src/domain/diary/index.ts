import type { SpeciesId } from '../bite-index';
import type { LatLng } from '../geo';

export type MediaKind = 'image' | 'video';

/** A photo or a clip the angler attached, already copied into app storage. */
export type Attachment = {
  readonly id: string;
  readonly kind: MediaKind;
  readonly uri: string;
  /** Still frame for a video, the photo itself for an image; '' if none exists. */
  readonly posterUri: string;
  readonly width: number;
  readonly height: number;
};

/** More than this in one entry turns the row into a gallery, not a record. */
export const MAX_ATTACHMENTS = 6;

/** One fish, as the angler recorded it. */
export type Catch = {
  readonly id: string;
  /** Epoch milliseconds of the day it was caught. */
  readonly caughtAt: number;
  readonly speciesId: SpeciesId;
  /** Kilograms; 0 when the angler did not weigh it. */
  readonly weightKg: number;
  /** Where it happened: a name the angler sees, and the coordinates behind it. */
  readonly place: string;
  readonly coordinates?: LatLng | undefined;
  readonly note: string;
  readonly media: readonly Attachment[];
};

/** Everything the form collects; the id and nothing else is added on save. */
export type CatchDraft = Omit<Catch, 'id'>;

const MS_PER_DAY = 86_400_000;
const ID_RADIX = 36;
const ID_LENGTH = 6;

/** Unique enough for a local list, with no dependency to pull in. */
export function makeCatchId(now: number, entropy: number): string {
  return `${now.toString(ID_RADIX)}-${entropy.toString(ID_RADIX).slice(2, 2 + ID_LENGTH)}`;
}

/** Local calendar day, so two fish from one morning count as one trip. */
export function dayOf(timestamp: number): number {
  const date = new Date(timestamp);
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY;
}

export type CatchStats = {
  /** Distinct days on the water, not entries. */
  trips: number;
  fish: number;
  /** Heaviest recorded, or 0 while nothing has been weighed. */
  recordKg: number;
  /** Year of the first catch, for "since {{year}}". */
  sinceYear: number | undefined;
};

export function catchStats(catches: readonly Catch[]): CatchStats {
  if (catches.length === 0) return { trips: 0, fish: 0, recordKg: 0, sinceYear: undefined };

  const days = new Set(catches.map((entry) => dayOf(entry.caughtAt)));
  return {
    trips: days.size,
    fish: catches.length,
    recordKg: Math.max(...catches.map((entry) => entry.weightKg)),
    sinceYear: new Date(Math.min(...catches.map((entry) => entry.caughtAt))).getFullYear(),
  };
}

/** Room left for more photos on this entry. */
export function remainingSlots(media: readonly Attachment[]): number {
  return Math.max(0, MAX_ATTACHMENTS - media.length);
}

/** Every file an entry owns, so deleting the entry deletes its media too. */
export function filesOf(media: readonly Attachment[]): string[] {
  return media
    .flatMap((item) => (item.posterUri === item.uri ? [item.uri] : [item.uri, item.posterUri]))
    .filter((uri) => uri !== '');
}

/** Newest first; two fish on one day keep the order they were entered. */
export function byNewest(catches: readonly Catch[]): Catch[] {
  return [...catches].sort((a, b) => b.caughtAt - a.caughtAt);
}

/** Heaviest freshwater fish in the region is well under this; a typo is not. */
export const MAX_WEIGHT_KG = 200;
export const NOTE_LIMIT = 500;
export const PLACE_LIMIT = 60;

/** Moves the date by whole days, keeping the time of day. */
export function shiftDays(timestamp: number, delta: number): number {
  const date = new Date(timestamp);
  date.setDate(date.getDate() + delta);
  return date.getTime();
}

/** A fish cannot be caught tomorrow, so the date field stops at today. */
export function canShift(timestamp: number, delta: number, now: number): boolean {
  return delta < 0 || dayOf(shiftDays(timestamp, delta)) <= dayOf(now);
}

/**
 * "2,4" and "2.4" both mean 2.4 kg — the comma is the decimal separator in
 * Ukrainian and Bulgarian keyboards. Anything unreadable weighs nothing.
 */
export function parseWeight(input: string): number {
  const value = Number.parseFloat(input.replace(',', '.'));
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(Math.round(value * 100) / 100, MAX_WEIGHT_KG);
}

/** Kilograms as the angler typed them back into the field. */
export function formatWeight(weightKg: number): string {
  return weightKg === 0 ? '' : String(weightKg);
}
