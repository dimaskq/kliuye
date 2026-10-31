import { Dimensions } from 'react-native';

import { FeatureTour } from '@/features/onboarding';
import { useLocation, usePreferences } from '@/store';
import { Spotlight, registerTarget, targetOf } from '@/ui';
import type { SpotlightStep } from '@/ui';
import { act, fireEvent, renderWithProviders, screen, waitFor } from '@tests/render';

const initialPreferences = usePreferences.getState();
const initialLocation = useLocation.getState();
const HEIGHT = Dimensions.get('window').height;

/** A stand-in for a view on screen, at a given height. */
function placeAt(id: string, y: number, height = 40): void {
  registerTarget(id, { measureInWindow: (done) => done(16, y, 120, height) });
}

const STEPS: readonly SpotlightStep[] = [
  { target: 'a', title: 'Перший', body: 'Про перше' },
  { target: 'missing', title: 'Пропущений', body: 'Його немає на екрані' },
  { target: 'b', title: 'Другий', body: 'Про друге' },
];

function renderSpotlight(onFinish = jest.fn()) {
  return renderWithProviders(
    <Spotlight
      visible
      steps={STEPS}
      skipLabel="Пропустити"
      progressLabel={(step, total) => `Крок ${step} з ${total}`}
      continueHint="Далі — дотик"
      finishHint="Кінець — дотик"
      onFinish={onFinish}
    />,
  );
}

beforeEach(() => {
  jest.useRealTimers();
  for (const id of ['a', 'b', 'today.place', 'off']) registerTarget(id, null);
  usePreferences.setState({ ...initialPreferences, hydrated: true, onboardingDone: true }, true);
  useLocation.setState({ ...initialLocation, hydrated: true, promptDismissed: true }, true);
});

describe('spotlight', () => {
  it('lights the targets one by one and passes over one that is not on screen', async () => {
    placeAt('a', 80);
    placeAt('b', HEIGHT - 60);
    const onFinish = jest.fn();
    await renderSpotlight(onFinish);

    expect(await screen.findByText('Перший')).toBeOnTheScreen();
    expect(screen.getByText('Крок 1 з 3')).toBeOnTheScreen();
    expect(screen.getByText('Далі — дотик')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Перший. Про перше' }));
    expect(await screen.findByText('Другий')).toBeOnTheScreen();
    expect(screen.getByText('Крок 3 з 3')).toBeOnTheScreen();
    expect(screen.getByText('Кінець — дотик')).toBeOnTheScreen();
    expect(screen.queryByText('Пропущений')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Другий. Про друге' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('can be skipped at any step', async () => {
    placeAt('a', 4);
    const onFinish = jest.fn();
    await renderSpotlight(onFinish);
    await screen.findByText('Перший');
    await fireEvent.press(screen.getByRole('button', { name: 'Пропустити' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('treats a target scrolled out of the window as missing', async () => {
    placeAt('a', HEIGHT + 100);
    placeAt('b', 200, 0);
    const onFinish = jest.fn();
    await renderSpotlight(onFinish);
    await waitFor(() => expect(onFinish).toHaveBeenCalled());
  });
});

describe('targets', () => {
  it('registers a view once and forgets it when it goes', () => {
    const view = { measureInWindow: jest.fn() };
    registerTarget('off', view);
    registerTarget('off', view);
    expect(targetOf('off')).toBe(view);
    registerTarget('off', null);
    registerTarget('off', null);
    expect(targetOf('off')).toBeUndefined();
  });
});

describe('feature tour on Today', () => {
  it('waits for the first target, shows the steps and is not shown again', async () => {
    await renderWithProviders(<FeatureTour />);
    expect(screen.queryByText('Ваша вода')).toBeNull();

    await act(async () => placeAt('today.place', 60));
    expect(await screen.findByText('Ваша вода', {}, { timeout: 3000 })).toBeOnTheScreen();
    expect(screen.getByText('Крок 1 з 7')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Пропустити' }));
    expect(usePreferences.getState().featureTourDone).toBe(true);
  });

  it('stays away while the location dialog is due', async () => {
    useLocation.setState({ promptDismissed: false });
    placeAt('today.place', 60);
    await renderWithProviders(<FeatureTour />);
    await act(() => new Promise((resolve) => setTimeout(resolve, 1000)));
    expect(screen.queryByText('Ваша вода')).toBeNull();
  });
});
