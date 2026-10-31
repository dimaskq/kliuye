import type { ImageSourcePropType } from 'react-native';

import type { SpeciesId } from '@/domain/bite-index';

/**
 * A picture for every fish, so a name the angler calls something else is still
 * recognised at a glance. Hand-coloured engravings from Marcus Elieser Bloch's
 * "Ichthyologie" (1782–1795), all in the public domain and all in one hand, so
 * the catalogue reads as one book; the bluefish, which Bloch never drew, is a
 * public-domain NOAA drawing. Sources are listed in `assets/species/SOURCES.md`.
 *
 * "All species" has no picture: it is not a fish.
 */
export const SPECIES_ART: Partial<Record<SpeciesId, ImageSourcePropType>> = {
  pike: require('../../../assets/species/pike.png') as ImageSourcePropType,
  perch: require('../../../assets/species/perch.png') as ImageSourcePropType,
  zander: require('../../../assets/species/zander.png') as ImageSourcePropType,
  bream: require('../../../assets/species/bream.png') as ImageSourcePropType,
  roach: require('../../../assets/species/roach.png') as ImageSourcePropType,
  carp: require('../../../assets/species/carp.png') as ImageSourcePropType,
  catfish: require('../../../assets/species/catfish.png') as ImageSourcePropType,
  crucian: require('../../../assets/species/crucian.png') as ImageSourcePropType,
  trout: require('../../../assets/species/trout.png') as ImageSourcePropType,
  flounder: require('../../../assets/species/flounder.png') as ImageSourcePropType,
  turbot: require('../../../assets/species/turbot.png') as ImageSourcePropType,
  mullet: require('../../../assets/species/mullet.png') as ImageSourcePropType,
  horseMackerel: require('../../../assets/species/horseMackerel.png') as ImageSourcePropType,
  bluefish: require('../../../assets/species/bluefish.png') as ImageSourcePropType,
  goby: require('../../../assets/species/goby.png') as ImageSourcePropType,
  saithe: require('../../../assets/species/saithe.png') as ImageSourcePropType,
  cod: require('../../../assets/species/cod.png') as ImageSourcePropType,
  mackerel: require('../../../assets/species/mackerel.png') as ImageSourcePropType,
  salmon: require('../../../assets/species/salmon.png') as ImageSourcePropType,
  halibut: require('../../../assets/species/halibut.png') as ImageSourcePropType,
};
