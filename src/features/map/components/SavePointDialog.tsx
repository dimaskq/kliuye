import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Dialog, IconButton, Text, TextField, colors, iconSize, space } from '@/ui';

const CONFIRM_SIZE = 52;

export type SavePointDialogProps = {
  visible: boolean;
  /** The settlement the geocoder suggested; empty while it has not answered. */
  suggestedName: string;
  onCancel: () => void;
  onConfirm: (name: string) => void;
};

type NameRowProps = {
  suggestedName: string;
  onConfirm: (name: string) => void;
};

/**
 * Until the angler types, the field follows the suggestion — the geocoder may
 * answer after the dialog has opened.
 */
function NameRow({ suggestedName, onConfirm }: NameRowProps): React.JSX.Element {
  const { t } = useTranslation();
  const [edited, setEdited] = useState<string | undefined>(undefined);
  const name = edited ?? suggestedName;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <View style={{ flex: 1 }}>
        <TextField
          icon="map-pin"
          value={name}
          placeholder={t('map.namePlaceholder')}
          accessibilityLabel={t('map.nameLabel')}
          onChange={setEdited}
          onSubmit={() => onConfirm(name)}
        />
      </View>
      <IconButton
        icon="check"
        label={t('map.saveConfirm')}
        onPress={() => onConfirm(name)}
        size={CONFIRM_SIZE}
        glyphSize={iconSize.tab + 4}
        strokeWidth={3}
        color={colors.onAccent}
        background={colors.accent}
      />
    </View>
  );
}

/**
 * Keeping a picked point: the suggested name is filled in and can be changed;
 * the tick saves it and takes the angler to its forecast. The frame mounts
 * the form afresh on every opening, so an abandoned edit does not come back.
 */
export function SavePointDialog({
  visible,
  suggestedName,
  onCancel,
  onConfirm,
}: SavePointDialogProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Dialog
      visible={visible}
      closeLabel={t('common.close')}
      title={t('map.saveTitle')}
      onClose={onCancel}
    >
      <Text variant="bodySm" color={colors.textAlpha[68]}>
        {t('map.saveBody')}
      </Text>
      <NameRow suggestedName={suggestedName} onConfirm={onConfirm} />
    </Dialog>
  );
}
