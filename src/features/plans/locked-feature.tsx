import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { radius, space, touch } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { cheapestPlanWith, type FeatureKey } from './catalog';

/** A tappable "Available on Pro" placeholder where a paid feature would be. */
export function LockedFeature({ feature }: { feature: FeatureKey }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const planName = t(`plans.${cheapestPlanWith(feature)}`);

  return (
    <Pressable
      onPress={() => router.push('/plans')}
      accessibilityRole="button"
      accessibilityLabel={`${t(`plans.feature_${feature}`)}. ${t('plans.availableOn', { plan: planName })}`}
      style={({ pressed }) => [
        styles.box,
        { borderColor: colors.border, backgroundColor: pressed ? colors.background : colors.card },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
        <Icon name="lock-outline" size={20} color={colors.primary} />
      </View>
      <View style={styles.text}>
        <Text variant="label">{t(`plans.feature_${feature}`)}</Text>
        <Text variant="caption" tone="muted">
          {t('plans.availableOn', { plan: planName })}
        </Text>
      </View>
      <Icon name="chevron-right" color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: touch.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  iconWrap: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
});
