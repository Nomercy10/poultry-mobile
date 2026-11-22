// Mobile number + OTP login. Built against the contract in docs/auth-otp.md and
// shown only when features.phoneOtpLogin is on. Ends in the same AuthSession
// as password login, so nothing after login changes.

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { errorMessage } from '@/lib/api/messages';
import { space } from '@/theme/tokens';

import { authApi, type OtpChallenge } from '../api';
import { toE164India } from '../phone';
import type { AuthSession } from '../types';

type Props = {
  onSession: (session: AuthSession) => Promise<void>;
};

export function PhoneOtpForm({ onSession }: Props) {
  const { t } = useTranslation();
  const [phoneInput, setPhoneInput] = useState('');
  const [phone, setPhone] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [code, setCode] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  async function sendCode(target: string) {
    setBusy(true);
    setSubmitError(null);
    try {
      const next = await authApi.requestOtp(target);
      setPhone(target);
      setChallenge(next);
      setResendIn(next.resendAfter);
      setCode('');
    } catch (error) {
      setSubmitError(errorMessage(error, t));
    } finally {
      setBusy(false);
    }
  }

  function onSendPressed() {
    const normalised = toE164India(phoneInput);
    if (!normalised) {
      setFieldError(t('auth.phoneInvalid'));
      return;
    }
    setFieldError(undefined);
    void sendCode(normalised);
  }

  async function onVerifyPressed() {
    if (!challenge || !phone) return;
    if (!/^\d{6}$/.test(code)) {
      setFieldError(t('auth.otpInvalid'));
      return;
    }
    setFieldError(undefined);
    setBusy(true);
    setSubmitError(null);
    try {
      const session = await authApi.verifyOtp(challenge.challengeId, phone, code);
      await onSession(session);
    } catch (error) {
      setSubmitError(errorMessage(error, t));
      setBusy(false);
    }
  }

  if (!challenge || !phone) {
    return (
      <View style={styles.form}>
        {submitError && <Banner message={submitError} />}
        <TextField
          label={t('auth.phone')}
          placeholder={t('auth.phonePlaceholder')}
          value={phoneInput}
          onChangeText={setPhoneInput}
          error={fieldError}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          returnKeyType="send"
          onSubmitEditing={onSendPressed}
        />
        <Button label={t('auth.sendOtp')} onPress={onSendPressed} loading={busy} />
      </View>
    );
  }

  return (
    <View style={styles.form}>
      {submitError && <Banner message={submitError} />}
      <Text tone="muted">{t('auth.otpSentTo', { phone })}</Text>
      <TextField
        label={t('auth.otp')}
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
        error={fieldError}
        keyboardType="number-pad"
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        maxLength={6}
        returnKeyType="go"
        onSubmitEditing={onVerifyPressed}
        autoFocus
      />
      <Button label={t('auth.verify')} onPress={onVerifyPressed} loading={busy} />
      <View style={styles.row}>
        <Button
          variant="ghost"
          compact
          label={t('auth.changeNumber')}
          onPress={() => {
            setChallenge(null);
            setSubmitError(null);
          }}
        />
        <Button
          variant="ghost"
          compact
          disabled={resendIn > 0 || busy}
          label={resendIn > 0 ? t('auth.resendIn', { seconds: resendIn }) : t('auth.resend')}
          onPress={() => void sendCode(phone)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});
