import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsOnline } from '@/hooks';
import { OfflineBanner, space } from '@/ui';

/**
 * The app-wide offline marker: one floating pill over whatever tab is open,
 * gone the moment the signal returns. It is mounted once, in the tab layout,
 * rather than repeated on every screen.
 */
export function OfflineNotice(): React.JSX.Element | null {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const online = useIsOnline();

  if (online) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: insets.top + space.sm,
        left: space.h,
        right: space.h,
      }}
    >
      <OfflineBanner label={t('common.offline')} />
    </View>
  );
}
