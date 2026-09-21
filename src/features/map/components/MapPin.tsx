import Svg, { Path, Text as SvgText } from 'react-native-svg';

import { fontFamily, shadows } from '@/ui';

import { PIN, pinStyle } from './pinShape';

export type MapPinProps = {
  /** Undefined until that water's own forecast has arrived. */
  value: number | undefined;
  selected: boolean;
  /** A dashed edge marks the one pin that can be dragged. */
  draggable?: boolean;
};

/** The teardrop pin; its tip sits on the coordinate it marks. */
export function MapPin({ value, selected, draggable = false }: MapPinProps): React.JSX.Element {
  const style = pinStyle(selected, draggable);

  return (
    <Svg
      width={PIN.width}
      height={PIN.height}
      viewBox={`0 0 ${PIN.width} ${PIN.height}`}
      style={shadows.md}
    >
      <Path
        d={PIN.path}
        fill={style.fill}
        stroke={style.stroke}
        strokeWidth={PIN.strokeWidth}
        {...(style.dashArray === undefined ? {} : { strokeDasharray: style.dashArray })}
      />
      <SvgText
        x={PIN.labelX}
        y={PIN.labelBaselineY}
        textAnchor="middle"
        fill={style.label}
        fontFamily={fontFamily.heading}
        fontSize={PIN.fontSize}
      >
        {value ?? ''}
      </SvgText>
    </Svg>
  );
}
