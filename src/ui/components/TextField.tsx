import { TextInput, View } from 'react-native';
import type { KeyboardTypeOptions, ViewStyle } from 'react-native';

import { colors, radius, space, textVariants, MIN_TOUCH_SIZE } from '../tokens';

import { Icon } from './Icon';
import type { IconName } from './Icon';

const NOTE_MIN_HEIGHT = 96;

export type TextFieldProps = {
  value: string;
  placeholder: string;
  accessibilityLabel: string;
  onChange: (value: string) => void;
  /** Leading glyph; says what the field is for at a glance. */
  icon?: IconName;
  /** A note grows into a rounded box instead of staying a single-line pill. */
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  /** The keyboard's return key runs this instead of just closing. */
  onSubmit?: () => void;
};

function shell(multiline: boolean): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: multiline ? 'flex-start' : 'center',
    gap: space.md,
    minHeight: MIN_TOUCH_SIZE,
    backgroundColor: colors.surface,
    borderRadius: multiline ? radius.row : radius.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: space.xxl,
    paddingTop: multiline ? space.lg : 0,
  };
}

/** Pill-shaped text input, styled from the same tokens as every other control. */
export function TextField({
  value,
  placeholder,
  accessibilityLabel,
  onChange,
  icon = 'search',
  multiline = false,
  keyboardType = 'default',
  maxLength,
  onSubmit,
}: TextFieldProps): React.JSX.Element {
  return (
    <View style={shell(multiline)}>
      <Icon name={icon} color={colors.textAlpha[45]} />
      <TextInput
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textAlpha[45]}
        autoCorrect={false}
        multiline={multiline}
        keyboardType={keyboardType}
        {...(maxLength === undefined ? {} : { maxLength })}
        textAlignVertical={multiline ? 'top' : 'center'}
        returnKeyType={multiline ? 'default' : onSubmit === undefined ? 'done' : 'search'}
        {...(onSubmit === undefined ? {} : { onSubmitEditing: onSubmit })}
        style={[
          textVariants.body,
          {
            flex: 1,
            color: colors.text,
            paddingVertical: space.md,
            ...(multiline ? { minHeight: NOTE_MIN_HEIGHT } : {}),
          },
        ]}
      />
    </View>
  );
}
