import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { speciesOf } from '@/domain/bite-index';
import { MAX_ATTACHMENTS, NOTE_LIMIT, PLACE_LIMIT, canShift } from '@/domain/diary';
import { useNow } from '@/hooks';
import { Button, Screen, Text, TextField, colors, space } from '@/ui';

import { DateField, FormField, MediaStrip, SpeciesChoice, TextButton } from './components';
import type { SpeciesChoiceGroup } from './components';
import { useAttachments } from './useAttachments';
import { useCatchForm } from './useCatchForm';
import type { CatchFormState } from './useCatchForm';
import { useCatchLabels } from './useCatchLabels';

const GROUPS: readonly SpeciesChoiceGroup[] = [
  { habitat: 'freshwater', title: 'speciesPicker.group.freshwater', ids: speciesOf('freshwater') },
  { habitat: 'sea', title: 'speciesPicker.group.sea', ids: speciesOf('sea') },
];

function WhenField({ form, stepDay }: Pick<CatchFormState, 'form' | 'stepDay'>): React.JSX.Element {
  const { t } = useTranslation();
  const labels = useCatchLabels();
  const now = useNow();
  return (
    <FormField label={t('diary.dateLabel')}>
      <DateField
        value={labels.day(form.caughtAt)}
        canGoBack={canShift(form.caughtAt, -1, now)}
        canGoForward={canShift(form.caughtAt, 1, now)}
        previousLabel={t('diary.previousDay')}
        nextLabel={t('diary.nextDay')}
        onStep={stepDay}
      />
    </FormField>
  );
}

function Details({ form, set }: Pick<CatchFormState, 'form' | 'set'>): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <>
      <FormField label={t('diary.weightLabel')} aside={t('diary.weightAside')}>
        <TextField
          icon="activity"
          value={form.weight}
          placeholder={t('diary.weightPlaceholder')}
          accessibilityLabel={t('diary.weightLabel')}
          keyboardType="decimal-pad"
          onChange={(value) => set('weight', value)}
        />
      </FormField>
      <FormField label={t('diary.placeLabel')}>
        <TextField
          icon="map-pin"
          value={form.place}
          placeholder={t('diary.placePlaceholder')}
          accessibilityLabel={t('diary.placeLabel')}
          maxLength={PLACE_LIMIT}
          onChange={(value) => set('place', value)}
        />
      </FormField>
    </>
  );
}

function NoteField({ form, set }: Pick<CatchFormState, 'form' | 'set'>): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <FormField label={t('diary.noteLabel')}>
      <TextField
        icon="lightbulb"
        value={form.note}
        placeholder={t('diary.notePlaceholder')}
        accessibilityLabel={t('diary.noteLabel')}
        multiline
        maxLength={NOTE_LIMIT}
        onChange={(value) => set('note', value)}
      />
    </FormField>
  );
}

/** The tile speaks for itself: adding, working, or no room left. */
function addKey({ busy, full }: { busy: boolean; full: boolean }): string {
  if (busy) return 'diary.mediaBusy';
  return full ? 'diary.mediaFull' : 'diary.mediaAdd';
}

function MediaField({ form, set }: Pick<CatchFormState, 'form' | 'set'>): React.JSX.Element {
  const { t } = useTranslation();
  const media = useAttachments(form.media, (value) => set('media', value));
  return (
    <FormField
      label={t('diary.mediaLabel')}
      aside={t('diary.mediaCount', { used: form.media.length, max: MAX_ATTACHMENTS })}
    >
      <MediaStrip
        media={form.media}
        label={t(addKey(media))}
        disabled={media.busy || media.full}
        removeLabel={(index) => t('diary.mediaRemove', { index })}
        onAdd={media.add}
        onRemove={media.remove}
      />
      {media.failed ? (
        <Text variant="metaSm" color={colors.textAlpha[68]} style={{ marginTop: space.xs }}>
          {t('diary.mediaFailed')}
        </Text>
      ) : null}
    </FormField>
  );
}

/** Add or edit one catch: when, what, how heavy, where, and a note. */
export function CatchScreen({ id }: { id?: string | undefined }): React.JSX.Element {
  const { t } = useTranslation();
  const labels = useCatchLabels();
  const state = useCatchForm(id);
  const { form, isNew, set } = state;

  return (
    <Screen gap={space.gap}>
      <Text variant="h2" accessibilityRole="header">
        {isNew ? t('diary.newTitle') : t('diary.editTitle')}
      </Text>
      <WhenField form={form} stepDay={state.stepDay} />
      <FormField label={t('diary.speciesLabel')}>
        <SpeciesChoice
          groups={GROUPS.map((group) => ({ ...group, title: t(group.title) }))}
          selected={form.speciesId}
          nameOf={labels.species}
          onSelect={(value) => set('speciesId', value)}
        />
      </FormField>
      <Details form={form} set={set} />
      <MediaField form={form} set={set} />
      <NoteField form={form} set={set} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.gap }}>
        <Button label={t('diary.save')} onPress={state.save} />
        {isNew ? null : <TextButton label={t('diary.delete')} onPress={state.remove} />}
      </View>
    </Screen>
  );
}
