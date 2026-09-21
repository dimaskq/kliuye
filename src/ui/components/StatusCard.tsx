import { View } from 'react-native';

import { colors, space } from '../tokens';

import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';

export type StatusCardProps = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** Error and empty states: says what happened and offers exactly one way out. */
export function StatusCard({
  title,
  body,
  actionLabel,
  onAction,
}: StatusCardProps): React.JSX.Element {
  return (
    <Card elevated style={{ padding: space.gap }}>
      <View style={{ gap: space.md }}>
        <Text variant="h5" accessibilityRole="header">
          {title}
        </Text>
        <Text variant="body" color={colors.textAlpha[68]}>
          {body}
        </Text>
        {actionLabel === undefined || onAction === undefined ? null : (
          <Button label={actionLabel} onPress={onAction} style={{ marginTop: space.sm }} />
        )}
      </View>
    </Card>
  );
}
