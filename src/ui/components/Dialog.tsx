import { KeyboardAvoidingView, Modal, Pressable, View } from 'react-native';

import { useColors } from '../theme';
import { space, MIN_TOUCH_SIZE } from '../tokens';

import { Card } from './Card';
import { IconButton } from './IconButton';
import { Text } from './Text';

export type DialogProps = {
  visible: boolean;
  title: string;
  /** Spoken name of the cross in the corner. */
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
};

/**
 * The app's pop-ups: a card over a dimmed screen. A tap outside, the cross or
 * the system back gesture all close it.
 */
export function Dialog({
  visible,
  title,
  closeLabel,
  onClose,
  children,
}: DialogProps): React.JSX.Element {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Both platforms: edge-to-edge Android does not resize for the keyboard. */}
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1, justifyContent: 'center', padding: space.gap }}
      >
        <Pressable
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: colors.scrim,
          }}
        />
        <Card elevated style={{ backgroundColor: colors.bg, padding: space.gap, gap: space.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="h4" style={{ flex: 1 }}>
              {title}
            </Text>
            <IconButton
              icon="x"
              label={closeLabel}
              onPress={onClose}
              size={MIN_TOUCH_SIZE}
              color={colors.textAlpha[55]}
            />
          </View>
          {visible ? children : null}
        </Card>
      </KeyboardAvoidingView>
    </Modal>
  );
}
