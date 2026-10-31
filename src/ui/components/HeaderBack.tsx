import { useColors } from '../theme';
import { iconSize, MIN_TOUCH_SIZE } from '../tokens';

import { IconButton } from './IconButton';

export type HeaderBackProps = {
  label: string;
  onPress: () => void;
};

/** The header's way back, present even when the page was opened first. */
export function HeaderBack({ label, onPress }: HeaderBackProps): React.JSX.Element {
  const colors = useColors();
  return (
    <IconButton
      icon="chevron-left"
      label={label}
      onPress={onPress}
      size={MIN_TOUCH_SIZE}
      glyphSize={iconSize.action}
      color={colors.text}
    />
  );
}
