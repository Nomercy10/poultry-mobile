import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';

import { useSelectedFarm } from '@/store/farm';
import { radius, space, touch } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { useWorkingFarm } from './use-working-farm';

/** Header chip that picks the farm every screen filters by (like the web's farm filter). */
export function FarmSwitcher() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { farms, lockedFarms, filterFarmId } = useWorkingFarm();
  const farmId = useSelectedFarm((s) => s.farmId);
  const setFarmId = useSelectedFarm((s) => s.setFarmId);
  const [open, setOpen] = useState(false);

  const selected = farms.find((f) => f.id === (farmId ?? filterFarmId));
  const single = farms.length === 1 && lockedFarms.length === 0;
  const label = selected?.name ?? (farms.length === 1 ? farms[0].name : t('common.allFarms'));

  if (farms.length === 0) return null;

  const choose = (id: string | null) => {
    setFarmId(id);
    setOpen(false);
  };

  const options: { id: string | null; name: string; location?: string | null }[] = [
    // "All farms" only when the plan covers every farm.
    ...(lockedFarms.length === 0 ? [{ id: null, name: t('common.allFarms') }] : []),
    ...farms.map((f) => ({ id: f.id, name: f.name, location: f.location })),
  ];
  const activeId = farmId ?? filterFarmId;

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
              const active = opt.id === activeId;
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
            {lockedFarms.map((f) => (
              <Pressable
                key={f.id}
                onPress={() => {
                  setOpen(false);
                  router.push('/plans');
                }}
                accessibilityRole="button"
                accessibilityLabel={`${f.name}. ${t('plans.lockedFarm')}`}
                style={styles.option}>
                <View style={styles.optionText}>
                  <Text variant="body" tone="muted">
                    {f.name}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {t('plans.lockedFarm')}
                  </Text>
                </View>
                <Icon name="lock-outline" color={colors.textMuted} />
              </Pressable>
            ))}
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
