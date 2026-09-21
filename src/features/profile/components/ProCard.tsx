import { Card, Tag, Text, colors, space } from '@/ui';

export type ProCardProps = {
  title: string;
  body: string;
  soonLabel: string;
};

/**
 * No price and no purchase button in v1: an incomplete paywall is an Apple
 * 3.1.1 rejection (STORE_REVIEW.md §3).
 */
export function ProCard({ title, body, soonLabel }: ProCardProps): React.JSX.Element {
  return (
    <Card
      tone="accent"
      radiusToken="tipCard"
      style={{ paddingVertical: 17, paddingHorizontal: space.section, gap: 5 }}
    >
      <Text variant="h5" color={colors.accent900} accessibilityRole="header">
        {title}
      </Text>
      <Text variant="bodySm" color={colors.accent800}>
        {body}
      </Text>
      <Tag tone="accent" label={soonLabel} />
    </Card>
  );
}
