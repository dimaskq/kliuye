import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { LatLng } from '@/domain/geo';
import { openDirections } from '@/services/directions';
import type { TravelMode } from '@/services/directions';
import { Dialog, Icon, Text, colors, iconSize, radius, space } from '@/ui';
import type { IconName } from '@/ui';

export type RouteDialogProps = {
  visible: boolean;
  destination: LatLng;
  /** Named in the title and the buttons, so it is clear where the route leads. */
  name: string;
  onClose: () => void;
};

type ModeButtonProps = {
  icon: IconName;
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
};

function ModeButton({ icon, label, accessibilityLabel, onPress }: ModeButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center',
        gap: space.sm,
        paddingVertical: space.gap,
        borderRadius: radius.factorCard,
        backgroundColor: colors.surface,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Icon name={icon} size={iconSize.tab + 6} color={colors.accent} />
      <Text variant="label">{label}</Text>
    </Pressable>
  );
}

/**
 * Handing the route over to the phone's own maps app: it has the live position,
 * the traffic and the offline navigation, none of which a fishing forecast has
 * any business reimplementing. Two equal choices, neither preselected.
 */
export function RouteDialog({
  visible,
  destination,
  name,
  onClose,
}: RouteDialogProps): React.JSX.Element {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);

  const go = (mode: TravelMode): void => {
    setFailed(false);
    void openDirections(destination, mode).then((opened) => {
      if (opened) onClose();
      else setFailed(true);
    });
  };

  return (
    <Dialog
      visible={visible}
      closeLabel={t('common.close')}
      title={t('map.routeTitle', { name })}
      onClose={onClose}
    >
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <ModeButton
          icon="car"
          label={t('map.routeByCar')}
          accessibilityLabel={t('map.routeCarTo', { name })}
          onPress={() => go('driving')}
        />
        <ModeButton
          icon="footprints"
          label={t('map.routeWalk')}
          accessibilityLabel={t('map.routeWalkTo', { name })}
          onPress={() => go('walking')}
        />
      </View>
      {failed ? (
        <Text variant="caption" color={colors.textAlpha[68]}>
          {t('map.routeFailed')}
        </Text>
      ) : null}
    </Dialog>
  );
}
