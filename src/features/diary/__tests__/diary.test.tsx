import * as ImagePicker from 'expo-image-picker';

import type { Attachment, Catch } from '@/domain/diary';
import { CatchScreen, DiaryScreen } from '@/features/diary';
import { useAnglerSummary } from '@/features/profile';
import { useDiary, useSelection } from '@/store';
import { fireEvent, renderHook, renderWithProviders, screen, waitFor } from '@tests/render';

const initialSelection = useSelection.getState();

function seeded(over: Partial<Catch> = {}): Catch {
  return {
    id: 'c1',
    caughtAt: Date.now(),
    speciesId: 'pike',
    weightKg: 2.4,
    place: 'Затока за дамбою',
    note: 'На джиг проти вітру',
    media: [],
    ...over,
  };
}

const picker = ImagePicker.launchImageLibraryAsync as jest.MockedFunction<
  typeof ImagePicker.launchImageLibraryAsync
>;

function photo(over: Partial<Attachment> = {}): Attachment {
  return {
    id: 'm1',
    kind: 'image',
    uri: 'file:///documents/catches/m1.jpg',
    posterUri: 'file:///documents/catches/m1.jpg',
    width: 1200,
    height: 900,
    ...over,
  };
}

beforeEach(() => {
  useSelection.setState(initialSelection, true);
  useDiary.setState({ catches: [] });
  picker.mockReset();
  picker.mockResolvedValue({ canceled: true, assets: null } as never);
});

describe('DiaryScreen', () => {
  it('explains what the journal is for while it is still empty', async () => {
    await renderWithProviders(<DiaryScreen />);
    expect(screen.getByRole('header', { name: 'Поки порожньо' })).toBeOnTheScreen();
  });

  it('shows thumbnails on a row that has photos, and counts them for a reader', async () => {
    useDiary.setState({
      catches: [seeded({ media: [photo(), photo({ id: 'm2', kind: 'video' })] })],
    });
    await renderWithProviders(<DiaryScreen />);

    expect(screen.getByLabelText(/Окунь|Щука/)).toHaveProp(
      'accessibilityLabel',
      expect.stringContaining('2 фото'),
    );
  });

  it('lists an entry with what, how heavy, when and where', async () => {
    useDiary.setState({ catches: [seeded()] });
    await renderWithProviders(<DiaryScreen />);

    expect(screen.getByLabelText('Щука, 2.4 кг, Сьогодні, Затока за дамбою')).toBeOnTheScreen();
    expect(screen.getByText('На джиг проти вітру')).toBeOnTheScreen();
  });

  it('sums the diary in the header instead of the empty-state copy', async () => {
    const yesterday = Date.now() - 86_400_000;
    useDiary.setState({
      catches: [seeded(), seeded({ id: 'c2', caughtAt: yesterday, weightKg: 5 })],
    });
    await renderWithProviders(<DiaryScreen />);
    expect(screen.getByText('2 риби · 2 виходи · рекорд 5.0 кг')).toBeOnTheScreen();
  });
});

