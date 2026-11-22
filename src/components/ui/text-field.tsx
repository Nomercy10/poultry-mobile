import { useState, type Ref } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

import { radius, space, touch } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Icon } from './icon';
import { Text } from './text';

type TextFieldProps = Omit<TextInputProps, 'style' | 'ref'> & {
  ref?: Ref<TextInputInstance>;
  label: string;
  error?: string;
  hint?: string;
  /** Adds a show / hide toggle for passwords. */
  secret?: boolean;
  showLabel?: string;
  hideLabel?: string;
};

export function TextField({
  ref,
  label,
  error,
  hint,
  secret = false,
  showLabel = 'Show',
  hideLabel = 'Hide',
  ...inputProps
}: TextFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secret);

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={styles.wrapper}>
      <Text variant="label">{label}</Text>
      <View style={[styles.box, { borderColor, backgroundColor: colors.card }]}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={hidden}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          {...inputProps}
          style={[styles.input, { color: colors.text }]}
        />
        {secret && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? showLabel : hideLabel}
            hitSlop={8}
            style={styles.toggle}>
            <Icon name={hidden ? 'eye-outline' : 'eye-off-outline'} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: space.xs },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touch.min,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: space.md },
  toggle: { padding: space.xs },
});
