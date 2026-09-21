import { colors, fontFamily } from '@/ui';

/**
 * The classic teardrop map pin: a round head with a point at the bottom, so the
 * tip marks the exact coordinate. Shared by the native map and the web preview
 * so both draw the same mark.
 */
export const PIN = {
  width: 40,
  height: 52,
  /** Head: a circle of radius 20 at (20, 20). Tail: down to the tip at (20, 52). */
  path: 'M20 52C20 52 40 32.5 40 20A20 20 0 1 0 0 20C0 32.5 20 52 20 52Z',
  /** The head's centre, where the index sits; y is a true text baseline. */
  labelX: 20,
  labelBaselineY: 25.5,
  fontSize: 15,
  strokeWidth: 2.5,
  /** A dashed edge marks the one pin that can be dragged. */
  dashArray: '5 4',
} as const;

export type PinStyle = {
  fill: string;
  label: string;
  stroke: string;
  dashArray: string | undefined;
};

/** DESIGN_SPEC §6: the selected pin is blaze orange, the rest are pale. */
export function pinStyle(selected: boolean, draggable: boolean): PinStyle {
  return {
    fill: selected ? colors.accent : colors.bg,
    label: selected ? colors.onAccent : colors.text,
    stroke: draggable ? colors.accent900 : colors.bg,
    dashArray: draggable ? PIN.dashArray : undefined,
  };
}

/** The same pin as markup, for Leaflet's `divIcon`. */
export function pinSvgMarkup(value: number | undefined, style: PinStyle): string {
  const dash = style.dashArray === undefined ? '' : ` stroke-dasharray="${style.dashArray}"`;
  return (
    `<svg width="${PIN.width}" height="${PIN.height}" viewBox="0 0 ${PIN.width} ${PIN.height}" xmlns="http://www.w3.org/2000/svg">` +
    `<path d="${PIN.path}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="${PIN.strokeWidth}"${dash}/>` +
    `<text x="${PIN.labelX}" y="${PIN.labelBaselineY}" text-anchor="middle" ` +
    `fill="${style.label}" font-family="${fontFamily.heading}, sans-serif" font-size="${PIN.fontSize}" font-weight="800">` +
    `${value ?? ''}</text></svg>`
  );
}
