import { View } from 'react-native';

import { radius, space } from '../tokens';

import { Card } from './Card';
import { Toggle } from './Toggle';

export type SettingsRow = {
  id: string;
  label: string;
  hint: string;
  value: boolean;
};

export type SettingsListProps = {
  rows: readonly SettingsRow[];
  onChange: (id: string, value: boolean) => void;
};

/** A card of switch rows. Rows are data, so adding one never touches a screen. */
export function SettingsList({ rows, onChange }: SettingsListProps): React.JSX.Element {
  return (
    <Card radiusToken="tipCard" style={{ paddingVertical: space.sm, paddingHorizontal: space.xs }}>
      <View style={{ borderRadius: radius.tipCard }}>
        {rows.map((row) => (
          <Toggle
            key={row.id}
            label={row.label}
            hint={row.hint}
            value={row.value}
            onChange={(next) => onChange(row.id, next)}
          />
        ))}
      </View>
    </Card>
  );
}
