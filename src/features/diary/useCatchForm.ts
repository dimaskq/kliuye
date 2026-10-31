import { useCallback, useState } from 'react';

import type { CatchDraft } from '@/domain/diary';
import { shiftDays } from '@/domain/diary';
import { useActiveSpot, useLeave, useNow, useSpotLabel } from '@/hooks';
import { useDiary, useSelection } from '@/store';

import { draftOf, emptyForm, formOf } from './catchForm';
import type { CatchForm } from './catchForm';

export type CatchFormState = {
  form: CatchForm;
  /** True while adding; an existing entry can also be deleted. */
  isNew: boolean;
  set: <K extends keyof CatchForm>(key: K, value: CatchForm[K]) => void;
  stepDay: (delta: number) => void;
  save: () => void;
  remove: () => void;
};

/** Writing an entry away and leaving the screen, whichever button was pressed. */
function useCommit(id: string | undefined) {
  const leave = useLeave('/diary');
  const add = useDiary((state) => state.add);
  const update = useDiary((state) => state.update);
  const drop = useDiary((state) => state.remove);

  return {
    save: (draft: CatchDraft): void => {
      if (id === undefined) add(draft);
      else update(id, draft);
      leave();
    },
    remove: (): void => {
      if (id !== undefined) drop(id);
      leave();
    },
  };
}

/** The add/edit form, prefilled from the water and species already in view. */
export function useCatchForm(id: string | undefined): CatchFormState {
  const now = useNow();
  const { spot } = useActiveSpot();
  const place = useSpotLabel()(spot).name;
  const speciesId = useSelection((state) => state.speciesId);
  const entry = useDiary((state) => state.catches.find((item) => item.id === id));
  const commit = useCommit(id);

  /* Seeded once: after that the fields belong to the user, not to the screen. */
  const [form, setForm] = useState<CatchForm>(() =>
    entry === undefined ? emptyForm(now, speciesId, place, spot.coordinates) : formOf(entry),
  );

  const set: CatchFormState['set'] = useCallback(
    (key, value) => setForm((current) => ({ ...current, [key]: value })),
    [],
  );

  return {
    form,
    isNew: id === undefined,
    set,
    stepDay: (delta) => set('caughtAt', shiftDays(form.caughtAt, delta)),
    /* An edited entry keeps its own point, not whatever water is in view now. */
    save: () => commit.save(draftOf(form)),
    remove: commit.remove,
  };
}
