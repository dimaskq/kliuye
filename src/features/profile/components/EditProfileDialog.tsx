import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { initialsOf } from '@/store';
import { Button, Dialog, Text, TextField, colors, space } from '@/ui';

import type { ProfileEditor } from '../useProfileEditor';

import { Avatar } from './Avatar';

const PHOTO_SIZE = 112;
const NAME_MAX_LENGTH = 40;

function PhotoPicker({ editor }: { editor: ProfileEditor }): React.JSX.Element {
  const { t } = useTranslation();
  const hasPhoto = editor.draft.photo !== '';
  return (
    <View style={{ alignItems: 'center', gap: space.xl }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(hasPhoto ? 'profile.photoChange' : 'profile.photoPick')}
        accessibilityState={{ busy: editor.draft.busy }}
        disabled={editor.draft.busy}
        onPress={editor.draft.choose}
        style={({ pressed }) => ({ opacity: pressed || editor.draft.busy ? 0.6 : 1 })}
      >
        <Avatar
          uri={editor.draft.photo}
          initials={initialsOf(editor.name, t('profile.defaultInitials'))}
          size={PHOTO_SIZE}
          editable
        />
      </Pressable>
      {hasPhoto ? (
        <Button
          tone="onDark"
          label={t('profile.photoRemove')}
          onPress={editor.draft.remove}
          style={{ alignSelf: 'center' }}
        />
      ) : null}
      {editor.draft.failed ? (
        <Text variant="caption" color={colors.accent700}>
          {t('profile.photoFailed')}
        </Text>
      ) : null}
    </View>
  );
}

/** Photo and name, both kept on the phone only. */
export function EditProfileDialog({ editor }: { editor: ProfileEditor }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <Dialog
      visible={editor.open}
      title={t('profile.editTitle')}
      closeLabel={t('common.cancel')}
      onClose={editor.cancel}
    >
      <PhotoPicker editor={editor} />
      <TextField
        icon="user"
        value={editor.name}
        placeholder={t('profile.namePlaceholder')}
        accessibilityLabel={t('profile.nameLabel')}
        onChange={editor.setName}
        maxLength={NAME_MAX_LENGTH}
        onSubmit={editor.save}
      />
      <Button
        icon="check"
        label={t('profile.save')}
        onPress={editor.save}
        style={{ alignSelf: 'stretch' }}
      />
    </Dialog>
  );
}
