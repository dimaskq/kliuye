import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '@/hooks/useReduceMotion';
import { Icon, IconButton, Text, colors, iconSize, space, MIN_TOUCH_SIZE } from '@/ui';

export type LocationHeaderProps = {
  spotName: string;
  /** "Вишгород · сб, 12 квітня · 05:41" — place, date and update time. */
  subtitle: string;
  /** Spoken hint telling the reader that tapping changes the place. */
  changeHint: string;
  settingsLabel: string;
  placesLabel: string;
  refreshLabel: string;
  /** True while a fresh forecast is on its way; the refresh icon turns. */
  refreshing: boolean;
  onChangeSpot: () => void;
  onOpenSettings: () => void;
  onOpenPlaces: () => void;
  onRefresh: () => void;
};

const SPIN_MS = 900;

const HEADER_BUTTON = { background: colors.surface } as const;

/** Turns while the forecast reloads; with reduced motion it only dims. */
function RefreshIcon({ spinning }: { spinning: boolean }): React.JSX.Element {
  const reduceMotion = useReduceMotion();
  const turn = useSharedValue(0);

  useEffect(() => {
    if (spinning && !reduceMotion) {
      turn.value = withRepeat(withTiming(1, { duration: SPIN_MS, easing: Easing.linear }), -1);
      return;
    }
    cancelAnimation(turn);
    turn.value = 0;
  }, [reduceMotion, spinning, turn]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 360}deg` }] }));

  return (
    <Animated.View style={[style, { opacity: spinning ? 0.5 : 1 }]}>
      <Icon name="refresh" size={iconSize.action} />
    </Animated.View>
  );
}

type ActionsProps = Pick<
  LocationHeaderProps,
  | 'settingsLabel'
  | 'placesLabel'
  | 'refreshLabel'
  | 'refreshing'
  | 'onOpenSettings'
  | 'onOpenPlaces'
  | 'onRefresh'
>;

function HeaderActions(props: ActionsProps): React.JSX.Element {
  return (
    <View style={{ flexDirection: 'row', gap: space.md }}>
      <IconButton
        {...HEADER_BUTTON}
        icon="refresh"
        label={props.refreshLabel}
        onPress={props.onRefresh}
        busy={props.refreshing}
      >
        <RefreshIcon spinning={props.refreshing} />
      </IconButton>
      <IconButton
        {...HEADER_BUTTON}
        icon="list"
        label={props.placesLabel}
        onPress={props.onOpenPlaces}
      />
      <IconButton
        {...HEADER_BUTTON}
        icon="settings"
        label={props.settingsLabel}
        onPress={props.onOpenSettings}
      />
    </View>
  );
}

export function LocationHeader({
  spotName,
  subtitle,
  changeHint,
  onChangeSpot,
  ...actions
}: LocationHeaderProps): React.JSX.Element {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: space.xl,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={spotName}
        accessibilityHint={changeHint}
        onPress={onChangeSpot}
        style={({ pressed }) => ({
          flex: 1,
          minHeight: MIN_TOUCH_SIZE,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Icon name="map-pin" size={iconSize.header} color={colors.accent} />
          <Text variant="title" numberOfLines={1} style={{ flexShrink: 1 }}>
            {spotName}
          </Text>
          <Icon name="chevron-right" size={iconSize.inline} color={colors.textAlpha[35]} />
        </View>
        <Text variant="meta" color={colors.textAlpha[55]} style={{ marginTop: 3 }}>
          {subtitle}
        </Text>
      </Pressable>
      <HeaderActions {...actions} />
    </View>
  );
}
