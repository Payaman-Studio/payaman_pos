import RNFS from 'react-native-fs';
import { getDatabase, closeDatabase, getDatabasePath } from './index';
import { resolveProductPhotoPath } from './photoStorage';
import type { NitroSQLiteConnection } from 'react-native-nitro-sqlite';

export interface TransferResult {
  success: boolean;
  message: string;
  filePath?: string;
}

const DB_FILENAME = 'waroeng.db';

async function backupPhotosToCache(dbConn: NitroSQLiteConnection): Promise<void> {
  const photoDir = `${RNFS.CachesDirectoryPath}/waroeng_photos`;
  const dirExists = await RNFS.exists(photoDir);
  if (dirExists) {
    await RNFS.unlink(photoDir);
  }
  await RNFS.mkdir(photoDir);

  const { results } = dbConn.execute(
    "SELECT id, photo FROM products WHERE photo IS NOT NULL AND photo != ''",
  );

  for (const row of results) {
    const r = row as { id: string; photo: string };
    const src = r.photo.replace(/^file:\/\//, '');
    const srcExists = await RNFS.exists(src);
    if (!srcExists) continue;
    const ext = src.split('.').pop()?.split('?')[0] || 'jpg';
    try {
      await RNFS.copyFile(src, `${photoDir}/${r.id}.${ext}`);
    } catch {
      // skip foto yang gagal dicopy
    }
  }
}

async function restorePhotosFromCache(dbConn: NitroSQLiteConnection): Promise<number> {
  const photoDir = `${RNFS.CachesDirectoryPath}/waroeng_photos`;
  const dirExists = await RNFS.exists(photoDir);
  if (!dirExists) return 0;

  const { results } = dbConn.execute(
    "SELECT id, photo FROM products WHERE photo IS NOT NULL AND photo != ''",
  );

  let restored = 0;
  for (const row of results) {
    const r = row as { id: string; photo: string };

    const resolved = await resolveProductPhotoPath(r.id, r.photo);
    if (resolved === r.photo) {
      restored++;
      continue;
    }

    for (const ext of ['jpg', 'jpeg', 'png', 'gif', 'webp']) {
      const cachedPath = `${photoDir}/${r.id}.${ext}`;
      const cachedExists = await RNFS.exists(cachedPath);
      if (!cachedExists) continue;

      const storagePath = `${RNFS.DocumentDirectoryPath}/photos/${r.id}.${ext}`;
      const storageDir = `${RNFS.DocumentDirectoryPath}/photos`;
      const storageDirExists = await RNFS.exists(storageDir);
      if (!storageDirExists) {
        await RNFS.mkdir(storageDir);
      }

      try {
        await RNFS.copyFile(cachedPath, storagePath);
        dbConn.execute('UPDATE products SET photo = ? WHERE id = ?', [storagePath, r.id]);
        restored++;
      } catch {
        // skip foto yang gagal
      }
      break;
    }
  }

  try {
    await RNFS.unlink(photoDir);
  } catch {
    // ignore
  }

  return restored;
}

export async function exportDatabaseToFile(): Promise<TransferResult> {
  const dbPath = getDatabasePath();
  if (!dbPath) {
    return { success: false, message: 'Gagal menemukan lokasi database' };
  }

  const exportPath = `${RNFS.CachesDirectoryPath}/${DB_FILENAME}`;

  try {
    backupPhotosToCache(getDatabase());
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

export async function importDatabaseFromFileWithPhotos(
  sourceUri: string,
): Promise<TransferResult> {
  const dbResult = await importDatabaseFromFile(sourceUri);
  if (!dbResult.success) return dbResult;

  try {
    const db = getDatabase();
    const restored = await restorePhotosFromCache(db);
    const msg =
      restored > 0
        ? `Database berhasil diganti. ${restored} foto dipulihkan.`
        : 'Database berhasil diganti. (tidak ada foto yang perlu dipulihkan)';
    return { ...dbResult, message: msg };
  } catch {
    return {
      ...dbResult,
      message: 'Database berhasil diganti, tetapi beberapa foto mungkin tidak muncul',
    };
  }
}

export function getExportFilePath(): string {
  return `${RNFS.CachesDirectoryPath}/${DB_FILENAME}`;
}
