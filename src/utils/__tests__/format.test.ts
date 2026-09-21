import {
  formatClock,
  formatDelta,
  formatHour,
  formatPercent,
  formatPressure,
  formatTemperature,
  formatWindSpeed,
  pad2,
} from '../format';

describe('format', () => {
  it('pads to two digits', () => {
    expect(pad2(5)).toBe('05');
    expect(pad2(19)).toBe('19');
  });

  it('renders a fractional hour as a clock time', () => {
    expect(formatClock(5.683)).toBe('05:41');
    expect(formatClock(19.967)).toBe('19:58');
    expect(formatHour(6)).toBe('06:00');
  });

  it('signs temperatures', () => {
    expect(formatTemperature('metric', 14)).toBe('+14');
    expect(formatTemperature('metric', -3)).toBe('-3');
    expect(formatTemperature('metric', 0)).toBe('0');
    expect(formatTemperature('imperial', 0)).toBe('+32');
  });

  it('signs deltas to one decimal', () => {
    expect(formatDelta(1.53)).toBe('+1.5');
    expect(formatDelta(-1.53)).toBe('-1.5');
    expect(formatDelta(0)).toBe('0');
  });

  it('renders pressure in the active system', () => {
    expect(formatPressure('metric', 997)).toBe('748');
    expect(formatPressure('imperial', 1013.25)).toBe('29.92');
  });

  it('rounds wind speed and percentages', () => {
    expect(formatWindSpeed('metric', 4.4)).toBe('4');
    expect(formatWindSpeed('imperial', 4.4)).toBe('10');
    expect(formatPercent(69.6)).toBe('70');
  });
});
