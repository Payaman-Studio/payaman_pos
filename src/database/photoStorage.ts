import RNFS from 'react-native-fs';

const PHOTO_DIR = `${RNFS.DocumentDirectoryPath}/photos`;

export async function ensurePhotoDir(): Promise<void> {
  const exists = await RNFS.exists(PHOTO_DIR);
  if (!exists) {
    await RNFS.mkdir(PHOTO_DIR);
  }
}

export async function savePhotoToStorage(
  sourceUri: string,
  productId: string,
): Promise<string> {
  await ensurePhotoDir();

  const ext = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
  const destPath = `${PHOTO_DIR}/${productId}.${ext}`;

  const destExists = await RNFS.exists(destPath);
  if (destExists) {
    await RNFS.unlink(destPath);
  }

  const sourcePath = sourceUri.replace(/^file:\/\//, '');
  await RNFS.copyFile(sourcePath, destPath);
  return destPath;
}

export async function deletePhotoFromStorage(photoPath: string): Promise<void> {
  try {
    const exists = await RNFS.exists(photoPath);
    if (exists) {
      await RNFS.unlink(photoPath);
    }
  } catch {
    // file mungkin sudah tidak ada — skip
  }
}

export async function resolveProductPhotoPath(
  productId: string,
  storedPath: string | null,
): Promise<string | null> {
  if (!storedPath) return null;

  const cleaned = storedPath.replace(/^file:\/\//, '');
  const exists = await RNFS.exists(cleaned);
  if (exists) return storedPath;

  for (const ext of ['jpg', 'jpeg', 'png', 'gif', 'webp']) {
    const candidate = `${PHOTO_DIR}/${productId}.${ext}`;
    const candidateExists = await RNFS.exists(candidate);
    if (candidateExists) return candidate;
  }

  return null;
}

export function getPersistentPhotoPath(productId: string): string {
  return `${PHOTO_DIR}/${productId}.jpg`;
}
