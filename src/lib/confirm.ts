import { Alert } from 'react-native';

/** Yes / no dialog. Resolves true when the user confirms. */
export function confirm(message: string, confirmLabel: string, cancelLabel: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(message, undefined, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
