import { router } from 'expo-router';
import { type ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { tapFeedback } from '@/lib/haptics';
import { speak, stopSpeaking } from '@/lib/voice';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

const BAR_HEIGHT = 72;

type StepScaffoldProps = {
  icon: IconName;
  iconTint?: 'primary' | 'danger' | 'success';
  /** The question, shown and spoken. */
  prompt: string;
  /** Spoken instead of the prompt when given (e.g. with numbers read back). */
  spoken?: string;
  children?: ReactNode;
  onBack: () => void;
  primary?: { label: string; icon: IconName; onPress: () => void; disabled?: boolean; loading?: boolean };
  testID?: string;
};

/**
 * The same layout on every Simple mode step: back and 🔊 on top, a big picture,
 * the question, the input, then Home bottom-left and the main action bottom-right.
 */
export function StepScaffold({ icon, iconTint = 'primary', prompt, spoken, children, onBack, primary, testID }: StepScaffoldProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const say = spoken ?? prompt;
  const fg = { primary: colors.primary, danger: colors.danger, success: colors.success }[iconTint];
  const bg = { primary: colors.primarySoft, danger: colors.dangerSoft, success: colors.successSoft }[iconTint];

  // Speak each new question once, a moment after it appears.
  useEffect(() => {
    const id = setTimeout(() => speak(say), 300);
    return () => {
      clearTimeout(id);
      stopSpeaking();
    };
  }, [say]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.fill, { backgroundColor: colors.background }]} testID={testID}>
      <View style={styles.top}>
        <RoundButton icon="arrow-left" label={t('common.back')} onPress={onBack} />
        <RoundButton icon="volume-high" label={t('common.listen')} onPress={() => speak(say, { force: true })} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.picture, { backgroundColor: bg }]}>
          <Icon name={icon} size={64} color={fg} />
        </View>
        <Text variant="title" style={styles.prompt} accessibilityRole="header">
          {prompt}
        </Text>
        {children}
      </ScrollView>
      <View style={[styles.bar, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
        <Pressable
          onPress={() => router.replace('/simple')}
          accessibilityRole="button"
          accessibilityLabel={t('common.home')}
          style={[styles.home, { borderColor: colors.border }]}>
          <Icon name="home-outline" size={30} color={colors.text} />
        </Pressable>
        {primary && (
          <Pressable
            onPress={() => {
              tapFeedback();
              primary.onPress();
            }}
            disabled={primary.disabled || primary.loading}
            accessibilityRole="button"
            accessibilityLabel={primary.label}
            accessibilityState={{ disabled: !!primary.disabled, busy: !!primary.loading }}
            style={({ pressed }) => [
              styles.primary,
              { backgroundColor: colors.primary, opacity: primary.disabled ? 0.45 : pressed ? 0.85 : 1 },
            ]}>
            <Icon name={primary.loading ? 'progress-clock' : primary.icon} size={30} color={colors.onPrimary} />
            <Text variant="heading" tone="onPrimary">
              {primary.label}
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function RoundButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={[styles.round, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Icon name={icon} size={28} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingTop: space.sm },
  round: { width: 56, height: 56, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: space.lg, gap: space.lg, alignItems: 'stretch', width: '100%', maxWidth: 560, alignSelf: 'center' },
  picture: { alignSelf: 'center', width: 112, height: 112, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  prompt: { textAlign: 'center' },
  bar: { flexDirection: 'row', gap: space.md, padding: space.md, borderTopWidth: StyleSheet.hairlineWidth },
  home: { width: BAR_HEIGHT, height: BAR_HEIGHT, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  primary: {
    flex: 1,
    height: BAR_HEIGHT,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
});
