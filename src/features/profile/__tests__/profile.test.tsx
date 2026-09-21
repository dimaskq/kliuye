import type { DailyBiteScore } from '@/domain/bite-index';
import { initialsOf } from '@/store';
import { renderHook, renderWithProviders, screen } from '@tests/render';

import { ProCard, StatTiles } from '../components';
import { useProfileStats } from '../useProfileStats';

const week = [{ value: 60 }, { value: 70 }, { value: 80 }] as DailyBiteScore[];

describe('useProfileStats', () => {
  it('averages the week and reports the catalogue size', async () => {
    const { result } = await renderHook(() =>
      useProfileStats({ week, recordKg: 4.2, spotCount: 4 }),
    );
    expect(result.current.map((stat) => stat.value)).toEqual(['70', '4.2', '4']);
  });

  it('shows a dash instead of a made-up number before any data exists', async () => {
    const { result } = await renderHook(() =>
      useProfileStats({ week: undefined, recordKg: 0, spotCount: 4 }),
    );
    expect(result.current.map((stat) => stat.value)).toEqual(['—', '—', '4']);
  });

  it('shows a dash for an empty week too', async () => {
    const { result } = await renderHook(() =>
      useProfileStats({ week: [], recordKg: 0, spotCount: 0 }),
    );
    expect(result.current[0]?.value).toBe('—');
  });
});

describe('initialsOf', () => {
  it.each([
    ['Тарас Коваль', 'ТК'],
    ['Тарас', 'Т'],
    ['', 'К'],
    ['   ', 'К'],
  ])('turns %p into initials', (name, expected) => {
    expect(initialsOf(name, 'К')).toBe(expected);
  });
});

describe('StatTiles and ProCard', () => {
  it('renders each stat with its label', async () => {
    await renderWithProviders(
      <StatTiles stats={[{ id: 'a', value: '67', label: 'Серед. індекс' }]} />,
    );
    expect(screen.getByText('67')).toBeOnTheScreen();
    expect(screen.getByText('Серед. індекс')).toBeOnTheScreen();
  });

  it('offers no purchase button in v1, only a "soon" tag', async () => {
    await renderWithProviders(
      <ProCard title="Клює Про" body="Індекс на 14 діб" soonLabel="Скоро" />,
    );
    expect(screen.getByText('Скоро')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
