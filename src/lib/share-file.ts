import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';

/**
 * Saves text as a file and opens the share sheet (WhatsApp, email, Drive…).
 * Falls back to sharing the text itself if the phone can't share files.
 */
export async function shareTextFile(name: string, text: string, mimeType: string, title: string): Promise<void> {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  // A byte-order mark so Excel opens the ₹ sign and Hindi/Marathi text correctly.
  await file.write(`﻿${text}`);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: title, UTI: 'public.comma-separated-values-text' });
    return;
  }
  await Share.share({ title, message: text });
}
