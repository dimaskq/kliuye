import {
  NO_DAY_SELECTED,
  TOGGLE_IDS,
  useAngler,
  useDiary,
  usePreferences,
  useSelection,
} from '../index';

const initialPreferences = usePreferences.getState();
const initialSelection = useSelection.getState();
const initialAngler = useAngler.getState();

beforeEach(() => {
  usePreferences.setState(initialPreferences, true);
  useSelection.setState(initialSelection, true);
  useAngler.setState(initialAngler, true);
});

describe('usePreferences', () => {
  it('starts in Ukrainian and metric, with only the offline map on', () => {
    const state = usePreferences.getState();
    expect(state.language).toBe('uk');
    expect(state.unitSystem).toBe('metric');
    expect(state.toggles.offlineMaps).toBe(true);
    TOGGLE_IDS.filter((id) => id !== 'offlineMaps').forEach((id) =>
      expect(state.toggles[id]).toBe(false),
    );
  });

  it('changes one switch without touching the others', () => {
    usePreferences.getState().setToggle('notifications', true);
    const { toggles } = usePreferences.getState();
    expect(toggles.notifications).toBe(true);
    expect(toggles.offlineMaps).toBe(true);
  });

  it('changes language and unit system', () => {
    usePreferences.getState().setLanguage('en');
    usePreferences.getState().setUnitSystem('imperial');
    expect(usePreferences.getState().language).toBe('en');
    expect(usePreferences.getState().unitSystem).toBe('imperial');
  });
});

describe('useSelection', () => {
  it('defaults to all species with today expanded', () => {
    const state = useSelection.getState();
    expect(state.speciesId).toBe('all');
    expect(state.selectedDayIndex).toBe(0);
    expect(state.selectedSpotId).toBeUndefined();
  });

  it('closes an already open day and opens a different one', () => {
    useSelection.getState().toggleDay(0);
    expect(useSelection.getState().selectedDayIndex).toBe(NO_DAY_SELECTED);
    useSelection.getState().toggleDay(3);
    expect(useSelection.getState().selectedDayIndex).toBe(3);
  });

  it('steps the hour from wherever it is, and stops at both ends of the day', () => {
    useSelection.setState({ selectedHour: 6 });
    useSelection.getState().stepHour(1);
    useSelection.getState().stepHour(1);
    expect(useSelection.getState().selectedHour).toBe(8);

    useSelection.setState({ selectedHour: 0 });
    useSelection.getState().stepHour(-1);
    expect(useSelection.getState().selectedHour).toBe(0);

    useSelection.setState({ selectedHour: 23 });
    useSelection.getState().stepHour(1);
    expect(useSelection.getState().selectedHour).toBe(23);
  });

  it('records the species, hour and spot', () => {
    useSelection.getState().setSpecies('pike');
    useSelection.getState().setHour(19);
    useSelection.getState().setSpot('s3');
    const state = useSelection.getState();
    expect([state.speciesId, state.selectedHour, state.selectedSpotId]).toEqual(['pike', 19, 's3']);
  });
});

describe('useAngler', () => {
  it('starts with no name and a real installation year — nothing is invented', () => {
    const state = useAngler.getState();
    expect(state.displayName).toBe('');
    /* Read when the store module loaded, which is before the fake clock is set. */
    expect(state.sinceYear).toBeGreaterThan(2000);
  });

  it('stores a display name', () => {
    useAngler.getState().setDisplayName('Тарас К.');
    expect(useAngler.getState().displayName).toBe('Тарас К.');
  });
});

describe('useDiary', () => {
  const draft = {
    caughtAt: new Date(2026, 4, 2, 7, 0).getTime(),
    speciesId: 'pike' as const,
    weightKg: 2.4,
    place: 'Затока',
    coordinates: { latitude: 50.62, longitude: 30.48 },
    note: 'На джиг',
    media: [],
  };

  beforeEach(() => {
    useDiary.setState({ catches: [] });
  });

  it('puts a new catch at the top of the list', () => {
    useDiary.getState().add(draft);
    useDiary.getState().add({ ...draft, speciesId: 'perch', weightKg: 0.3 });
    expect(useDiary.getState().catches.map((entry) => entry.speciesId)).toEqual(['perch', 'pike']);
  });

  it('edits an entry without changing its identity', () => {
    useDiary.getState().add(draft);
    const { id } = useDiary.getState().catches[0]!;
    useDiary.getState().update(id, { ...draft, weightKg: 3.1 });
    const [entry, ...rest] = useDiary.getState().catches;
    expect([entry!.id, entry!.weightKg]).toEqual([id, 3.1]);
    expect(rest).toHaveLength(0);
  });

  it('removes only the entry asked for', () => {
    useDiary.getState().add(draft);
    useDiary.getState().add({ ...draft, speciesId: 'perch' });
    const { id } = useDiary.getState().catches[0]!;
    useDiary.getState().remove(id);
    expect(useDiary.getState().catches.map((entry) => entry.speciesId)).toEqual(['pike']);
  });
});
