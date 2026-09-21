/* eslint-disable @typescript-eslint/no-require-imports -- a reset registry can only be re-entered with require. */
import type * as ReactQuery from '@tanstack/react-query';
import type * as ExpoNetwork from 'expo-network';

import { isOnlineState } from '../network';
import type * as NetworkModule from '../network';

/** Lets the state read inside the watcher settle. */
async function flush(): Promise<void> {
  for (let step = 0; step < 3; step += 1) await Promise.resolve();
}

/**
 * `startNetworkWatch` installs one listener for the life of the process, so
 * each case gets a fresh module registry — and with it a fresh online manager
 * and a fresh `expo-network` double.
 */
function freshModules() {
  jest.resetModules();
  const network = require('../network') as typeof NetworkModule;
  const { onlineManager } = require('@tanstack/react-query') as typeof ReactQuery;
  const expoNetwork = require('expo-network') as typeof ExpoNetwork;
  return { network, onlineManager, expoNetwork: jest.mocked(expoNetwork) };
}

describe('isOnlineState', () => {
  it('is offline only when the device says so outright', () => {
    expect(isOnlineState({ isConnected: false, isInternetReachable: false })).toBe(false);
    expect(isOnlineState({ isConnected: true, isInternetReachable: false })).toBe(false);
  });

  it('trusts a connection while reachability is still unknown', () => {
    expect(isOnlineState({ isConnected: true, isInternetReachable: null })).toBe(true);
    expect(isOnlineState({})).toBe(true);
  });
});

describe('startNetworkWatch', () => {
  it('hands the device state to the query client and keeps following it', async () => {
    const { network, onlineManager, expoNetwork } = freshModules();
    let emit: ((state: { isConnected: boolean; isInternetReachable: boolean }) => void) | undefined;
    expoNetwork.addNetworkStateListener.mockImplementation((listener) => {
      emit = listener as typeof emit;
      return { remove: jest.fn() } as never;
    });
    expoNetwork.getNetworkStateAsync.mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    } as never);

    const changes: boolean[] = [];
    const unsubscribe = network.subscribeToNetwork(() => changes.push(network.isOnline()));
    network.startNetworkWatch();
    await flush();

    expect(network.isOnline()).toBe(false);
    emit?.({ isConnected: true, isInternetReachable: true });
    expect(network.isOnline()).toBe(true);
    expect(changes).toContain(false);

    unsubscribe();
    onlineManager.setOnline(true);
  });

  it('assumes a connection when the device cannot answer', async () => {
    const { network, onlineManager, expoNetwork } = freshModules();
    onlineManager.setOnline(false);
    expoNetwork.getNetworkStateAsync.mockRejectedValue(new Error('no module'));
    expoNetwork.addNetworkStateListener.mockReturnValue({ remove: jest.fn() } as never);

    network.startNetworkWatch();
    await flush();

    expect(network.isOnline()).toBe(true);
  });

  it('installs its listener once, however often it is called', async () => {
    const { network, expoNetwork } = freshModules();
    expoNetwork.addNetworkStateListener.mockReturnValue({ remove: jest.fn() } as never);

    network.startNetworkWatch();
    network.startNetworkWatch();
    await flush();

    expect(expoNetwork.addNetworkStateListener).toHaveBeenCalledTimes(1);
  });
});
