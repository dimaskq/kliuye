import { View } from 'react-native';

import { colors, screenPadding, space } from '../tokens';

import { Button } from './Button';
import { Text } from './Text';

export type ErrorScreenProps = {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
};

/** Root failure state: says what happened and offers a single way forward. */
export function ErrorScreen({
  title,
  body,
  actionLabel,
  onAction,
}: ErrorScreenProps): React.JSX.Element {
  return (
    <View
      style={[
        screenPadding.standard,
        { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', gap: space.xl },
      ]}
    >
      <Text variant="h2" accessibilityRole="header">
        {title}
      </Text>
      <Text variant="body" color={colors.textAlpha[68]}>
        {body}
      </Text>
      <Button label={actionLabel} onPress={onAction} />
    </View>
  );
}
