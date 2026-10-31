import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { MAP_LAYERS, usePreferences } from '@/store';
import type { MapLayer } from '@/store';
import {
  Dialog,
  Icon,
  IconButton,
  Text,
  iconSize,
  radius,
  space,
  MIN_TOUCH_SIZE,
  useColors,
} from '@/ui';

import { MAP_LAYER_ICONS } from '../mapLayers';

import { OVERLAY_Z } from './PointActions';

type OptionProps = { layer: MapLayer; selected: boolean; onChoose: () => void };

function Option({ layer, selected, onChoose }: OptionProps): React.JSX.Element {
  const colors = useColors();
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={t(`map.layer.${layer}`)}
      accessibilityHint={t(`map.layer.${layer}Hint`)}
      onPress={onChoose}
      style={({ pressed }) => ({
        minHeight: MIN_TOUCH_SIZE,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.xl,
        padding: space.lg,
        borderRadius: radius.row,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.textAlpha[12],
        backgroundColor: selected ? colors.surface : 'transparent',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Icon
        name={MAP_LAYER_ICONS[layer]}
        size={iconSize.action}
        color={selected ? colors.accent : colors.textAlpha[68]}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="label">{t(`map.layer.${layer}`)}</Text>
        <Text variant="metaSm" color={colors.textAlpha[55]}>
          {t(`map.layer.${layer}Hint`)}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * The layer button over the map, like Google Maps': plain, relief, light or
 * dark. The choice is kept, and the journal's map follows it too.
 */
export function MapLayerPicker(): React.JSX.Element {
  const colors = useColors();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const layer = usePreferences((state) => state.mapLayer);
  const setLayer = usePreferences((state) => state.setMapLayer);

  return (
    <>
      <View style={{ position: 'absolute', top: space.sm, right: space.sm, zIndex: OVERLAY_Z }}>
        <IconButton
          icon="layers"
          label={t('map.layersButton')}
          onPress={() => setOpen(true)}
          size={MIN_TOUCH_SIZE}
          color={colors.text}
          background={colors.bg}
        />
      </View>
      <Dialog
        visible={open}
        title={t('map.layersTitle')}
        closeLabel={t('common.close')}
        onClose={() => setOpen(false)}
      >
        <View accessibilityRole="radiogroup" style={{ gap: space.md }}>
          {MAP_LAYERS.map((option) => (
            <Option
              key={option}
              layer={option}
              selected={option === layer}
              onChoose={() => {
                setLayer(option);
                setOpen(false);
              }}
            />
          ))}
        </View>
        <Text variant="metaSm" color={colors.textAlpha[55]}>
          {t('map.layersOffline')}
        </Text>
      </Dialog>
    </>
  );
}
