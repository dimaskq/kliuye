import { CUSTOM_SPOT_ID } from '@/domain/spots';
import { lightColors as colors } from '@/ui';

import { PIN, pinStyle, pinSvgMarkup } from '../components';

describe('pinStyle', () => {
  it('fills the selected pin with the accent and the rest with the ground colour', () => {
    expect(pinStyle(true, false, colors).fill).toBe(colors.accent);
    expect(pinStyle(true, false, colors).label).toBe(colors.onAccent);
    expect(pinStyle(false, false, colors).fill).toBe(colors.bg);
    expect(pinStyle(false, false, colors).label).toBe(colors.text);
  });

  it('dashes the edge of the one pin that can be dragged', () => {
    expect(pinStyle(true, true, colors).dashArray).toBe(PIN.dashArray);
    expect(pinStyle(true, false, colors).dashArray).toBeUndefined();
  });
});

describe('pinSvgMarkup', () => {
  it('draws the teardrop with its index inside', () => {
    const markup = pinSvgMarkup(78, pinStyle(true, false, colors));
    expect(markup).toContain(PIN.path);
    expect(markup).toContain('>78</text>');
    expect(markup).toContain(colors.accent);
    expect(markup).not.toContain('stroke-dasharray');
  });

  it('dashes the draggable pin', () => {
    expect(pinSvgMarkup(78, pinStyle(true, true, colors))).toContain(
      `stroke-dasharray="${PIN.dashArray}"`,
    );
  });

  it('draws an empty head while a forecast is still on its way', () => {
    expect(pinSvgMarkup(undefined, pinStyle(false, false, colors))).toContain('></text>');
  });

  it('keeps the tip at the bottom of the box, so it can anchor on the coordinate', () => {
    expect(PIN.path.startsWith(`M${PIN.labelX} ${PIN.height}`)).toBe(true);
    expect(CUSTOM_SPOT_ID).toBe('custom');
  });
});
