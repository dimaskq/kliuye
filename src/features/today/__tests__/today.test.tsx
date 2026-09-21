import { SPECIES_IDS, computeFactors } from '@/domain/bite-index';
import type { SpeciesId } from '@/domain/bite-index';
import { makeBiteInputs, makeWeather } from '@tests/factories/bite';
import { fireEvent, renderWithProviders, screen } from '@tests/render';

import {
  FactorGrid,
  HourlyChart,
  IndexCard,
  SpeciesPicker,
  areaPath,
  chartPoints,
  hourAt,
  smoothPath,
  valueRange,
} from '../components';
import { toFactorCards } from '../factorCards';
import { speciesPillOrder } from '../speciesOrder';

const translate = ((key: string, params?: Record<string, string | number>) =>
  params === undefined ? key : `${key}:${JSON.stringify(params)}`) as never;

const context = {
  weather: makeWeather(),
  system: 'metric' as const,
  sunriseHour: 5.683,
  sunsetHour: 19.967,
  translate,
};

describe('toFactorCards', () => {
  it('produces one card per factor, in factor order', () => {
    const factors = computeFactors(makeBiteInputs());
    const cards = toFactorCards(factors, context);
    expect(cards.map((card) => card.id)).toEqual(factors.map((factor) => factor.id));
  });

  it('marks an estimated water temperature with the approx sign', () => {
    const estimated = makeWeather({ waterTemperature: { celsius: 11, estimated: true } });
    const cards = toFactorCards(computeFactors(makeBiteInputs({ weather: estimated })), {
      ...context,
      weather: estimated,
    });
    expect(cards.find((card) => card.id === 'waterTemperature')?.value).toContain('common.approx');
  });

  it('shows a dash rather than a made-up number when water is unknown', () => {
    const unknown = makeWeather({ waterTemperature: undefined });
    const cards = toFactorCards(computeFactors(makeBiteInputs({ weather: unknown })), {
      ...context,
      weather: unknown,
    });
    expect(cards.find((card) => card.id === 'waterTemperature')?.value).toBe('—');
  });

  it('reads the sun card from sunrise and sunset', () => {
    const cards = toFactorCards(computeFactors(makeBiteInputs()), context);
    const sun = cards.find((card) => card.id === 'timeOfDay');
    expect(sun?.value).toBe('05:41');
    expect(sun?.noteKey).toBe('factor.time.sunset');
  });

  it('tones a strong factor positive and a weak one as attention', () => {
    const calm = makeWeather({ windSpeedMs: 4 });
    const gale = makeWeather({ windSpeedMs: 20 });
    const toneOf = (weather: typeof calm) =>
      toFactorCards(computeFactors(makeBiteInputs({ weather })), { ...context, weather }).find(
        (card) => card.id === 'wind',
      )?.tone;
    expect(toneOf(calm)).toBe('positive');
    expect(toneOf(gale)).toBe('attention');
  });

  it('names the wind direction as a compass point, not a number', () => {
    const cards = toFactorCards(computeFactors(makeBiteInputs()), context);
    expect(JSON.stringify(cards.find((card) => card.id === 'wind')?.noteParams)).toContain(
      'compass.sw',
    );
  });
});

describe('FactorGrid', () => {
  it('gives every card a single accessible summary', async () => {
    const cards = toFactorCards(computeFactors(makeBiteInputs()), context);
    await renderWithProviders(<FactorGrid cards={cards} />);
    expect(screen.getAllByLabelText(/factorCard\.accessible|:/)).toHaveLength(cards.length);
  });
});

describe('IndexCard', () => {
  it('announces the value and the verdict together, never colour alone', async () => {
    await renderWithProviders(
      <IndexCard
        value={78}
        indexLabel="ІНДЕКС КЛЬОВУ"
        verdictWord="Добре клює"
        verdictNote="Риба активна"
        windowLabel="Найкраще вікно 06:00–09:00"
        accessibilityLabel="Індекс кльову 78 зі 100, добре клює"
      />,
    );
    expect(screen.getByLabelText('Індекс кльову 78 зі 100, добре клює')).toBeOnTheScreen();
    expect(screen.getByText('78')).toBeOnTheScreen();
    expect(screen.getByText('Добре клює')).toBeOnTheScreen();
  });
});

