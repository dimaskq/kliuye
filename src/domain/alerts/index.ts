import type { DailyBiteScore, VerdictId } from '../bite-index';

/** How long before the best window the angler hears about it. */
export const ALERT_LEAD_HOURS = 1;

/** Only days worth dropping everything for; a moderate day is not news. */
const ALERT_VERDICTS: ReadonlySet<VerdictId> = new Set(['feeding', 'good']);

const MS_PER_HOUR = 60 * 60 * 1000;

export type BiteAlert = {
  readonly dayOffset: number;
  readonly fireAt: Date;
  readonly value: number;
  readonly verdict: VerdictId;
  readonly startHour: number;
  readonly endHour: number;
};

/** Local midnight of the day `offset` days after `now`. */
function startOfDay(now: Date, offset: number): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
}

/**
 * One alert per good day in the forecast, an hour before that day's best
 * window. Alerts already in the past are dropped: nobody needs to hear about
 * a window that has begun.
 */
export function planBiteAlerts(week: readonly DailyBiteScore[], now: Date): BiteAlert[] {
  return week
    .filter((day) => ALERT_VERDICTS.has(day.verdict))
    .map((day) => {
      const { startHour, endHour } = day.bestWindow;
      const fireAt = new Date(
        startOfDay(now, day.dayOffset).getTime() + (startHour - ALERT_LEAD_HOURS) * MS_PER_HOUR,
      );
      return {
        dayOffset: day.dayOffset,
        fireAt,
        value: day.value,
        verdict: day.verdict,
        startHour,
        endHour,
      };
    })
    .filter((alert) => alert.fireAt.getTime() > now.getTime());
}
