import { Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, ReduceMotion } from 'react-native-reanimated';

import {
  ProgressTrack,
  Tag,
  Text,
  colors,
  motion,
  radius,
  scoreTextColor,
  sizes,
  space,
  MIN_TOUCH_SIZE,
} from '@/ui';

import type { DayRowModel, DayTag } from '../dayRows';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * `ReduceMotion.System` hands the decision to the OS setting, so the accordion
 * snaps open for anyone who has asked for less movement.
 */
const REDUCE = ReduceMotion.System;
const rowLayout = LinearTransition.duration(motion.expand).reduceMotion(REDUCE);
const tagsIn = FadeIn.duration(motion.fadeIn).reduceMotion(REDUCE);
const tagsOut = FadeOut.duration(motion.fadeOut).reduceMotion(REDUCE);

export type DayRowProps = {
  row: DayRowModel;
  weekday: string;
  shortDate: string;
  expanded: boolean;
  accessibilityLabel: string;
  onPress: () => void;
};

function DaySummary({ row }: { row: DayRowModel }): React.JSX.Element {
  return (
    <Animated.View style={{ flex: 1, gap: space.sm, minWidth: 0 }}>
      <ProgressTrack value={row.value} />
      <Text variant="caption" color={colors.textAlpha[58]} numberOfLines={1}>
        {row.summary}
      </Text>
    </Animated.View>
  );
}

function DayTags({ tags }: { tags: readonly DayTag[] }): React.JSX.Element {
  return (
    <Animated.View
      entering={tagsIn}
      exiting={tagsOut}
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 7,
        borderTopWidth: 1,
        borderTopColor: colors.textAlpha[10],
        paddingTop: space.md + 2,
      }}
    >
      {tags.map((tag) => (
        <Tag key={tag.label} tone={tag.tone} label={tag.label} />
      ))}
    </Animated.View>
  );
}

/** One day of the week list; tapping it opens the detail tags in place. */
export function DayRow({
  row,
  weekday,
  shortDate,
  expanded,
  accessibilityLabel,
  onPress,
}: DayRowProps): React.JSX.Element {
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      /* The row grows and its neighbours slide, rather than everything jumping. */
      layout={rowLayout}
      style={{
        minHeight: MIN_TOUCH_SIZE,
        borderRadius: radius.row,
        borderWidth: 1,
        borderColor: expanded ? 'transparent' : colors.textAlpha[12],
        backgroundColor: expanded ? colors.surface : 'transparent',
        paddingVertical: space.xxl,
        paddingHorizontal: space.h,
        gap: space.md + 2,
        overflow: 'hidden',
      }}
    >
      <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
        <Animated.View style={{ width: sizes.weekDayColumn }}>
          <Text variant="labelSm">{weekday}</Text>
          <Text variant="caption" color={colors.textAlpha[50]}>
            {shortDate}
          </Text>
        </Animated.View>
        <DaySummary row={row} />
        <Text
          variant="numericMd"
          align="right"
          color={scoreTextColor(row.value)}
          style={{ width: sizes.weekScoreColumn }}
        >
          {row.value}
        </Text>
      </Animated.View>
      {expanded ? <DayTags tags={row.tags} /> : null}
    </AnimatedPressable>
  );
}
