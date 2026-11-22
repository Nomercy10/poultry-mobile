import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useSelectedFarm } from '@/store/farm';
import { radius, space, touch } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { useFarms } from './api';

/** Header chip that picks the farm every screen filters by (like the web's farm filter). */
export function FarmSwitcher() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: farms = [] } = useFarms();
  const farmId = useSelectedFarm((s) => s.farmId);
  const setFarmId = useSelectedFarm((s) => s.setFarmId);
  const [open, setOpen] = useState(false);

  const selected = farms.find((f) => f.id === farmId);
  const single = farms.length === 1;
  const label = selected?.name ?? (single ? farms[0].name : t('common.allFarms'));

  if (farms.length === 0) return null;

  const choose = (id: string | null) => {
    setFarmId(id);
    setOpen(false);
  };

  const options: { id: string | null; name: string; location?: string | null }[] = [
    { id: null, name: t('common.allFarms') },
    ...farms.map((f) => ({ id: f.id, name: f.name, location: f.location })),
  ];

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={single}
        accessibilityRole="button"
        accessibilityLabel={`${t('farm.choose')}: ${label}`}
        style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Icon name="barn" size={18} color={colors.primary} />
        <Text variant="label" numberOfLines={1} style={styles.chipLabel}>
          {label}
        </Text>
        {!single && <Icon name="chevron-down" size={18} color={colors.textMuted} />}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + space.lg }]}
            onPress={() => {}}>
            <Text variant="heading" style={styles.sheetTitle} accessibilityRole="header">
              {t('farm.choose')}
            </Text>
            {options.map((opt) => {
              const active = opt.id === farmId;
              return (
                <Pressable
                  key={opt.id ?? 'all'}
                  onPress={() => choose(opt.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={[styles.option, active && { backgroundColor: colors.primarySoft }]}>
                  <View style={styles.optionText}>
                    <Text variant="body">{opt.name}</Text>
                    {opt.location && (
                      <Text variant="caption" tone="muted">
                        {opt.location}
                      </Text>
                    )}
                  </View>
                  {active && <Icon name="check" color={colors.primary} />}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    minHeight: touch.compact,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    maxWidth: 240,
  },
  chipLabel: { flexShrink: 1 },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space.lg,
    gap: space.xs,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  sheetTitle: { marginBottom: space.sm },
  option: {
    minHeight: touch.min,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.md,
  },
  optionText: { flex: 1 },
});
