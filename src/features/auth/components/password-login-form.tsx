import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, type TextInputInstance } from 'react-native';
import { z } from 'zod';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { errorMessage } from '@/lib/api/messages';
import { space } from '@/theme/tokens';

type Props = {
  /** Throws on failure; the form shows the error. */
  onSubmit: (email: string, password: string) => Promise<void>;
  defaultEmail?: string;
};

export function PasswordLoginForm({ onSubmit, defaultEmail = '' }: Props) {
  const { t } = useTranslation();
  const passwordRef = useRef<TextInputInstance>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = z.object({
    email: z.email(t('auth.emailInvalid')),
    password: z.string().min(1, t('auth.passwordRequired')),
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: defaultEmail, password: '' },
  });

  const submit = handleSubmit(async ({ email, password }) => {
    setSubmitError(null);
    try {
      await onSubmit(email, password);
    } catch (error) {
      setSubmitError(errorMessage(error, t));
    }
  });

  return (
    <View style={styles.form}>
      {submitError && <Banner message={submitError} />}
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label={t('auth.email')}
            placeholder={t('auth.emailPlaceholder')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            testID="login-email"
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            ref={passwordRef}
            label={t('auth.password')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
            secret
            showLabel={t('common.show')}
            hideLabel={t('common.hide')}
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={() => void submit()}
            testID="login-password"
          />
        )}
      />
      <Button label={t('auth.login')} onPress={() => void submit()} loading={isSubmitting} testID="login-submit" />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.lg },
});
