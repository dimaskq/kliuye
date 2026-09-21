import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon, Text, colors, iconSize, radius, space, MIN_TOUCH_SIZE } from '@/ui';
import type { IconName } from '@/ui';

/** Leaflet draws its panes up to z-index 1000 on the web. */
export const OVERLAY_Z = 1001;

type Tone = 'ink' | 'plain' | 'blaze';

const TONE: Record<Tone, { background: string; foreground: string }> = {
  ink: { background: colors.text, foreground: colors.lure },
  plain: { background: colors.bg, foreground: colors.text },
  blaze: { background: colors.accent, foreground: colors.onAccent },
};

type ActionProps = { icon: IconName; label: string; tone: Tone; onPress: () => void };

function Action({ icon, label, tone, onPress }: ActionProps): React.JSX.Element {
  const { background, foreground } = TONE[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: MIN_TOUCH_SIZE + space.xl,
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.xs,
        borderRadius: radius.factorCard,
        backgroundColor: background,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Icon name={icon} size={iconSize.tab} color={foreground} />
      <Text variant="button" color={foreground} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export type PointActionsProps = {
  onOpen: () => void;
  /** Absent for the spot the angler is standing on. */
  onRoute?: (() => void) | undefined;
  /** Only a picked pin can be saved; catalogue waters are always there. */
  onSave?: (() => void) | undefined;
};

/** Floats over the foot of the map: go to the forecast, get there, or keep it. */
export function PointActions({ onOpen, onRoute, onSave }: PointActionsProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: space.xl,
        right: space.xl,
        bottom: space.xl,
        flexDirection: 'row',
        gap: space.md,
        zIndex: OVERLAY_Z,
      }}
    >
      <Action icon="fish" tone="ink" label={t('map.openForecast')} onPress={onOpen} />
      {onRoute === undefined ? null : (
        <Action icon="route" tone="plain" label={t('map.route')} onPress={onRoute} />
      )}
      {onSave === undefined ? null : (
        <Action icon="star" tone="blaze" label={t('map.save')} onPress={onSave} />
      )}
    </View>
  );
}
