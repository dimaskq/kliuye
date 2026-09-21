import { View } from 'react-native';

import { colors, space } from '../tokens';

import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';

export type PermissionBannerProps = {
  title: string;
  body: string;
  allowLabel: string;
  manualLabel: string;
  onAllow: () => void;
  onManual: () => void;
};

/**
 * Shown before any system prompt, and never blocking: declining leaves every
 * screen working with the bundled catalogue (STORE_REVIEW.md §1).
 */
export function PermissionBanner({
  title,
  body,
  allowLabel,
  manualLabel,
  onAllow,
  onManual,
}: PermissionBannerProps): React.JSX.Element {
  return (
    <Card radiusToken="tipCard" elevated style={{ padding: space.h, gap: space.md }}>
      <Text variant="h5" accessibilityRole="header">
        {title}
      </Text>
      <Text variant="bodySm" color={colors.textAlpha[68]}>
        {body}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.xs }}>
        <Button label={allowLabel} onPress={onAllow} />
        <Button label={manualLabel} onPress={onManual} tone="onDark" />
      </View>
    </Card>
  );
}
