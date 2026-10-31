import { useEffect, useRef } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '../theme';
import { screenPadding, space } from '../tokens';

export type ScreenProps = {
  children: React.ReactNode;
  /** `today` uses a tighter top padding than the other tabs. */
  padding?: keyof typeof screenPadding;
  gap?: number;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * A form: the body shrinks above the keyboard and scrolls the field being
   * typed into back into view.
   */
  keyboardAware?: boolean;
};

/** How far below the top of the screen a focused field comes to rest. */
const FIELD_TOP_OFFSET = 96;

/**
 * Brings the focused field into view once the keyboard is up. Android with
 * edge-to-edge — every Android build of the app — no longer resizes the window
 * for the keyboard, so `adjustResize` alone left a note being typed under it.
 */
function useFollowKeyboard(
  enabled: boolean,
  scroll: React.RefObject<ScrollView | null>,
  content: React.RefObject<View | null>,
): void {
  useEffect(() => {
    if (!enabled) return undefined;
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      /* Typed as always present, but it is null when nothing has focus. */
      const input = TextInput.State.currentlyFocusedInput() as ReturnType<
        typeof TextInput.State.currentlyFocusedInput
      > | null;
      const target = content.current;
      if (input === null || target === null) return;
      input.measureLayout(
        target,
        (_x, y) => scroll.current?.scrollTo({ y: Math.max(0, y - FIELD_TOP_OFFSET) }),
        () => undefined,
      );
    });
    return () => subscription.remove();
  }, [content, enabled, scroll]);
}

/**
 * Scrollable screen body. Content scrolls rather than clipping, which keeps the
 * layout usable at 200% font scale (STORE_REVIEW.md §7).
 */
export function Screen({
  children,
  padding = 'standard',
  gap = space.h,
  onRefresh,
  refreshing = false,
  contentStyle,
  keyboardAware = false,
}: ScreenProps): React.JSX.Element {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  const content = useRef<View>(null);
  useFollowKeyboard(keyboardAware, scroll, content);

  const body = (
    <ScrollView
      ref={scroll}
      style={{ flex: 1, backgroundColor: colors.bg }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingTop: insets.top }}
      refreshControl={
        onRefresh === undefined ? undefined : (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        )
      }
    >
      <View ref={content} style={[screenPadding[padding], { gap }, contentStyle]}>
        {children}
      </View>
    </ScrollView>
  );

  if (!keyboardAware) return body;
  /* "padding" on both platforms: with edge-to-edge Android reports the keyboard
     but does not resize the window, exactly like iOS. */
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: colors.bg }}>
      {body}
    </KeyboardAvoidingView>
  );
}
