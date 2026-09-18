import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export function backupFilename(): string {
  return `mcdonaldz-backup-${new Date().toISOString().split('T')[0]}.json`;
}

/**
 * Saves a backup file. In the Android/iOS app a blob download does nothing inside the WebView,
 * so the file is written to the cache and handed to the system share sheet; on the web it is a plain download.
 * Resolves to false when the user dismisses the share sheet.
 */
export async function saveBackup(json: string, filename = backupFilename()): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }

  const { uri } = await Filesystem.writeFile({
    path: filename,
    data: json,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  try {
    await Share.share({ title: 'Backup McDonaldz', dialogTitle: 'Salva il backup', url: uri });
    return true;
  } catch (error) {
    // The plugin rejects when the share sheet is cancelled
    if (String((error as Error)?.message ?? error).toLowerCase().includes('cancel')) return false;
    throw error;
  }
}

/** Throws a readable error unless the text looks like a backup produced by exportData(). */
export function readBackupSummary(text: string): { visits: number } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Il file non è un JSON valido');
  }
  const visits = (data as { visits?: unknown })?.visits;
  if (!Array.isArray(visits)) throw new Error('Il file non sembra un backup di McDonaldz');
  return { visits: visits.length };
}
