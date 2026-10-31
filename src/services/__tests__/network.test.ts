/* eslint-disable @typescript-eslint/no-require-imports -- a reset registry can only be re-entered with require. */
import type * as ReactQuery from '@tanstack/react-query';
import type * as ExpoNetwork from 'expo-network';
import type { AppStateStatic } from 'react-native';

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

  it('reads the state again when the app returns from the background', async () => {
    const { network, expoNetwork } = freshModules();
    const { AppState } = require('react-native') as { AppState: AppStateStatic };
    let onChange: ((status: string) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      onChange = listener as typeof onChange;
      return { remove: jest.fn() } as never;
    });
    expoNetwork.addNetworkStateListener.mockReturnValue({ remove: jest.fn() } as never);
    /* Android blocked the app while it was in recents, and never said it stopped. */
    expoNetwork.getNetworkStateAsync.mockResolvedValueOnce({
      isConnected: false,
      isInternetReachable: false,
    } as never);

    network.startNetworkWatch();
    await flush();
    expect(network.isOnline()).toBe(false);

    expoNetwork.getNetworkStateAsync.mockResolvedValueOnce({
      isConnected: true,
      isInternetReachable: true,
    } as never);
    onChange?.('active');
    await flush();

    expect(network.isOnline()).toBe(true);
  });
});

describe('reportReachable', () => {
  it('takes any answer from a server as proof of a connection', () => {
    const { network, onlineManager } = freshModules();
    onlineManager.setOnline(false);

    network.reportReachable();

    expect(network.isOnline()).toBe(true);
  });
});