describe('CatchScreen', () => {
  it('logs a catch with the weight typed and the fish chosen', async () => {
    await renderWithProviders(<CatchScreen />);

    await fireEvent.changeText(screen.getByLabelText('Вага'), '2,4');
    await fireEvent.press(screen.getByLabelText('Окунь'));
    await fireEvent.press(screen.getByLabelText('Зберегти'));

    const entry = useDiary.getState().catches[0];
    expect([entry?.speciesId, entry?.weightKg]).toEqual(['perch', 2.4]);
  });

  it('never records "усі види" as the fish that was landed', async () => {
    useSelection.setState({ speciesId: 'all' });
    await renderWithProviders(<CatchScreen />);
    await fireEvent.press(screen.getByLabelText('Зберегти'));
    expect(useDiary.getState().catches[0]?.speciesId).toBe('pike');
  });

  it('prefills the place and the coordinates of the water in view', async () => {
    await renderWithProviders(<CatchScreen />);
    await fireEvent.press(screen.getByLabelText('Зберегти'));

    const entry = useDiary.getState().catches[0];
    expect(entry?.place).not.toBe('');
    expect(entry?.coordinates).toEqual({
      latitude: expect.any(Number),
      longitude: expect.any(Number),
    });
  });

  it('steps the date back a day and refuses to go past today', async () => {
    await renderWithProviders(<CatchScreen />);
    expect(screen.getByText('Сьогодні')).toBeOnTheScreen();

    expect(screen.getByLabelText('Наступний день')).toBeDisabled();
    await fireEvent.press(screen.getByLabelText('Попередній день'));
    expect(screen.getByText('Вчора')).toBeOnTheScreen();
    expect(screen.getByLabelText('Наступний день')).not.toBeDisabled();
  });

  it('opens an existing entry filled in, and can delete it', async () => {
    useDiary.setState({ catches: [seeded()] });
    await renderWithProviders(<CatchScreen id="c1" />);

    expect(screen.getByLabelText('Вага')).toHaveDisplayValue('2.4');
    expect(screen.getByLabelText('Місце')).toHaveDisplayValue('Затока за дамбою');

    await fireEvent.press(screen.getByLabelText('Видалити'));
    expect(useDiary.getState().catches).toHaveLength(0);
  });

  it('attaches picked photos and saves them with the entry', async () => {
    picker.mockResolvedValueOnce({
      canceled: false,
      assets: [
        { uri: 'file:///cache/a.jpg', width: 100, height: 80, type: 'image' },
        { uri: 'file:///cache/b.mov', width: 100, height: 80, type: 'video' },
      ],
    } as never);
    await renderWithProviders(<CatchScreen />);

    expect(screen.getByText('0 / 6')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Додати'));

    await waitFor(() => expect(screen.getByText('2 / 6')).toBeOnTheScreen());
    await fireEvent.press(screen.getByLabelText('Зберегти'));

    const media = useDiary.getState().catches[0]?.media ?? [];
    expect(media.map((item) => item.kind)).toEqual(['image', 'video']);
  });

  it('drops an attachment from the form without touching saved entries', async () => {
    useDiary.setState({ catches: [seeded({ media: [photo(), photo({ id: 'm2' })] })] });
    await renderWithProviders(<CatchScreen id="c1" />);

    expect(screen.getByText('2 / 6')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Прибрати файл 1'));
    expect(screen.getByText('1 / 6')).toBeOnTheScreen();

    /* Nothing is written until Save, so the stored entry still has both. */
    expect(useDiary.getState().catches[0]?.media).toHaveLength(2);
  });

  it('says so when the picker fails instead of failing silently', async () => {
    picker.mockRejectedValueOnce(new Error('no picker'));
    await renderWithProviders(<CatchScreen />);

    await fireEvent.press(screen.getByLabelText('Додати'));
    await waitFor(() =>
      expect(screen.getByText('Не вдалося додати файл. Спробуйте ще раз.')).toBeOnTheScreen(),
    );
  });

  it('stops offering more once the entry is full', async () => {
    const full = Array.from({ length: 6 }, (_, index) => photo({ id: `m${index}` }));
    useDiary.setState({ catches: [seeded({ media: full })] });
    await renderWithProviders(<CatchScreen id="c1" />);

    expect(screen.getByText('6 / 6')).toBeOnTheScreen();
    expect(screen.getByLabelText('Достатньо')).toBeDisabled();
  });

  it('offers no delete for a catch that has not been saved yet', async () => {
    await renderWithProviders(<CatchScreen />);
    expect(screen.queryByLabelText('Видалити')).toBeNull();
  });
});

describe('useAnglerSummary', () => {
  it('counts the diary, so the profile stops showing zeros', async () => {
    /* A different year, so the trip count and the "since" year both have to move. */
    const firstSeason = new Date(2024, 3, 12).getTime();
    useDiary.setState({
      catches: [seeded(), seeded({ id: 'c2', caughtAt: firstSeason, weightKg: 5.5 })],
    });
    const { result } = await renderHook(() => useAnglerSummary());
    expect(result.current).toEqual({ trips: 2, fish: 2, recordKg: 5.5, sinceYear: 2024 });
  });

  it('falls back to the installation year while nothing is logged', async () => {
    const { result } = await renderHook(() => useAnglerSummary());
    expect(result.current.fish).toBe(0);
    expect(result.current.sinceYear).toBeGreaterThan(2000);
  });
});
