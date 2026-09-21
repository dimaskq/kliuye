import { renderWithProviders, screen } from '@tests/render';

import { TipRow } from '../components';

describe('TipRow', () => {
  it('shows the reason, the advice and both tags', async () => {
    await renderWithProviders(
      <TipRow
        index={1}
        kicker="Тиск падає"
        title="Лови на межі мілини й свалу"
        body="На спадному тиску хижак виходить із ям."
        category="Спінінг"
        species="Щука, окунь"
        emphasised
      />,
    );
    expect(screen.getByText('Тиск падає')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Лови на межі мілини й свалу' })).toBeOnTheScreen();
    expect(screen.getByText('Спінінг')).toBeOnTheScreen();
    expect(screen.getByText('Щука, окунь')).toBeOnTheScreen();
    expect(screen.getByText('1')).toBeOnTheScreen();
  });
});
