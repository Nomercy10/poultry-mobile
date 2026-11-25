import { Linking, Platform, Share } from 'react-native';

/** Indian mobile number as WhatsApp wants it (91XXXXXXXXXX), or null. */
export function whatsappNumber(phone: string | null | undefined): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return null;
}

/**
 * Manual reminder: opens WhatsApp with the message typed in (the user presses send),
 * or the share sheet when there's no usable number. Automatic reminders are a Pro feature.
 */
export async function sendReminder(phone: string | null | undefined, message: string): Promise<void> {
  const number = whatsappNumber(phone);
  if (number) {
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    await Linking.openURL(url);
    return;
  }
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !('share' in navigator)) {
    await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
    return;
  }
  await Share.share({ message });
}
