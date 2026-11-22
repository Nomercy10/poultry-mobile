import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/icon';
import { visibleTabs } from '@/features/navigation/menu';
import { useAuth } from '@/store/auth';
import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

const TAB_BAR_HEIGHT = 64;

function tabIcon(name: IconName) {
  function TabIcon({ color }: { color: ColorValue }) {
    return <Icon name={name} color={typeof color === 'string' ? color : '#7A726C'} size={26} />;
  }
  return TabIcon;
}

/** The big centre ＋. Opens the Quick add sheet instead of switching tabs. */
function QuickAddButton({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.fabSlot}>
      <Pressable
        onPress={() => router.push('/quick-add')}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.primary, borderColor: colors.card, opacity: pressed ? 0.85 : 1 },
        ]}>
        <Icon name="plus" size={32} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuth((s) => s.user);
  const tabs = visibleTabs(user);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
        },
        tabBarLabelStyle: styles.tabLabel,
      }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: tabIcon('home-variant-outline') }} />
      <Tabs.Screen
        name="flock"
        options={{ title: t('tabs.flock'), tabBarIcon: tabIcon('bird'), href: tabs.flock ? undefined : null }}
      />
      <Tabs.Screen
        name="add"
        options={
          tabs.add
            ? { title: t('tabs.add'), tabBarButton: () => <QuickAddButton label={t('quickAdd.title')} /> }
            : { href: null }
        }
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/quick-add');
          },
        }}
      />
      <Tabs.Screen
        name="stock"
        options={{ title: t('tabs.stock'), tabBarIcon: tabIcon('warehouse'), href: tabs.stock ? undefined : null }}
      />
      <Tabs.Screen name="more" options={{ title: t('tabs.more'), tabBarIcon: tabIcon('dots-horizontal-circle-outline') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: { fontSize: 12, fontWeight: '600' },
  fabSlot: { flex: 1, alignItems: 'center' },
  fab: {
    width: 60,
    height: 60,
    borderRadius: radius.fab + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    borderWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});
