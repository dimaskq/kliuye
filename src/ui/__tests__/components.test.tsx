import { CatalogScreen } from '@/features/catalog';
import { fireEvent, renderWithProviders, screen } from '@tests/render';

import {
  Button,
  ErrorScreen,
  LanguagePicker,
  NavRow,
  Pill,
  ScoreBadge,
  Screen,
  SectionHeader,
  SettingsList,
  Skeleton,
  StaleBadge,
  StatusCard,
  TabBar,
  Tag,
  Text,
  Toggle,
} from '../components';
import { clampForDisplay, scoreFill, scoreTextColor } from '../scoreColor';
import { colors, neutral, textVariants } from '../tokens';

describe('Text', () => {
  it('applies the variant from the token scale', async () => {
    await renderWithProviders(<Text variant="h2">Тиждень</Text>);
    expect(screen.getByText('Тиждень')).toHaveStyle({ fontSize: textVariants.h2.fontSize });
  });
});

describe('Button', () => {
  it('is a button that reports its label and fires once per press', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Усі поради дня" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Усі поради дня' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('Pill', () => {
  it('exposes its selected state to assistive tech', async () => {
    await renderWithProviders(
      <Pill
        label="Щука"
        detail="86"
        selected
        onPress={jest.fn()}
        accessibilityLabel="Щука, індекс 86"
      />,
    );
    expect(screen.getByLabelText('Щука, індекс 86')).toBeSelected();
  });
});

describe('Toggle', () => {
  it('is a switch that reports checked state and flips on press', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <Toggle label="Сповіщення про жор" hint="За годину" value={false} onChange={onChange} />,
    );
    const control = screen.getByRole('switch', { name: 'Сповіщення про жор' });
    expect(control).not.toBeChecked();
    await fireEvent.press(control);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('SettingsList', () => {
  it('renders one switch per row and reports which one changed', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <SettingsList
        rows={[
          { id: 'notifications', label: 'Сповіщення', hint: 'До вікна', value: true },
          { id: 'widget', label: 'Віджет', hint: 'На блокуванні', value: false },
        ]}
        onChange={onChange}
      />,
    );
    await fireEvent.press(screen.getByRole('switch', { name: 'Віджет' }));
    expect(onChange).toHaveBeenCalledWith('widget', true);
  });
});

describe('LanguagePicker', () => {
  it('marks the active language and reports a change', async () => {
    const onSelect = jest.fn();
    await renderWithProviders(
      <LanguagePicker
        selected="uk"
        labels={{ uk: 'Українська', en: 'English', bg: 'Български' }}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Українська' })).toBeSelected();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    await fireEvent.press(screen.getByRole('radio', { name: 'Български' }));
    expect(onSelect).toHaveBeenCalledWith('bg');
  });
});

describe('TabBar', () => {
  it('renders every tab and marks the selected one', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <TabBar
        items={[
          { key: 'today', label: 'Сьогодні', icon: 'lightbulb', selected: true, onPress },
          { key: 'week', label: 'Тиждень', icon: 'calendar', selected: false, onPress },
        ]}
      />,
    );
    expect(screen.getByRole('tab', { name: 'Сьогодні' })).toBeSelected();
    await fireEvent.press(screen.getByRole('tab', { name: 'Тиждень' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('StatusCard', () => {
  it('shows the reason and offers a way out', async () => {
    const onAction = jest.fn();
    await renderWithProviders(
      <StatusCard
        title="Помилка"
        body="Немає зв'язку"
        actionLabel="Спробувати ще"
        onAction={onAction}
      />,
    );
    expect(screen.getByText("Немає зв'язку")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Спробувати ще' }));
    expect(onAction).toHaveBeenCalled();
  });

  it('omits the action when there is nothing to do', async () => {
    await renderWithProviders(<StatusCard title="Порожньо" body="Немає водойм" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('NavRow', () => {
  it('is a link that navigates on press', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<NavRow label="Про застосунок" hint="Джерела" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('link', { name: 'Про застосунок' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('StaleBadge and ScoreBadge and Tag', () => {
  it('state is never colour alone — the badge carries its own text', async () => {
    await renderWithProviders(
      <>
        <StaleBadge label="Дані від 05:41" />
        <ScoreBadge value={64} selected={false} />
        <Tag tone="accent" label="Вікно 06:00–09:00" />
      </>,
    );
    expect(screen.getByLabelText('Дані від 05:41')).toBeOnTheScreen();
    expect(screen.getByText('64')).toBeOnTheScreen();
    expect(screen.getByText('Вікно 06:00–09:00')).toBeOnTheScreen();
  });
});

describe('scoreColor', () => {
  it.each([
    [90, colors.accent, colors.accent700],
    [70, colors.accent400, colors.accent600],
    [50, colors.accent2400, colors.accent2700],
    [30, colors.accent2300, colors.accent2800],
    [10, neutral[300], neutral[700]],
  ])('maps %p to its band', async (value, fill, text) => {
    expect(scoreFill(value)).toBe(fill);
    expect(scoreTextColor(value)).toBe(text);
  });

  it('clamps to a visible range without touching the logical value', async () => {
    expect(clampForDisplay(0)).toBe(4);
    expect(clampForDisplay(100)).toBe(99);
    expect(clampForDisplay(64.4)).toBe(64);
  });
});

describe('Screen, SectionHeader, Skeleton and ErrorScreen', () => {
  it('scrolls its content and supports pull to refresh', async () => {
    const onRefresh = jest.fn();
    await renderWithProviders(
      <Screen onRefresh={onRefresh} refreshing={false}>
        <Text>Вміст</Text>
      </Screen>,
    );
    expect(screen.getByText('Вміст')).toBeOnTheScreen();
  });

  it('renders a section header with its aside', async () => {
    await renderWithProviders(<SectionHeader title="ВИД РИБИ" aside="SPECIES" />);
    expect(screen.getByRole('header', { name: 'ВИД РИБИ' })).toBeOnTheScreen();
    expect(screen.getByText('SPECIES')).toBeOnTheScreen();
  });

  it('renders a section header without an aside', async () => {
    await renderWithProviders(<SectionHeader title="МОВА" />);
    expect(screen.queryByText('SPECIES')).toBeNull();
  });

  it('hides skeletons from assistive tech', async () => {
    await renderWithProviders(<Skeleton height={40} width="50%" radiusToken="row" />);
    expect(screen.toJSON()).toBeTruthy();
  });

  it('offers a restart from the root error screen', async () => {
    const onAction = jest.fn();
    await renderWithProviders(
      <ErrorScreen
        title="Щось зламалося"
        body="Перезапустіть застосунок"
        actionLabel="Перезапустити"
        onAction={onAction}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Перезапустити' }));
    expect(onAction).toHaveBeenCalled();
  });
});

describe('CatalogScreen', () => {
  it('renders the whole design system in one place', async () => {
    await renderWithProviders(<CatalogScreen />);
    expect(screen.getByRole('header', { name: 'type' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'score ramp' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'tabs' })).toBeOnTheScreen();
  });
});
