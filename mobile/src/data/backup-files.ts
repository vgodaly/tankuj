import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { BackupError, MAX_BACKUP_BYTES, parseBackup } from '../domain/backup';
import type { Backup } from '../domain/backup';

export async function shareBackup(text: string): Promise<void> {
  await shareFile(text, 'json');
}

export async function shareCsv(text: string): Promise<void> {
  await shareFile(text, 'csv');
}

async function shareFile(text: string, kind: 'json' | 'csv'): Promise<void> {
  if (Platform.OS === 'web' || !(await Sharing.isAvailableAsync()))
    throw new Error('Zdieľanie súboru je dostupné v mobilnej aplikácii.');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = new File(Paths.cache, `tankuj-${kind === 'json' ? 'backup' : 'history'}-${stamp}.${kind}`);
  file.create();
  await file.write(text);
  // The API does not distinguish saving from dismissing the share sheet.
  await Sharing.shareAsync(file.uri, {
    mimeType: kind === 'json' ? 'application/json' : 'text/csv',
    UTI: kind === 'json' ? 'public.json' : 'public.comma-separated-values-text',
    dialogTitle: kind === 'json' ? 'Uložiť zálohu Tankuj' : 'Exportovať históriu Tankuj',
  });
  // Keep the cache file available to receiving apps that may read it after the sheet
  // closes. The OS can reclaim it; only the user's chosen destination is a backup.
}

export async function pickBackup(): Promise<Backup | null> {
  if (Platform.OS === 'web') throw new Error('Obnova zálohy je dostupná v mobilnej aplikácii.');
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*', multiple: false, copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const file = new File(asset.uri);
  try {
    if (Math.max(asset.size ?? 0, file.size) > MAX_BACKUP_BYTES)
      throw new BackupError('Záloha je príliš veľká. Limit je 10 MB.');
    return parseBackup(await file.text());
  } finally {
    // Delete only the copy requested in the application's cache, never a source document.
    try {
      const cachePrefix = Paths.cache.uri.replace(/\/$/, '') + '/';
      if (file.uri.startsWith(cachePrefix) && file.exists) file.delete();
    } catch { /* A cleanup failure must not change validation or local history. */ }
  }
}
