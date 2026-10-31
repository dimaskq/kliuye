import { useCallback } from 'react';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { registerTarget } from './spotlightTargets';

export type SpotlightTargetProps = {
  /** The id a tour step points at. */
  id: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

/** Marks a part of the screen a spotlight tour can light up; draws nothing itself. */
export function SpotlightTarget({ id, style, children }: SpotlightTargetProps): React.JSX.Element {
  /* Stable, so a re-render of the screen does not unregister and register it again. */
  const ref = useCallback((view: View | null) => registerTarget(id, view), [id]);
  return (
    <View
      /* A plain wrapper would be flattened away on Android and could not be measured. */
      collapsable={false}
      style={style}
      ref={ref}
    >
      {children}
    </View>
  );
}
