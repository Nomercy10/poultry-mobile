/** On the web, download the file instead (the file system module has no web support). */
export async function shareTextFile(name: string, text: string, mimeType: string): Promise<void> {
  // A byte-order mark so Excel opens the ₹ sign and Hindi/Marathi text correctly.
  const blob = new Blob(['﻿', text], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
