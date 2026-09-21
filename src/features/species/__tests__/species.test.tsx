import { HttpResponse, http } from 'msw';

import { HABITATS, SPECIES_IDS, profileFor, speciesOf } from '@/domain/bite-index';
import type { SpeciesId } from '@/domain/bite-index';
import { SpeciesScreen, speciesGroups } from '@/features/species';
import { useSelection } from '@/store';
import { makeForecastResponse, makeMarineResponse } from '@tests/factories/open-meteo';
import { server } from '@tests/msw/server';
import { fireEvent, renderWithProviders, screen, waitFor } from '@tests/render';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';
const scores = Object.fromEntries(SPECIES_IDS.map((id, index) => [id, 90 - index])) as Record<
  SpeciesId,
  number
>;
const initialSelection = useSelection.getState();

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
beforeEach(() => {
  jest.useRealTimers();
  useSelection.setState(initialSelection, true);
  server.use(
    http.get(FORECAST_URL, () => HttpResponse.json(makeForecastResponse())),
    http.get(MARINE_URL, () => HttpResponse.json(makeMarineResponse())),
  );
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('speciesGroups', () => {
  it('covers every species exactly once, across the habitats', () => {
    const grouped = speciesGroups(scores, 7).flatMap((group) => group.rows.map((row) => row.id));
    expect([...grouped].sort()).toEqual([...SPECIES_IDS].sort());
  });

  it('groups by the habitat on the profile, so a new species lands by itself', () => {
    speciesGroups(scores, 7).forEach((group) => {
      expect(group.rows.map((row) => row.id)).toEqual(speciesOf(group.habitat));
      group.rows.forEach((row) => expect(profileFor(row.id).habitat).toBe(group.habitat));
    });
  });

  it('keeps the habitats in catalogue order and drops none of them', () => {
    expect(speciesGroups(scores, 7).map((group) => group.habitat)).toEqual([...HABITATS]);
  });

  it('says whether the month is one that species is taken in', () => {
    const january = speciesGroups(scores, 1).flatMap((group) => group.rows);
    const july = speciesGroups(scores, 7).flatMap((group) => group.rows);
    expect(january.find((row) => row.id === 'carp')?.inSeason).toBe(false);
    expect(july.find((row) => row.id === 'carp')?.inSeason).toBe(true);
    /* Flounder is a cold-season fish; it is the other way round. */
    expect(january.find((row) => row.id === 'flounder')?.inSeason).toBe(true);
    expect(july.find((row) => row.id === 'flounder')?.inSeason).toBe(false);
  });

  it('carries the optimal water band of each species', () => {
    const rows = speciesGroups(scores, 7).flatMap((group) => group.rows);
    expect(rows.find((row) => row.id === 'flounder')?.optimum).toEqual([6, 14]);
    expect(rows.find((row) => row.id === 'carp')?.optimum).toEqual([18, 26]);
  });
});

describe('SpeciesScreen', () => {
  it('lists the river and the sea groups, each with its species', async () => {
    await renderWithProviders(<SpeciesScreen />);

    await waitFor(() => expect(screen.getByRole('header', { name: 'Морські' })).toBeOnTheScreen());
    expect(screen.getByRole('header', { name: 'Річкові й озерні' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Без прив’язки до виду' })).toBeOnTheScreen();

    expect(screen.getByText('Камбала')).toBeOnTheScreen();
    expect(screen.getByText('Ставрида')).toBeOnTheScreen();
    expect(screen.getByText('Щука')).toBeOnTheScreen();
    expect(screen.getByText('Усі види')).toBeOnTheScreen();
  }, 20_000);

  it('picks a specific fish and marks it as the choice', async () => {
    await renderWithProviders(<SpeciesScreen />);
    await waitFor(() => expect(screen.getByText('Луфар')).toBeOnTheScreen());

    await fireEvent.press(screen.getByText('Луфар'));
    expect(useSelection.getState().speciesId).toBe('bluefish');
  }, 20_000);

  it('shows the optimal water band, and says when a fish is out of season', async () => {
    await renderWithProviders(<SpeciesScreen />);
    await waitFor(() => expect(screen.getByText('Камбала')).toBeOnTheScreen());
    expect(screen.getAllByText(/вода \d+–\d+°/).length).toBeGreaterThan(1);
  }, 20_000);
});
