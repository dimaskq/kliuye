import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Every persisted key is namespaced and versioned, so a schema change is a
 * migration rather than a corrupt read (STORE_REVIEW.md §2).
 */
export const STORAGE_VERSION = 1;
const NAMESPACE = `kliuye.v${STORAGE_VERSION}`;

export const storageKeys = {
  preferences: `${NAMESPACE}.preferences`,
  selection: `${NAMESPACE}.selection`,
  queryCache: `${NAMESPACE}.query-cache`,
  angler: `${NAMESPACE}.angler`,
  points: `${NAMESPACE}.points`,
  diary: `${NAMESPACE}.diary`,
  spots: `${NAMESPACE}.spots`,
  places: `${NAMESPACE}.places`,
} as const;

export type StorageKey = (typeof storageKeys)[keyof typeof storageKeys];

/** Nothing sensitive is stored, so a failed read degrades to "no value". */
export async function readJson<T>(
  key: StorageKey,
  parse: (input: unknown) => T | undefined,
): Promise<T | undefined> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw === null ? undefined : parse(JSON.parse(raw) as unknown);
  } catch {
    return undefined;
  }
}

export async function writeJson(key: StorageKey, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* A full disk must not take the app down; the next write will retry. */
  }
}

export async function removeKey(key: StorageKey): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    /* Nothing to recover: the value is either gone or unreadable anyway. */
  }
}

/** Drops keys left behind by earlier storage versions. */
export async function migrateStorage(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const stale = keys.filter(
      (key) => key.startsWith('kliuye.v') && !key.startsWith(`${NAMESPACE}.`),
    );
    if (stale.length > 0) await AsyncStorage.multiRemove(stale);
  } catch {
    /* Migration is best effort — a failure leaves the old keys in place. */
  }
}
