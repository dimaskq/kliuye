import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useDeviceLocation } from '@/hooks';
import { PermissionBanner } from '@/ui';

/**
 * Shown only when we have never asked and no water was chosen by hand. It is
 * the explanation screen the stores require before any system prompt, and it
 * never blocks: "pick a water manually" is an equal option.
 */
export function LocationPrompt(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const { request } = useDeviceLocation();

  return (
    <PermissionBanner
      title={t('map.permissionTitle')}
      body={t('map.permissionBody')}
      allowLabel={t('map.permissionAllow')}
      manualLabel={t('map.permissionManual')}
      onAllow={request}
      onManual={() => router.push('/map')}
    />
  );
}
