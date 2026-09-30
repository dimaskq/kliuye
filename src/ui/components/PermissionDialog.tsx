import { Modal, Pressable, ScrollView, View } from 'react-native';

import { colors, iconSize, radius, space, MIN_TOUCH_SIZE } from '../tokens';

import { Button } from './Button';
import { Card } from './Card';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { Text } from './Text';

export type PermissionReason = {
  icon: IconName;
  text: string;
};

export type PermissionDialogProps = {
  visible: boolean;
  title: string;
  body: string;
  /** What the permission buys, one line each. */
  reasons: readonly PermissionReason[];
  /** What happens to the data — said before the system prompt, not after. */
  privacy: string;
  allowLabel: string;
  manualLabel: string;
  laterLabel: string;
  onAllow: () => void;
  onManual: () => void;
  onLater: () => void;
};

const BADGE_SIZE = 56;

function Badge(): React.JSX.Element {
  return (
    <View
      style={{
        width: BADGE_SIZE,
        height: BADGE_SIZE,
        borderRadius: radius.pill,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.accent,
      }}
    >
      <Icon name="map-pin" size={iconSize.action * 1.4} color={colors.onAccent} />
    </View>
  );
}

function Reasons({ reasons }: { reasons: readonly PermissionReason[] }): React.JSX.Element {
  return (
    <View style={{ gap: space.lg }}>
      {reasons.map((reason) => (
        <View key={reason.text} style={{ flexDirection: 'row', gap: space.lg }}>
          <Icon name={reason.icon} size={iconSize.action} color={colors.accent700} />
          <Text variant="bodySm" style={{ flex: 1 }}>
            {reason.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

type ActionsProps = Pick<
  PermissionDialogProps,
  'allowLabel' | 'manualLabel' | 'laterLabel' | 'onAllow' | 'onManual' | 'onLater'
>;

function Actions(props: ActionsProps): React.JSX.Element {
  return (
    <View style={{ gap: space.md }}>
      <Button label={props.allowLabel} onPress={props.onAllow} style={{ alignSelf: 'stretch' }} />
      <Button
        label={props.manualLabel}
        onPress={props.onManual}
        tone="ink"
        style={{ alignSelf: 'stretch' }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={props.laterLabel}
        onPress={props.onLater}
        style={({ pressed }) => ({
          minHeight: MIN_TOUCH_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Text variant="label" color={colors.textAlpha[55]}>
          {props.laterLabel}
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * The explanation before a system permission prompt, in the middle of a dimmed
 * screen so it cannot be scrolled past. It never blocks: choosing a water by
 * hand and "later" are both there, and so is the system back gesture
 * (STORE_REVIEW.md §1).
 */
export function PermissionDialog({
  visible,
  title,
  body,
  reasons,
  privacy,
  ...actions
}: PermissionDialogProps): React.JSX.Element {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={actions.onLater}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: space.gap,
          backgroundColor: colors.scrim,
        }}
      >
        <Card
          elevated
          accessibilityViewIsModal
          style={{ backgroundColor: colors.bg, padding: space.gap, maxHeight: '100%' }}
        >
          <ScrollView contentContainerStyle={{ gap: space.xl }} bounces={false}>
            <Badge />
            <Text variant="h4" accessibilityRole="header" style={{ textAlign: 'center' }}>
              {title}
            </Text>
            <Text variant="body" color={colors.textAlpha[68]}>
              {body}
            </Text>
            <Reasons reasons={reasons} />
            <Text variant="meta" color={colors.textAlpha[55]}>
              {privacy}
            </Text>
            <Actions {...actions} />
          </ScrollView>
        </Card>
      </View>
    </Modal>
  );
}
