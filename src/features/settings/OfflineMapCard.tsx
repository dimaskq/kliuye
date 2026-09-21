import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useTileCache } from '@/hooks';
import { Button, Card, Text, colors, space } from '@/ui';
import { formatMegabytes } from '@/utils/format';

/**
 * The offline map is the one feature that costs disk, so it says how much and
 * offers the way back. Clearing is safe at any moment: the tiles come back the
 * next time the map is opened with a connection.
 */
export function OfflineMapCard(): React.JSX.Element {
  const { t } = useTranslation();
  const cache = useTileCache();

  return (
    <Card radiusToken="tipCard" style={{ padding: space.h, gap: space.md }}>
      <Text variant="h5" accessibilityRole="header">
        {t('settings.offlineCacheTitle')}
      </Text>
      <Text variant="bodySm" color={colors.textAlpha[68]}>
        {cache.busy
          ? t('common.loading')
          : t('settings.offlineCacheSize', { size: formatMegabytes(cache.bytes) })}
      </Text>
      {cache.busy || cache.bytes === 0 ? null : (
        <View style={{ flexDirection: 'row', marginTop: space.xs }}>
          <Button label={t('settings.offlineCacheClear')} onPress={cache.clear} tone="onDark" />
        </View>
      )}
    </Card>
  );
}
