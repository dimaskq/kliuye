/**
 * High and low water for one day, from an hourly sea-level series. Open-Meteo's
 * marine model includes the astronomical tide, so where the tide is real — the
 * Atlantic, the North Sea, the coast of Norway — the series swings by metres,
 * and where it is not — the Black Sea, the Baltic — by a few centimetres.
 */

export type TideKind = 'high' | 'low';

export type TideTurn = {
  kind: TideKind;
  /** Local hour of the day, fractional: 6.25 is 06:15. */
  hour: number;
  heightM: number;
};

export type TideDay = {
  turns: TideTurn[];
  /** Highest high minus lowest low, in metres. */
  rangeM: number;
};

/**
 * Below this the tide is not worth a line on the screen: the Black Sea moves
 * less than 10 cm, while a spot on the Norwegian coast moves 1–2 m.
 */
export const MEANINGFUL_TIDE_M = 0.3;

const HOURS_PER_DAY = 24;

/** Where the parabola through three hourly readings peaks, as -0.5..0.5 of an hour. */
function vertexOffset(before: number, at: number, after: number): number {
  const curvature = before - 2 * at + after;
  return curvature === 0 ? 0 : (0.5 * (before - after)) / curvature;
}

function turnAt(series: readonly number[], index: number, kind: TideKind): TideTurn {
  const before = series[index - 1]!;
  const at = series[index]!;
  const after = series[index + 1]!;
  const offset = vertexOffset(before, at, after);
  const heightM = at - 0.25 * (before - after) * offset;
  /* The series starts an hour before midnight, so index 1 is 00:00. */
  return { kind, hour: index - 1 + offset, heightM };
}

/**
 * The turns of the tide within one day. `hourly` holds the day's 24 readings
 * with one more on each side — 23:00 the day before to 00:00 the day after —
 * so a turn right at midnight is still found. `undefined` with any reading
 * missing: no tide is better than a wrong one.
 */
export function tideDay(hourly: readonly (number | null | undefined)[]): TideDay | undefined {
  if (hourly.length !== HOURS_PER_DAY + 2) return undefined;
  if (hourly.some((value) => value === null || value === undefined)) return undefined;
  const series = hourly as readonly number[];

  const turns: TideTurn[] = [];
  for (let index = 1; index <= HOURS_PER_DAY; index += 1) {
    const before = series[index - 1]!;
    const at = series[index]!;
    const after = series[index + 1]!;
    if (at > before && at >= after) turns.push(turnAt(series, index, 'high'));
    else if (at < before && at <= after) turns.push(turnAt(series, index, 'low'));
  }

  const inDay = turns.filter((turn) => turn.hour >= 0 && turn.hour < HOURS_PER_DAY);
  const day = series.slice(1, HOURS_PER_DAY + 1);
  return { turns: inDay, rangeM: Math.max(...day) - Math.min(...day) };
}

/** Whether the day's tide is big enough to matter to an angler. */
export function isMeaningfulTide(tide: TideDay | undefined): tide is TideDay {
  return tide !== undefined && tide.rangeM >= MEANINGFUL_TIDE_M && tide.turns.length > 0;
}