describe('HourlyChart', () => {
  const curve = Array.from({ length: 24 }, (_, hour) => hour * 4);

  it('reads out the selected hour and its index, as one adjustable control', async () => {
    await renderWithProviders(
      <HourlyChart
        curve={curve}
        selectedHour={6}
        onSelectHour={jest.fn()}
        onStepHour={jest.fn()}
      />,
    );
    const chart = screen.getByLabelText('По годинах');
    expect(chart).toHaveAccessibilityValue({ text: '06:00, індекс 24' });
    expect(screen.getByText('індекс 24')).toBeOnTheScreen();
    expect(screen.getByText('06:00')).toBeOnTheScreen();
  });

  it('asks for a relative step with the arrows, so quick taps each land', async () => {
    const onStepHour = jest.fn();
    await renderWithProviders(
      <HourlyChart
        curve={curve}
        selectedHour={6}
        onSelectHour={jest.fn()}
        onStepHour={onStepHour}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Наступна година' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Наступна година' }));
    expect(onStepHour).toHaveBeenNthCalledWith(1, 1);
    expect(onStepHour).toHaveBeenNthCalledWith(2, 1);

    await fireEvent.press(screen.getByRole('button', { name: 'Попередня година' }));
    expect(onStepHour).toHaveBeenLastCalledWith(-1);
  });

  it('lets a screen reader step through the day without touching the curve', async () => {
    const onStepHour = jest.fn();
    await renderWithProviders(
      <HourlyChart
        curve={curve}
        selectedHour={6}
        onSelectHour={jest.fn()}
        onStepHour={onStepHour}
      />,
    );

    await fireEvent(screen.getByLabelText('По годинах'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(onStepHour).toHaveBeenLastCalledWith(1);
  });

  it('marks the axis and says how to read the chart', async () => {
    await renderWithProviders(
      <HourlyChart
        curve={curve}
        selectedHour={6}
        onSelectHour={jest.fn()}
        onStepHour={jest.fn()}
      />,
    );
    ['00', '06', '12', '18', '23'].forEach((tick) =>
      expect(screen.getByText(tick)).toBeOnTheScreen(),
    );
    expect(
      screen.getByText('Проведіть пальцем по кривій або гортайте годинами стрілками.'),
    ).toBeOnTheScreen();
  });
});

describe('speciesPillOrder', () => {
  it('moves the chosen fish to the front and keeps the rest in order', () => {
    const order = speciesPillOrder('goby');
    expect(order[0]).toBe('goby');
    expect(order.slice(1)).toEqual(SPECIES_IDS.filter((id) => id !== 'all' && id !== 'goby'));
  });

  it('never offers the baseline as one of the chips', () => {
    expect(speciesPillOrder('all')).not.toContain('all');
    expect(speciesPillOrder('pike')).not.toContain('all');
  });

  it('covers every species exactly once', () => {
    const order = speciesPillOrder('carp');
    expect(new Set(order).size).toBe(order.length);
    expect(order).toHaveLength(SPECIES_IDS.length - 1);
  });
});

describe('hourAt', () => {
  const WIDTH = 360;
  const HOURS = 24;

  it('maps a position along the curve to the hour under the finger', () => {
    expect(hourAt(0, WIDTH, HOURS)).toBe(0);
    expect(hourAt(WIDTH / 2, WIDTH, HOURS)).toBe(12);
    expect(hourAt(WIDTH, WIDTH, HOURS)).toBe(23);
  });

  it('clamps a finger that slides past either end', () => {
    expect(hourAt(-40, WIDTH, HOURS)).toBe(0);
    expect(hourAt(WIDTH + 40, WIDTH, HOURS)).toBe(23);
  });

  it('reads as the first hour before the row has been measured', () => {
    expect(hourAt(120, 0, HOURS)).toBe(0);
  });
});

