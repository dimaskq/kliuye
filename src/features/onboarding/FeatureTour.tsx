import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useActiveSpot } from '@/hooks';
import { usePreferences } from '@/store';
import { Spotlight, targetOf, useTargetsVersion } from '@/ui';

/** What the tour lights up, in order: the place, the number, the fish, then the tabs. */
const STEPS: readonly { target: string; key: string }[] = [
  { target: 'today.place', key: 'place' },
  { target: 'today.index', key: 'index' },
  { target: 'today.species', key: 'species' },
  { target: 'today.places', key: 'places' },
  { target: 'tab.week', key: 'week' },
  { target: 'tab.map', key: 'map' },
  { target: 'tab.diary', key: 'diary' },
];

/** Gives Today a moment to lay itself out once the forecast is in. */
const SETTLE_MS = 800;

/** True once `on` has held for `ms`; false again as soon as it does not. */
function useSettled(on: boolean, ms: number): boolean {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!on) return;
    const timer = setTimeout(() => setSettled(true), ms);
    return () => clearTimeout(timer);
  }, [on, ms]);
  return on && settled;
}

/**
 * After the first-launch tour, on Today itself: the real buttons, one at a
 * time, each with a word on what it does. Waits for the location dialog and
 * for a forecast on screen — there is nothing to point at before.
 */
export function FeatureTour(): React.JSX.Element {
  const { t } = useTranslation();
  const due = usePreferences(
    (state) => state.hydrated && state.onboardingDone && !state.featureTourDone,
  );
  const finish = usePreferences((state) => state.finishFeatureTour);
  const { canOfferLocation } = useActiveSpot();
  useTargetsVersion();
  const onScreen = targetOf(STEPS[0]!.target) !== undefined;
  const visible = useSettled(due && !canOfferLocation && onScreen, SETTLE_MS);

  return (
    <Spotlight
      visible={visible}
      steps={STEPS.map(({ target, key }) => ({
        target,
        title: t(`featureTour.${key}.title`),
        body: t(`featureTour.${key}.body`),
      }))}
      skipLabel={t('onboarding.skip')}
      progressLabel={(step, total) => t('onboarding.progress', { step, total })}
      continueHint={t('featureTour.hint')}
      finishHint={t('featureTour.finish')}
      onFinish={finish}
    />
  );
}
