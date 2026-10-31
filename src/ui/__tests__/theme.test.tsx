import { ThemeSection } from '@/features/settings';
import { AppProviders } from '@/providers/AppProviders';
import { usePreferences } from '@/store';
import { act, fireEvent, renderWithProviders, screen } from '@tests/render';

import { Text } from '../components';
import { ThemeProvider, useColorTheme } from '../theme';
import { accent, accent2, darkColors, lightColors, neutral, textAlpha } from '../tokens';

const initialPreferences = usePreferences.getState();

beforeEach(() => {
  usePreferences.setState({ ...initialPreferences, hydrated: true }, true);
});

function SchemeName(): React.JSX.Element {
  return <Text>{useColorTheme()}</Text>;
}

describe('themes', () => {
  it('runs every scale the other way at night, so tints and inks swap places', () => {
    expect(darkColors.accent100).toBe(accent[900]);
    expect(darkColors.accent900).toBe(accent[100]);
    expect(darkColors.accent2300).toBe(accent2[700]);
    expect(darkColors.neutral[100]).toBe(neutral[900]);
    expect(darkColors.accent500).toBe(lightColors.accent500);
  });

  it('keeps the same tokens in both themes, and the light one as it always was', () => {
    expect(Object.keys(darkColors).sort()).toEqual(Object.keys(lightColors).sort());
    expect(lightColors.textAlpha).toBe(textAlpha);
    expect(darkColors.text).not.toBe(lightColors.text);
  });

  it('draws text in the colours of the theme it sits in', async () => {
    await renderWithProviders(
      <ThemeProvider scheme="dark">
        <Text>Ніч</Text>
      </ThemeProvider>,
    );
    expect(screen.getByText('Ніч')).toHaveStyle({ color: darkColors.text });
  });

  it('is light outside any provider', async () => {
    await renderWithProviders(<Text>День</Text>);
    expect(screen.getByText('День')).toHaveStyle({ color: lightColors.text });
  });
});

describe('theme setting', () => {
  it('switches the whole app to the theme picked in Settings', async () => {
    await renderWithProviders(
      <AppProviders>
        <ThemeSection />
        <SchemeName />
      </AppProviders>,
    );
    expect(screen.getByText('light')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('tab', { name: 'Темна' }));
    expect(usePreferences.getState().themeMode).toBe('dark');
    expect(screen.getByText('dark')).toBeOnTheScreen();

    await act(async () => usePreferences.getState().setThemeMode('system'));
    expect(screen.getByText('light')).toBeOnTheScreen();
  });
});
