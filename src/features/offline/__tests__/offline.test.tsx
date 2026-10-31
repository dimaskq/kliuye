import { onlineManager } from '@tanstack/react-query';
import { File } from 'expo-file-system';
import { HttpResponse, http } from 'msw';

import { SettingsScreen } from '@/features/settings';
import { TILEJSON_URL, cacheTiles, clearTileCache, tilesAround } from '@/services/tiles';
import { usePreferences } from '@/store';
import { server } from '@tests/msw/server';
import { fireEvent, renderWithProviders, screen } from '@tests/render';

import { OfflineNotice } from '../OfflineNotice';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
beforeEach(() => {
  server.use(
    http.get(TILEJSON_URL, () =>
      HttpResponse.json({ tiles: ['https://tiles.example.test/{z}/{x}/{y}.pbf'] }),
    ),
  );
});
afterAll(() => server.close());

afterEach(async () => {
  server.resetHandlers();
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

describe('the tips, again', () => {
  it('brings back both tours from the settings screen', async () => {
    usePreferences.setState({ onboardingDone: true, featureTourDone: true });
    await renderWithProviders(<SettingsScreen />);
    await fireEvent.press(screen.getByRole('link', { name: 'Показати підказки ще раз' }));
    expect(usePreferences.getState().onboardingDone).toBe(false);
    expect(usePreferences.getState().featureTourDone).toBe(false);
  });
});
