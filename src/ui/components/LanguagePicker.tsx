import { Pressable, View } from 'react-native';

import { SUPPORTED_LANGUAGES } from '@/i18n';
import type { Language } from '@/i18n';

import { colors, radius, space, MIN_TOUCH_SIZE } from '../tokens';

import { Text } from './Text';

export type LanguagePickerProps = {
  selected: Language;
  labels: Readonly<Record<Language, string>>;
  onSelect: (language: Language) => void;
};

/** Two equal chips; the active one is filled sage, per DESIGN_SPEC §8. */
export function LanguagePicker({
  selected,
  labels,
  onSelect,
}: LanguagePickerProps): React.JSX.Element {
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: space.md }}>
      {SUPPORTED_LANGUAGES.map((language) => {
        const active = language === selected;
        return (
          <Pressable
            key={language}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={labels[language]}
            onPress={() => onSelect(language)}
            style={{
              flex: 1,
              minHeight: MIN_TOUCH_SIZE,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: active ? colors.accent2700 : colors.textAlpha[14],
              backgroundColor: active ? colors.accent2700 : 'transparent',
              paddingVertical: 11,
              paddingHorizontal: space.xxl,
            }}
          >
            <Text variant="button" color={active ? colors.bg : colors.text}>
              {labels[language]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
