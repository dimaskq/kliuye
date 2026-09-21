import { View } from 'react-native';

import { SectionHeader, space } from '@/ui';

/** Label above a control, so every field in the form reads the same way. */
export function FormField({
  label,
  aside,
  children,
}: {
  label: string;
  aside?: string | undefined;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={{ gap: space.xs }}>
      <SectionHeader title={label} {...(aside === undefined ? {} : { aside })} />
      {children}
    </View>
  );
}
