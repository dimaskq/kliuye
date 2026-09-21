import { Directory, File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { HttpResponse, http } from 'msw';

import { ProfileScreen } from '@/features/profile';
import { useAngler } from '@/store';
import { makeForecastResponse, makeMarineResponse } from '@tests/factories/open-meteo';
import { server } from '@tests/msw/server';
import { fireEvent, renderWithProviders, screen, waitFor } from '@tests/render';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';

const picker = ImagePicker.launchImageLibraryAsync as jest.Mock;
const initialAngler = useAngler.getState();

function pickReturns(uri: string): void {
  picker.mockResolvedValueOnce({
    canceled: false,
    assets: [{ uri, width: 400, height: 400, type: 'image' }],
  });
}

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
beforeEach(() => {
  jest.useRealTimers();
  useAngler.setState(initialAngler, true);
  server.use(
    http.get(FORECAST_URL, () => HttpResponse.json(makeForecastResponse())),
    http.get(MARINE_URL, () => HttpResponse.json(makeMarineResponse())),
  );
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function openEditor(): Promise<void> {
  await renderWithProviders(<ProfileScreen />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Рибалка' }));
}

describe('editing the profile', () => {
  it('renames the angler, and only on save', async () => {
    await openEditor();
    await fireEvent.changeText(screen.getByLabelText("Ім'я"), '  Тарас Коваль ');
    expect(useAngler.getState().displayName).toBe('');

    await fireEvent.press(screen.getByRole('button', { name: 'Зберегти' }));
    expect(useAngler.getState().displayName).toBe('Тарас Коваль');
    expect(await screen.findByText('Тарас Коваль')).toBeOnTheScreen();
  }, 20_000);

  it('keeps a square photo in the app’s own storage', async () => {
    pickReturns('file:///cache/face.jpg');
    await openEditor();

    await fireEvent.press(screen.getByRole('button', { name: 'Вибрати фото' }));
    expect(picker).toHaveBeenLastCalledWith(
      expect.objectContaining({ allowsEditing: true, aspect: [1, 1], mediaTypes: ['images'] }),
    );
    await screen.findByRole('button', { name: 'Прибрати фото' });
    await fireEvent.press(screen.getByRole('button', { name: 'Зберегти' }));

    const { avatarUri } = useAngler.getState();
    expect(avatarUri).toMatch(/^file:\/\/\/documents\/profile\/avatar-\d+\.jpg$/);
    expect(new File(avatarUri).exists).toBe(true);
  }, 20_000);

  it('deletes a photo picked and then abandoned, keeping the old one', async () => {
    const profileFiles = (): number => new Directory('file:///documents/', 'profile').list().length;
    const before = profileFiles();
    pickReturns('file:///cache/other.jpg');
    await openEditor();

    await fireEvent.press(screen.getByRole('button', { name: 'Вибрати фото' }));
    await screen.findByRole('button', { name: 'Прибрати фото' });
    expect(profileFiles()).toBe(before + 1);
    await fireEvent.press(screen.getByRole('button', { name: 'Скасувати' }));

    expect(useAngler.getState().avatarUri).toBe('');
    expect(profileFiles()).toBe(before);
  }, 20_000);

  it('removes the photo and its file on save', async () => {
    pickReturns('file:///cache/face.jpg');
    await openEditor();
    await fireEvent.press(screen.getByRole('button', { name: 'Вибрати фото' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Зберегти' }));
    const saved = useAngler.getState().avatarUri;

    await fireEvent.press(screen.getByRole('button', { name: 'Рибалка' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Прибрати фото' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Зберегти' }));

    expect(useAngler.getState().avatarUri).toBe('');
    await waitFor(() => expect(new File(saved).exists).toBe(false));
  }, 20_000);
});
