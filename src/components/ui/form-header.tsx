import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { radius, space, touch } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Icon } from './icon';
import { Text } from './text';

type FormHeaderProps = {
  title: string;
  subtitle?: string;
  /** "back" for detail screens, "close" for entry forms. */
  kind?: 'back' | 'close';
  right?: ReactNode;
};

/** Header for pushed screens: a back or close button, then the title. */
export function FormHeader({ title, subtitle, kind = 'back', right }: FormHeaderProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={leave}
        accessibilityRole="button"
        accessibilityLabel={kind === 'back' ? t('common.back') : t('common.close')}
        hitSlop={8}
        style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Icon name={kind === 'back' ? 'arrow-left' : 'close'} color={colors.text} />
      </Pressable>
      <View style={styles.text}>
        <Text variant="title" accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  button: {
    width: touch.compact,
    height: touch.compact,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
});
