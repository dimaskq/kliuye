import { Image, View } from 'react-native';

import type { SpeciesId } from '@/domain/bite-index';

import { SPECIES_ART } from '../speciesArt';

/** Engravings are long and low; this frame fits a pike and a turbot alike. */
const ASPECT = 0.56;

export type SpeciesArtProps = {
  species: SpeciesId;
  width: number;
};

/**
 * The fish, drawn. Decorative: the name next to it is what a screen reader
 * says, so the picture is hidden from it. Nothing at all for "all species".
 */
export function SpeciesArt({ species, width }: SpeciesArtProps): React.JSX.Element | null {
  const source = SPECIES_ART[species];
  if (source === undefined) return null;
  const height = Math.round(width * ASPECT);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height, alignItems: 'center', justifyContent: 'center' }}
    >
      <Image source={source} style={{ width, height }} resizeMode="contain" />
    </View>
  );
}
