import { onlineManager } from '@tanstack/react-query';
import { File } from 'expo-file-system';

import { SettingsScreen } from '@/features/settings';
import { cacheTiles, clearTileCache, tilesAround } from '@/services/tiles';
import { renderWithProviders, screen } from '@tests/render';

import { OfflineNotice } from '../OfflineNotice';

afterEach(async () => {
  onlineManager.setOnline(true);
  await clearTileCache();
});

describe('OfflineNotice', () => {
  it('says nothing while there is a connection', async () => {
    onlineManager.setOnline(true);
    await renderWithProviders(<OfflineNotice />);
    expect(screen.queryByText(/Немає зв/)).toBeNull();
  });

  it('states that what is on screen came from the cache', async () => {
    onlineManager.setOnline(false);
    await renderWithProviders(<OfflineNotice />);
    expect(screen.getByText(/Немає зв/)).toBeOnTheScreen();
  });
});

describe('the map cache seen from the settings screen', () => {
  it('reports nothing stored before a single tile is fetched', async () => {
    await renderWithProviders(<SettingsScreen />);
    expect(await screen.findByText('На пристрої: 0.0 МБ')).toBeOnTheScreen();
    expect(screen.queryByText('Очистити')).toBeNull();
  });

  it('offers to free the space once tiles are on disk', async () => {
    await cacheTiles(tilesAround({ latitude: 50.45, longitude: 30.52 }, 12, 3));
    expect(File.downloadFileAsync).toHaveBeenCalled();

    await renderWithProviders(<SettingsScreen />);
    expect(await screen.findByText('Очистити')).toBeOnTheScreen();
  });
});
