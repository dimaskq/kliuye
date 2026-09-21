import type { SpeciesId } from '@/domain/bite-index';
import { useActiveSpot, useForecast, useSpeciesScores as useScoresAt } from '@/hooks';

/** The index each species would show for the water in view, at the current hour. */
export function useSpeciesScores(): Record<SpeciesId, number> {
  const { spot } = useActiveSpot();
  const { forecast } = useForecast(spot);
  return useScoresAt(forecast, spot, new Date(forecast?.fetchedAt ?? 0).getHours());
}
