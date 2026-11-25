import { type Href, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { ListRow } from '@/components/ui/list-row';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import { type QuickAddKey, quickAddActions } from '@/features/navigation/menu';
import { useAuth } from '@/store/auth';
import { radius, space, touch } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

/** Where each Quick add action goes; null = arrives in a later milestone. */
const ROUTES: Record<QuickAddKey, Href | null> = {
  eggEntry: '/eggs/new',
  mortality: { pathname: '/pick', params: { for: 'mortality' } },
  feedUsed: { pathname: '/pick', params: { for: 'feedUsed' } },
  vaccination: { pathname: '/pick', params: { for: 'vaccination' } },
  medicine: { pathname: '/pick', params: { for: 'medicine' } },
  weight: { pathname: '/pick', params: { for: 'weight' } },
  feedPurchase: '/feed/new',
  newBatch: '/batches/new',
  sale: '/money/sale',
  expense: '/money/expense',
};

export default function QuickAddSheet() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const user = useAuth((s) => s.user);
  const actions = quickAddActions(user);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header" style={styles.title}>
          {t('quickAdd.title')}
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          hitSlop={8}
          style={[styles.close, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="close" color={colors.text} />
        </Pressable>
      </View>
      <Text variant="caption" tone="muted">
        {t('quickAdd.subtitle')}
      </Text>
      {actions.length === 0 ? (
        <EmptyState icon="lock-outline" title={t('quickAdd.nothing')} />
      ) : (
        <Section>
          {actions.map((action) => {
            const href = ROUTES[action.key];
            return (
              <ListRow
                key={action.key}
                title={t(`quickAdd.${action.key}`)}
                icon={action.icon}
                badge={href ? undefined : t('common.soon')}
                onPress={href ? () => router.replace(href) : undefined}
                testID={`quick-${action.key}`}
              />
            );
          })}
        </Section>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl, width: '100%', maxWidth: 720, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  title: { flex: 1 },
  close: {
    width: touch.compact,
    height: touch.compact,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
