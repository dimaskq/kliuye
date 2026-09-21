import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  colors,
  iconSize,
  radius,
  sizes,
  space,
  MIN_TOUCH_SIZE,
  TAB_ICON_STROKE_WIDTH,
} from '../tokens';

import { Icon } from './Icon';
import type { IconName } from './Icon';
import { Text } from './Text';

export type TabItem = {
  key: string;
  label: string;
  icon: IconName;
  selected: boolean;
  onPress: () => void;
};

function Tab({ item }: { item: TabItem }): React.JSX.Element {
  const tint = item.selected ? colors.text : colors.textAlpha[52];
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: item.selected }}
      onPress={item.onPress}
      style={{
        flex: 1,
        alignItems: 'center',
        gap: space.xs,
        minHeight: MIN_TOUCH_SIZE,
        paddingVertical: 5,
      }}
    >
      <View
        style={{
          width: sizes.tabPill.width,
          height: sizes.tabPill.height,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          /* Never transparent: Android drops the rounded corners when a view's
             background switches from transparent to a colour. The bar's own
             colour looks the same and keeps the pill round. */
          backgroundColor: item.selected ? colors.accent : colors.surface,
        }}
      >
        <Icon
          name={item.icon}
          size={iconSize.tab}
          strokeWidth={TAB_ICON_STROKE_WIDTH}
          color={tint}
        />
      </View>
      <Text variant="tab" color={tint}>
        {item.label}
      </Text>
    </Pressable>
  );
}

/** Equal-width tabs; the active one wears an accent pill behind its icon. */
export function TabBar({ items }: { items: readonly TabItem[] }): React.JSX.Element {
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.textAlpha[8],
        paddingTop: space.md,
        paddingHorizontal: space.sm,
        paddingBottom: space.md + insets.bottom,
      }}
    >
      {items.map((item) => (
        <Tab key={item.key} item={item} />
      ))}
    </View>
  );
}
