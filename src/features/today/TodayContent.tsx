import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { verdictNoteKey, verdictWordKey } from '@/domain/bite-index';
import type { BiteScore, SpeciesId } from '@/domain/bite-index';
import type { Tip } from '@/domain/tips';
import type { BiteModel } from '@/hooks';
import { useDateFormat } from '@/hooks/useDateFormat';
import type { DailyForecast } from '@/services/weather';
import { usePreferences } from '@/store';
import { Card, NavRow, SectionHeader, SpotlightTarget, Text, space, useColors } from '@/ui';
import { formatHour } from '@/utils/format';

import {
  FactorGrid,
  HourlyChart,
  IndexCard,
  IndexExplainer,
  SpeciesPicker,
  TipCard,
  TomorrowCard,
} from './components';
import { toFactorCards } from './factorCards';
import { toTomorrow } from './tomorrow';

/**
 * The species index is about weather, not about this water. Without saying so
 * the angler read "pike 80" as "there is pike here".
 */
function SpeciesNote(): React.JSX.Element {
  const colors = useColors();
  const { t } = useTranslation();
  return (
    <Text variant="metaSm" color={colors.textAlpha[55]}>
      {t('howItWorks.speciesNote')}
    </Text>
  );
}

/** The way into the explanation of the number, right under what it is made of. */
function HowItWorksLink(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Card radiusToken="tipCard" style={{ paddingVertical: space.sm, paddingHorizontal: space.xs }}>
      <NavRow
        label={t('howItWorks.linkLabel')}
        hint={t('howItWorks.linkHint')}
        onPress={() => router.push('/how-it-works')}
      />
    </Card>
  );
}

type SpeciesChoiceProps = {
  selected: SpeciesId;
  scores: Readonly<Record<SpeciesId, number>>;
  onSelect: (species: SpeciesId) => void;
};

/** The quick chips, the way into the full catalogue, and what the chips do not mean. */
function SpeciesChoice({ selected, scores, onSelect }: SpeciesChoiceProps): React.JSX.Element {
  const router = useRouter();
  return (
    <>
      <SpotlightTarget id="today.species">
        <SpeciesPicker
          selected={selected}
          scores={scores}
          onSelect={onSelect}
          onOpenAll={() => router.push('/species')}
        />
      </SpotlightTarget>
      <SpeciesNote />
    </>
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

/** Under the factors: how the number is made, then the advice that follows from it. */
function Footer({ tip }: { tip: Tip | undefined }): React.JSX.Element {
  return (
    <>
      <HowItWorksLink />
      {tip === undefined ? null : <TodayTip tip={tip} />}
    </>
  );
}

export type TodayContentProps = {
  model: BiteModel;
  /** The whole forecast, for the look at tomorrow. */
  days: readonly DailyForecast[];
  speciesId: SpeciesId;
  speciesScores: Readonly<Record<SpeciesId, number>>;
  selectedHour: number;
  onSelectSpecies: (species: SpeciesId) => void;
  onSelectHour: (hour: number) => void;
  onStepHour: (delta: number) => void;
};

/** Everything below the location header, once a forecast is in hand. */
/** The line under the verdict: why the fish is ruled out, when it is, else what the verdict means. */
function verdictNoteFor(score: BiteScore): string {
  return score.ruledOut === undefined ? verdictNoteKey(score.verdict) : `verdict.${score.ruledOut}`;
}

/** Tomorrow, with the way into the whole week. */
function Tomorrow({ model, days }: { model: BiteModel; days: readonly DailyForecast[] }) {
  const { t } = useTranslation();
  const router = useRouter();
  const dates = useDateFormat();
  const unitSystem = usePreferences((state) => state.unitSystem);
  const tomorrow = toTomorrow(days, model.week, unitSystem, t);
  if (tomorrow === undefined) return null;
  return (
    <TomorrowCard
      model={tomorrow}
      title={t('tomorrow.title', {
        day: dates.weekday(tomorrow.date),
        date: dates.shortDate(tomorrow.date),
      })}
      tidesTitle={t('tomorrow.tides')}
      weekLabel={t('tomorrow.week')}
      weekHint={t('tomorrow.weekHint')}
      onOpenWeek={() => router.push('/week')}
    />
  );
}

/** The number, and — until it has been read once — where the number comes from. */
function TodayIndex({ score }: { score: BiteScore }): React.JSX.Element {
  const { t } = useTranslation();
  const verdict = t(verdictWordKey(score.verdict));
  return (
    <>
      <SpotlightTarget id="today.index">
        <IndexCard
          value={score.value}
          indexLabel={t('today.indexLabel')}
          verdictWord={verdict}
          verdictNote={t(verdictNoteFor(score))}
          windowLabel={t('today.bestWindow', {
            start: formatHour(score.bestWindow.startHour),
            end: formatHour(score.bestWindow.endHour),
          })}
          accessibilityLabel={t('today.indexAccessible', { value: score.value, verdict })}
        />
      </SpotlightTarget>
      <IndexExplainer />
    </>
  );
}

export function TodayContent({
  model,
  days,
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

  return (
    <>
      <TodayIndex score={score} />
      <SectionHeader title={t('today.sectionSpecies')} aside={t('today.sectionSpeciesAside')} />
      <SpeciesChoice selected={speciesId} scores={speciesScores} onSelect={onSelectSpecies} />
      <HourlyChart
        curve={curve}
        selectedHour={selectedHour}
        onSelectHour={onSelectHour}
        onStepHour={onStepHour}
      />
      <Tomorrow model={model} days={days} />
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
      <Footer tip={firstTip} />
    </>
  );
}
