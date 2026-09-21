import type { DailyBiteScore } from '@/domain/bite-index';

import { planBiteAlerts } from '..';

function day(dayOffset: number, value: number, startHour: number): DailyBiteScore {
  return {
    dayOffset,
    value,
    verdict: value >= 82 ? 'feeding' : value >= 66 ? 'good' : 'moderate',
    factors: [],
    bestWindow: { startHour, endHour: startHour + 3 },
    confidence: 1,
  };
}

/* 21 September, 10:00 local time. */
const NOW = new Date(2026, 8, 21, 10, 0);

describe('planBiteAlerts', () => {
  it('warns an hour before the best window, on good days only', () => {
    const alerts = planBiteAlerts([day(1, 88, 5), day(2, 50, 6), day(3, 70, 18)], NOW);
    expect(alerts.map((alert) => alert.dayOffset)).toEqual([1, 3]);
    expect(alerts[0]?.fireAt).toEqual(new Date(2026, 8, 22, 4, 0));
    expect(alerts[1]?.fireAt).toEqual(new Date(2026, 8, 24, 17, 0));
    expect(alerts[0]?.verdict).toBe('feeding');
  });

  it('drops a window that is already under way', () => {
    expect(planBiteAlerts([day(0, 90, 6)], NOW)).toEqual([]);
    expect(planBiteAlerts([day(0, 90, 18)], NOW)).toHaveLength(1);
  });

  it('warns the evening before a window that opens at midnight', () => {
    const [alert] = planBiteAlerts([day(1, 90, 0)], NOW);
    expect(alert?.fireAt).toEqual(new Date(2026, 8, 21, 23, 0));
  });

  it('stays quiet through a week of poor bites', () => {
    expect(planBiteAlerts([day(0, 30, 12), day(1, 40, 12)], NOW)).toEqual([]);
  });
});
