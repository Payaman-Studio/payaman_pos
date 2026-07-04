import RNFS from 'react-native-fs';
import { getDatabase, closeDatabase, getDatabasePath } from './index';

export interface TransferResult {
  success: boolean;
  message: string;
  filePath?: string;
}

const DB_FILENAME = 'waroeng.db';

export async function exportDatabaseToFile(): Promise<TransferResult> {
  const dbPath = getDatabasePath();
  if (!dbPath) {
    return { success: false, message: 'Gagal menemukan lokasi database' };
  }

  const exportPath = `${RNFS.CachesDirectoryPath}/${DB_FILENAME}`;

  try {
    closeDatabase();
    await RNFS.copyFile(dbPath, exportPath);
    return { success: true, message: 'Database siap dibagikan', filePath: exportPath };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Gagal mengekspor database';
    return { success: false, message };
  } finally {
    getDatabase();
  }
}

export async function importDatabaseFromFile(sourceUri: string): Promise<TransferResult> {
  const dbPath = getDatabasePath();
  if (!dbPath) {
    return { success: false, message: 'Gagal menemukan lokasi database' };
  }

  const tempPath = `${RNFS.CachesDirectoryPath}/waroeng_import_temp.db`;
  const backupPath = `${RNFS.CachesDirectoryPath}/waroeng_backup.db.bak`;

  try {
    await RNFS.copyFile(sourceUri, tempPath);
  } catch {
    return { success: false, message: 'Gagal membaca file yang dipilih' };
  }

  closeDatabase();

  try {
    await RNFS.copyFile(dbPath, backupPath);
  } catch {
    getDatabase();
    return { success: false, message: 'Gagal membuat cadangan database sebelumnya' };
  }

  try {
    await RNFS.copyFile(tempPath, dbPath);
    return { success: true, message: 'Database berhasil diganti' };
  } catch (e) {
    try {
      await RNFS.copyFile(backupPath, dbPath);
    } catch {
      getDatabase();
      return {
        success: false,
        message: 'Gagal mengimpor dan gagal memulihkan cadangan — database mungkin korup',
      };
    }
    const message = e instanceof Error ? e.message : 'Gagal mengimpor database';
    return { success: false, message: `Impor gagal, database dikembalikan: ${message}` };
  } finally {
    getDatabase();
  }
}

export function getExportFilePath(): string {
  return `${RNFS.CachesDirectoryPath}/${DB_FILENAME}`;
}
