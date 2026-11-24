import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Banner } from '@/components/ui/banner';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { authApi } from '@/features/auth/api';
import { PasswordLoginForm } from '@/features/auth/components/password-login-form';
import { PhoneOtpForm } from '@/features/auth/components/phone-otp-form';
import { demoLogins } from '@/features/auth/demo-logins';
import { enabledLoginMethods } from '@/features/auth/login-methods';
import { ListRow } from '@/components/ui/list-row';
import { Section } from '@/components/ui/section';
import { errorMessage } from '@/lib/api/messages';
import type { LoginMethod } from '@/features/auth/types';
import { languageInfo } from '@/i18n/languages';
import { API_URL } from '@/lib/config';
import { useAuth } from '@/store/auth';
import { radius, space, touch } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

const methods = enabledLoginMethods();
const demos = demoLogins();

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const signIn = useAuth((s) => s.signIn);
  const bootError = useAuth((s) => s.bootError);
  const bootstrap = useAuth((s) => s.bootstrap);
  const [method, setMethod] = useState<LoginMethod>(methods[0]);
  const [demoBusy, setDemoBusy] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  async function quickSignIn(email: string, password: string) {
    setDemoBusy(email);
    setDemoError(null);
    try {
      await signIn(await authApi.loginWithPassword(email, password));
    } catch (error) {
      setDemoError(errorMessage(error, t));
      setDemoBusy(null);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen edges={['top', 'bottom']} contentStyle={styles.content}>
        <Pressable
          onPress={() => router.push('/language')}
          accessibilityRole="button"
          accessibilityLabel={t('language.title')}
          style={[styles.langChip, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Icon name="translate" size={20} color={colors.primary} />
          <Text variant="label">{languageInfo(i18n.language).endonym}</Text>
        </Pressable>
        <View style={styles.header}>
          <Image source={require('@/assets/images/icon.png')} style={styles.logo} accessibilityIgnoresInvertColors />
          <Text variant="title" accessibilityRole="header">
            {t('auth.welcome')}
          </Text>
          <Text tone="muted">{t('auth.subtitle')}</Text>
        </View>

        {bootError && (
          <Banner tone="warning" message={bootError} actionLabel={t('common.retry')} onAction={() => void bootstrap()} />
        )}

        {methods.length > 1 && (
          <SegmentedControl
            value={method}
            onChange={setMethod}
            options={methods.map((m) => ({
              value: m,
              label: m === 'password' ? t('auth.methodPassword') : t('auth.methodPhone'),
            }))}
          />
        )}

        {method === 'password' ? (
          <PasswordLoginForm
            onSubmit={async (email, password) => {
              const session = await authApi.loginWithPassword(email, password);
              await signIn(session);
            }}
          />
        ) : (
          <PhoneOtpForm onSession={signIn} />
        )}

        {method === 'password' && (
          <Link href="/forgot-password" style={styles.link}>
            <Text variant="label" tone="primary">
              {t('auth.forgot')}
            </Text>
          </Link>
        )}

        {demos.length > 0 && (
          <Section title={t('auth.demoAccounts')}>
            {demos.map((d) => (
              <ListRow
                key={d.email}
                icon="account-circle-outline"
                title={d.label}
                subtitle={demoBusy === d.email ? t('auth.signingIn') : d.email}
                onPress={demoBusy ? undefined : () => void quickSignIn(d.email, d.password)}
                testID={`demo-${d.email}`}
              />
            ))}
          </Section>
        )}
        {demoError && <Banner message={demoError} />}

        {__DEV__ && (
          <Text variant="caption" tone="muted" style={styles.server} selectable>
            {t('common.serverAt', { url: API_URL })}
          </Text>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', gap: space.xl, paddingVertical: space.xxl },
  header: { gap: space.sm },
  logo: { width: 64, height: 64, borderRadius: radius.lg, marginBottom: space.sm },
  link: { alignSelf: 'center', minHeight: touch.compact, paddingVertical: space.md },
  server: { textAlign: 'center' },
  langChip: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    minHeight: touch.compact,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
