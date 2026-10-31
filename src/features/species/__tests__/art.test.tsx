import { existsSync } from 'fs';
import { join } from 'path';

import { SPECIES_IDS } from '@/domain/bite-index';
import { SPECIES_ART, SpeciesArt } from '@/features/species';
import { render, screen } from '@tests/render';

describe('species pictures', () => {
  it('has a picture for every fish, and none for "all species"', () => {
    const fish = SPECIES_IDS.filter((id) => id !== 'all');
    expect(Object.keys(SPECIES_ART).sort()).toEqual([...fish].sort());
    expect(SPECIES_ART.all).toBeUndefined();
  });

  it('ships every picture it names', () => {
    for (const id of Object.keys(SPECIES_ART)) {
      expect(existsSync(join(__dirname, '../../../../assets/species', `${id}.png`))).toBe(true);
    }
  });

  it('keeps the picture away from screen readers, which read the name instead', async () => {
    await render(<SpeciesArt species="pike" width={72} />);
    expect(screen.toJSON()).toHaveProp('accessibilityElementsHidden', true);
  });

  it('draws nothing for "all species"', async () => {
    await render(<SpeciesArt species="all" width={72} />);
    expect(screen.toJSON()).toBeNull();
  });
});