describe('SpeciesPicker', () => {
  const scores = Object.fromEntries(SPECIES_IDS.map((id, index) => [id, 90 - index * 3])) as Record<
    SpeciesId,
    number
  >;

  it('offers every species but the baseline as a quick choice', async () => {
    await renderWithProviders(
      <SpeciesPicker selected="all" scores={scores} onSelect={jest.fn()} onOpenAll={jest.fn()} />,
    );
    expect(screen.getAllByRole('radio')).toHaveLength(SPECIES_IDS.length - 1);
    expect(screen.getByLabelText(`Щука, індекс ${scores.pike}`)).toBeOnTheScreen();
    expect(screen.getByLabelText(`Камбала, індекс ${scores.flounder}`)).toBeOnTheScreen();
  });

  it('reports the species that was picked', async () => {
    const onSelect = jest.fn();
    await renderWithProviders(
      <SpeciesPicker selected="all" scores={scores} onSelect={onSelect} onOpenAll={jest.fn()} />,
    );
    await fireEvent.press(screen.getByLabelText(`Судак, індекс ${scores.zander}`));
    expect(onSelect).toHaveBeenCalledWith('zander');
  });

  it('puts the chosen fish first, so it is on screen whichever one it is', async () => {
    await renderWithProviders(
      <SpeciesPicker selected="goby" scores={scores} onSelect={jest.fn()} onOpenAll={jest.fn()} />,
    );
    const [first] = screen.getAllByRole('radio');
    expect(first).toHaveAccessibleName(`Бичок, індекс ${scores.goby}`);
    expect(first).toBeSelected();
  });

  it('leaves catalogue order alone while the baseline is chosen', async () => {
    await renderWithProviders(
      <SpeciesPicker selected="all" scores={scores} onSelect={jest.fn()} onOpenAll={jest.fn()} />,
    );
    const [first] = screen.getAllByRole('radio');
    expect(first).toHaveAccessibleName(`Щука, індекс ${scores.pike}`);
  });

  it('opens the catalogue from the "all species" chip rather than choosing there', async () => {
    const onOpenAll = jest.fn();
    const onSelect = jest.fn();
    await renderWithProviders(
      <SpeciesPicker selected="all" scores={scores} onSelect={onSelect} onOpenAll={onOpenAll} />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Усі види риби' }));
    expect(onOpenAll).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe('curve geometry', () => {
  const WIDTH = 240;
  const HEIGHT = 96;

  it('spreads the hours across the width and puts the peak near the top', () => {
    const points = chartPoints([0, 50, 100], WIDTH, HEIGHT);
    expect(points.map((point) => point.x)).toEqual([0, WIDTH / 2, WIDTH]);
    expect(points[0]?.y).toBe(HEIGHT);
    expect(points[2]?.y).toBeLessThan(HEIGHT / 4);
    expect(points[2]?.y).toBeGreaterThanOrEqual(0);
  });

  it("follows the day's own range, so a good day is a shape and not a flat line", () => {
    /* 73–84 on a 0–100 axis would sit in the top eighth and read as flat. */
    const flatOnAbsolute = chartPoints([73, 84, 76], WIDTH, HEIGHT);
    const heights = flatOnAbsolute.map((point) => HEIGHT - point.y);
    expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(HEIGHT / 3);
  });

  it('never amplifies a genuinely flat day into drama', () => {
    const range = valueRange([70, 70, 70]);
    expect(range.max - range.min).toBeGreaterThanOrEqual(25);
    const points = chartPoints([70, 70, 70], WIDTH, HEIGHT);
    expect(new Set(points.map((point) => point.y)).size).toBe(1);
  });

  it('keeps the window inside the 0–100 scale', () => {
    expect(valueRange([0, 4]).min).toBe(0);
    expect(valueRange([96, 100]).max).toBe(100);
    expect(valueRange([])).toEqual({ min: 0, max: 100 });
  });

  it('draws one continuous cubic path through every point', () => {
    const path = smoothPath(chartPoints([10, 40, 90, 30], WIDTH, HEIGHT));
    expect(path.startsWith('M')).toBe(true);
    expect(path.match(/C/g)).toHaveLength(3);
  });

  it('closes the area down to the baseline', () => {
    const area = areaPath(chartPoints([10, 40, 90], WIDTH, HEIGHT), HEIGHT);
    expect(area.endsWith('Z')).toBe(true);
    expect(area).toContain(`L0 ${HEIGHT}`);
  });

  it('draws nothing at all rather than a broken path before layout', () => {
    expect(chartPoints([10, 20], 0, HEIGHT)).toEqual([]);
    expect(smoothPath([])).toBe('');
    expect(areaPath([], HEIGHT)).toBe('');
  });
});
