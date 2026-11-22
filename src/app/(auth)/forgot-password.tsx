import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { authApi } from '@/features/auth/api';
import { errorMessage } from '@/lib/api/messages';
import { space } from '@/theme/tokens';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!z.email().safeParse(email.trim()).success) {
      setFieldError(t('auth.emailInvalid'));
      return;
    }
    setFieldError(undefined);
    setSubmitError(null);
    setBusy(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (error) {
      setSubmitError(errorMessage(error, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']}>
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header">
          {t('auth.forgotTitle')}
        </Text>
        <Text tone="muted">{t('auth.forgotSubtitle')}</Text>
      </View>

      {sent ? (
        <>
          <Banner tone="info" message={t('auth.linkSent')} />
          <Button label={t('auth.backToLogin')} onPress={() => router.back()} />
        </>
      ) : (
        <>
          {submitError && <Banner message={submitError} />}
          <TextField
            label={t('auth.email')}
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            error={fieldError}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="send"
            onSubmitEditing={submit}
          />
          <Button label={t('auth.sendLink')} onPress={submit} loading={busy} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.sm },
});
