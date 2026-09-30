import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useActiveSpot, useDeviceLocation } from '@/hooks';
import { useLocation } from '@/store';
import { PermissionDialog } from '@/ui';

/**
 * The explanation the stores require before the system prompt, as a dialog in
 * the middle of the screen so it is not missed. Shown once we know we have
 * never asked and no water was chosen by hand; "later" puts it off until the
 * next launch, and the app works fully without it.
 */
export function LocationPrompt(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const { request } = useDeviceLocation();
  const { canOfferLocation } = useActiveSpot();
  const dismissPrompt = useLocation((state) => state.dismissPrompt);

  return (
    <PermissionDialog
      visible={canOfferLocation}
      title={t('locationPrompt.title')}
      body={t('locationPrompt.body')}
      reasons={[
        { icon: 'cloud', text: t('locationPrompt.reasonWeather') },
        { icon: 'map-pin', text: t('locationPrompt.reasonWaters') },
        { icon: 'waves', text: t('locationPrompt.reasonSea') },
      ]}
      privacy={t('locationPrompt.privacy')}
      allowLabel={t('locationPrompt.allow')}
      manualLabel={t('locationPrompt.manual')}
      laterLabel={t('locationPrompt.later')}
      onAllow={() => {
        /* The dialog steps aside for the system prompt instead of sitting under it. */
        dismissPrompt();
        request();
      }}
      onManual={() => {
        dismissPrompt();
        router.push('/map');
      }}
      onLater={dismissPrompt}
    />
  );
}
