import AsyncStorage from '@react-native-async-storage/async-storage';

import { migrateStorage, readJson, removeKey, storageKeys, writeJson } from '../storage';

type Stored = { language: string };

const parse = (input: unknown): Stored | undefined =>
  typeof input === 'object' && input !== null && 'language' in input
    ? (input as Stored)
    : undefined;

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('storage', () => {
  it('round-trips a value', async () => {
    await writeJson(storageKeys.preferences, { language: 'uk' });
    await expect(readJson(storageKeys.preferences, parse)).resolves.toEqual({ language: 'uk' });
  });

  it('returns nothing for a key that was never written', async () => {
    await expect(readJson(storageKeys.selection, parse)).resolves.toBeUndefined();
  });

  it('returns nothing for a corrupt value instead of throwing', async () => {
    await AsyncStorage.setItem(storageKeys.preferences, 'not json');
    await expect(readJson(storageKeys.preferences, parse)).resolves.toBeUndefined();
  });

  it('removes a key', async () => {
    await writeJson(storageKeys.selection, { language: 'en' });
    await removeKey(storageKeys.selection);
    await expect(readJson(storageKeys.selection, parse)).resolves.toBeUndefined();
  });

  it('namespaces and versions every key', () => {
    Object.values(storageKeys).forEach((key) => expect(key).toMatch(/^kliuye\.v\d+\./));
  });

  it('drops keys left by an older storage version', async () => {
    await AsyncStorage.setItem('kliuye.v0.preferences', '{}');
    await writeJson(storageKeys.preferences, { language: 'uk' });
    await migrateStorage();

    await expect(AsyncStorage.getItem('kliuye.v0.preferences')).resolves.toBeNull();
    await expect(readJson(storageKeys.preferences, parse)).resolves.toEqual({ language: 'uk' });
  });

  it('leaves the store alone when there is nothing to migrate', async () => {
    await writeJson(storageKeys.preferences, { language: 'uk' });
    await migrateStorage();
    await expect(readJson(storageKeys.preferences, parse)).resolves.toEqual({ language: 'uk' });
  });

  it('survives a failing storage backend', async () => {
    const failure = new Error('disk full');
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(failure);
    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(failure);
    jest.spyOn(AsyncStorage, 'getAllKeys').mockRejectedValueOnce(failure);

    await expect(writeJson(storageKeys.spots, [])).resolves.toBeUndefined();
    await expect(removeKey(storageKeys.spots)).resolves.toBeUndefined();
    await expect(migrateStorage()).resolves.toBeUndefined();
  });
});
