import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { verdictNoteKey, verdictWordKey } from '@/domain/bite-index';
import type { SpeciesId } from '@/domain/bite-index';
import type { Tip } from '@/domain/tips';
import type { BiteModel } from '@/hooks';
import { usePreferences } from '@/store';
import { SectionHeader } from '@/ui';
import { formatHour } from '@/utils/format';

import { FactorGrid, HourlyChart, IndexCard, SpeciesPicker, TipCard } from './components';
import { toFactorCards } from './factorCards';

type SpeciesChoiceProps = {
  selected: SpeciesId;
  scores: Readonly<Record<SpeciesId, number>>;
  onSelect: (species: SpeciesId) => void;
};

/** The quick chips, plus the way into the full catalogue. */
function SpeciesChoice({ selected, scores, onSelect }: SpeciesChoiceProps): React.JSX.Element {
  const router = useRouter();
  return (
    <SpeciesPicker
      selected={selected}
      scores={scores}
      onSelect={onSelect}
      onOpenAll={() => router.push('/species')}
    />
  );
}

function TodayTip({ tip }: { tip: Tip }): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <TipCard
      kicker={t('today.tipKicker')}
      title={t(tip.titleKey)}
      body={t(tip.bodyKey)}
      actionLabel={t('today.allTips')}
      onAction={() => router.push('/tips')}
    />
  );
}

export type TodayContentProps = {
  model: BiteModel;
  speciesId: SpeciesId;
  speciesScores: Readonly<Record<SpeciesId, number>>;
  selectedHour: number;
  onSelectSpecies: (species: SpeciesId) => void;
  onSelectHour: (hour: number) => void;
  onStepHour: (delta: number) => void;
};

/** Everything below the location header, once a forecast is in hand. */
export function TodayContent({
  model,
  speciesId,
  speciesScores,
  selectedHour,
  onSelectSpecies,
  onSelectHour,
  onStepHour,
}: TodayContentProps): React.JSX.Element {
  const { t } = useTranslation();
  const unitSystem = usePreferences((state) => state.unitSystem);
  const { score, curve, tips, today } = model;
  const [firstTip] = tips;
  const weather = today.hourlyWeather[selectedHour] ?? today.hourlyWeather[0]!;
  const verdict = t(verdictWordKey(score.verdict));

  return (
    <>
      <IndexCard
        value={score.value}
        indexLabel={t('today.indexLabel')}
        verdictWord={verdict}
        verdictNote={t(verdictNoteKey(score.verdict))}
        windowLabel={t('today.bestWindow', {
          start: formatHour(score.bestWindow.startHour),
          end: formatHour(score.bestWindow.endHour),
        })}
        accessibilityLabel={t('today.indexAccessible', { value: score.value, verdict })}
      />
      <SectionHeader title={t('today.sectionSpecies')} aside={t('today.sectionSpeciesAside')} />
      <SpeciesChoice selected={speciesId} scores={speciesScores} onSelect={onSelectSpecies} />
      <HourlyChart
        curve={curve}
        selectedHour={selectedHour}
        onSelectHour={onSelectHour}
        onStepHour={onStepHour}
      />
      <SectionHeader title={t('today.sectionFactors')} aside={t('today.sectionFactorsAside')} />
      <FactorGrid
        cards={toFactorCards(score.factors, {
          weather,
          system: unitSystem,
          sunriseHour: today.sun.sunriseHour,
          sunsetHour: today.sun.sunsetHour,
          translate: t,
        })}
      />
      {firstTip === undefined ? null : <TodayTip tip={firstTip} />}
    </>
  );
}
