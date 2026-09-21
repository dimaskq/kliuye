import { computeWeeklyForecast } from '@/domain/bite-index';
import { biteInputsFor } from '@/hooks';
import { useDateFormat } from '@/hooks/useDateFormat';
import { toForecast } from '@/services/weather';
import { makeForecastResponse } from '@tests/factories/open-meteo';
import { fireEvent, renderHook, renderWithProviders, screen } from '@tests/render';

import { DayRow } from '../components';
import { toDayRows } from '../dayRows';

const translate = ((key: string, params?: Record<string, string | number>) =>
  params === undefined ? key : `${key}:${JSON.stringify(params)}`) as never;

const forecast = toForecast(makeForecastResponse(), undefined, Date.parse('2025-04-12T05:41:00Z'));
const week = computeWeeklyForecast({
  species: 'all',
  days: forecast.days.map((day, offset) => {
    const { species: _species, ...rest } = biteInputsFor(forecast, day, offset, 'all', 6);
    return rest;
  }),
});
const rows = toDayRows(week, forecast.days, 'metric', translate);

describe('toDayRows', () => {
  it('produces one row per forecast day', () => {
    expect(rows).toHaveLength(forecast.days.length);
  });

  it('gives each row four detail tags, in the designed tones', () => {
    rows.forEach((row) => {
      expect(row.tags.map((tag) => tag.tone)).toEqual(['accent', 'outline', 'neutral', 'accent2']);
    });
  });

  it('summarises the day from its own cloud and wind, as i18n keys', () => {
    expect(rows[0]?.summary).toContain('week.summary');
    expect(rows[0]?.summary).toContain('factor.cloud');
  });

  it('skips a score with no matching forecast day rather than inventing one', () => {
    expect(toDayRows(week, forecast.days.slice(0, 2), 'metric', translate)).toHaveLength(2);
  });
});

describe('DayRow', () => {
  const row = rows[0]!;

  it('states the day, its index and its summary in one label', async () => {
    await renderWithProviders(
      <DayRow
        row={row}
        weekday="Сб"
        shortDate="12.04"
        expanded={false}
        accessibilityLabel="Сб 12.04, індекс 64"
        onPress={jest.fn()}
      />,
    );
    const button = screen.getByRole('button', { name: 'Сб 12.04, індекс 64' });
    expect(button).toHaveAccessibilityValue({});
    expect(screen.getByText(String(row.value))).toBeOnTheScreen();
  });

  it('hides the detail tags until the row is expanded', async () => {
    const { rerender } = await renderWithProviders(
      <DayRow
        row={row}
        weekday="Сб"
        shortDate="12.04"
        expanded={false}
        accessibilityLabel="Сб"
        onPress={jest.fn()}
      />,
    );
    expect(screen.queryByText(row.tags[0]!.label)).toBeNull();

    await rerender(
      <DayRow
        row={row}
        weekday="Сб"
        shortDate="12.04"
        expanded
        accessibilityLabel="Сб"
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText(row.tags[0]!.label)).toBeOnTheScreen();
  });

  it('reports a tap so the screen can toggle it', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <DayRow
        row={row}
        weekday="Сб"
        shortDate="12.04"
        expanded
        accessibilityLabel="Сб"
        onPress={onPress}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Сб' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('weekday formatting', () => {
  it('capitalises the Ukrainian short weekday, as the design shows it', async () => {
    const { result } = await renderHook(() => useDateFormat());
    expect(result.current.weekday(new Date('2025-04-12T12:00:00'))).toBe('Сб');
    expect(result.current.shortDate(new Date('2025-04-12T12:00:00'))).toBe('12.04');
  });
});
