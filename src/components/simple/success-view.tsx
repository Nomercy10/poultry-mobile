import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { usePendingSave } from '@/features/simple/pending-save';
import { successFeedback } from '@/lib/haptics';
import { speak } from '@/lib/voice';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

/**
 * Shown right after Save. The write is held for a few seconds with a big Undo,
 * then sent; when the window ends the screen goes back to Home by itself.
 */
export function SuccessView({ summary }: { summary: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const pending = usePendingSave((s) => s.pending);
  const undo = usePendingSave((s) => s.undo);
  const [undone, setUndone] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const secondsLeft = pending ? Math.max(0, Math.ceil((pending.deadline - now) / 1000)) : 0;

  useEffect(() => {
    successFeedback();
    speak(summary);
  }, [summary]);

  useEffect(() => {
    if (!pending) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [pending]);

  // Window over (the save was sent): back to Home.
  useEffect(() => {
    if (!pending && !undone) {
      const id = setTimeout(() => router.replace('/simple'), 1200);
      return () => clearTimeout(id);
    }
  }, [pending, undone]);

  const ok = !undone;
  const title = t('simple.saved');
  // The spoken summary starts with "Saved."; don't show that twice.
  const detail = summary.startsWith(title) ? summary.slice(title.length).replace(/^[\s.।]+/, '') : summary;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.fill, { backgroundColor: colors.background }]}>
      <View style={styles.center}>
        <View style={[styles.badge, { backgroundColor: ok ? colors.success : colors.textMuted }]}>
          <Icon name={ok ? 'check-bold' : 'undo-variant'} size={88} color="#FFFFFF" />
        </View>
        <Text variant="display" style={styles.text} accessibilityRole="header" accessibilityLiveRegion="polite">
          {ok ? title : t('simple.undone')}
        </Text>
        {ok && !!detail && (
          <Text variant="title" numeric style={styles.text}>
            {detail}
          </Text>
        )}
      </View>
      <View style={styles.bar}>
        {ok && pending && (
          <Pressable
            onPress={() => {
              undo();
              setUndone(true);
              speak(t('simple.undone'));
            }}
            accessibilityRole="button"
            accessibilityLabel={t('common.undo')}
            style={[styles.undo, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Icon name="undo-variant" size={30} color={colors.text} />
            <Text variant="heading" numeric>
              {t('simple.undoIn', { seconds: secondsLeft })}
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => router.replace('/simple')}
          accessibilityRole="button"
          accessibilityLabel={t('common.home')}
          style={[styles.home, { backgroundColor: colors.primary }]}>
          <Icon name="home" size={30} color={colors.onPrimary} />
          <Text variant="heading" tone="onPrimary">
            {t('common.home')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg, padding: space.xl },
  badge: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center' },
  text: { textAlign: 'center' },
  bar: { gap: space.md, padding: space.lg },
  undo: { height: 72, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: space.sm, alignItems: 'center', justifyContent: 'center' },
  home: { height: 72, borderRadius: radius.md, flexDirection: 'row', gap: space.sm, alignItems: 'center', justifyContent: 'center' },
});
