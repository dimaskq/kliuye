import { useState } from 'react';
import { View } from 'react-native';

import { useLanguageLabels } from '@/hooks';
import {
  Button,
  Card,
  Icon,
  LanguagePicker,
  NavRow,
  Pill,
  ProgressTrack,
  ScoreBadge,
  ScoreRing,
  Screen,
  SectionHeader,
  SettingsList,
  Skeleton,
  StaleBadge,
  StatusCard,
  TabBar,
  Tag,
  Text,
  Toggle,
  colors,
  space,
  textVariants,
} from '@/ui';
import type { TagTone, TextVariant } from '@/ui';

const SCORES = [90, 70, 50, 30, 10];
const TONES: readonly TagTone[] = ['accent', 'accent2', 'neutral', 'outline'];
const VARIANTS = Object.keys(textVariants) as TextVariant[];

function Row({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <View style={{ gap: space.md }}>
      <SectionHeader title={title} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.md }}>
        {children}
      </View>
    </View>
  );
}

function TypeSection(): React.JSX.Element {
  return (
    <Row title="type">
      <View style={{ gap: space.xs }}>
        {VARIANTS.map((variant) => (
          <Text key={variant} variant={variant}>
            {variant}
          </Text>
        ))}
      </View>
    </Row>
  );
}

function RampSection(): React.JSX.Element {
  return (
    <>
      <Row title="score ramp">
        {SCORES.map((value) => (
          <ScoreBadge key={value} value={value} selected={false} />
        ))}
      </Row>
      <Row title="ring">
        <ScoreRing value={78}>
          <Text variant="display">78</Text>
        </ScoreRing>
      </Row>
      <Row title="track">
        <View style={{ width: '100%', gap: space.md }}>
          {SCORES.map((value) => (
            <ProgressTrack key={value} value={value} />
          ))}
        </View>
      </Row>
      <Row title="tags">
        {TONES.map((tone) => (
          <Tag key={tone} tone={tone} label={tone} />
        ))}
      </Row>
    </>
  );
}

function ControlSection({
  on,
  setOn,
}: {
  on: boolean;
  setOn: (value: boolean) => void;
}): React.JSX.Element {
  return (
    <>
      <Row title="controls">
        <Pill
          label="pill"
          detail="86"
          selected
          onPress={() => undefined}
          accessibilityLabel="pill"
        />
        <Pill
          label="pill"
          detail="41"
          selected={false}
          onPress={() => undefined}
          accessibilityLabel="pill off"
        />
        <Button label="primary" onPress={() => undefined} />
        <Button label="on dark" tone="onDark" onPress={() => undefined} />
        <Icon name="lightbulb" color={colors.accent} />
      </Row>
      <Row title="rows">
        <View style={{ width: '100%' }}>
          <Card>
            <Toggle label="toggle" hint="hint" value={on} onChange={setOn} />
            <NavRow label="nav" hint="hint" onPress={() => undefined} />
          </Card>
        </View>
      </Row>
      <SettingsSection on={on} setOn={setOn} />
    </>
  );
}

function SettingsSection({
  on,
  setOn,
}: {
  on: boolean;
  setOn: (value: boolean) => void;
}): React.JSX.Element {
  const labels = useLanguageLabels();
  return (
    <>
      <Row title="settings">
        <View style={{ width: '100%' }}>
          <SettingsList
            rows={[{ id: 'demo', label: 'demo', hint: 'hint', value: on }]}
            onChange={(_id, value) => setOn(value)}
          />
        </View>
      </Row>
      <Row title="language">
        <View style={{ width: '100%' }}>
          <LanguagePicker selected="uk" labels={labels} onSelect={() => undefined} />
        </View>
      </Row>
    </>
  );
}

function StateSection(): React.JSX.Element {
  return (
    <>
      <Row title="states">
        <View style={{ width: '100%', gap: space.md }}>
          <StaleBadge label="stale" />
          <Skeleton height={48} radiusToken="row" />
          <StatusCard title="status" body="body" actionLabel="action" onAction={() => undefined} />
        </View>
      </Row>
      <Row title="tabs">
        <View style={{ width: '100%' }}>
          <TabBar
            items={[
              { key: 'a', label: 'a', icon: 'lightbulb', selected: true, onPress: () => undefined },
              { key: 'b', label: 'b', icon: 'calendar', selected: false, onPress: () => undefined },
            ]}
          />
        </View>
      </Row>
    </>
  );
}

/**
 * A development-only gallery of every design-system component, so a token
 * change can be eyeballed in one place. Never reachable in a release build.
 */
export function CatalogScreen(): React.JSX.Element {
  const [on, setOn] = useState(true);

  return (
    <Screen>
      <TypeSection />
      <RampSection />
      <ControlSection on={on} setOn={setOn} />
      <StateSection />
    </Screen>
  );
}
