import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Card } from './card';
import { Text } from './text';

/** A titled card that stacks rows with dividers between them. */
export function Section({ title, children }: { title?: string; children: ReactNode }) {
  const { colors } = useTheme();
  const rows = Children.toArray(children).filter(Boolean);
  if (rows.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      {title && (
        <Text variant="label" tone="muted" style={styles.title} accessibilityRole="header">
          {title.toUpperCase()}
        </Text>
      )}
      <Card padded={false}>
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            {row}
          </Fragment>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: space.sm },
  title: { paddingHorizontal: space.xs, letterSpacing: 0.5 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: space.lg },
});
