import RNFS from 'react-native-fs';

const PHOTO_DIR = `${RNFS.DocumentDirectoryPath}/photos`;

export async function ensurePhotoDir(): Promise<void> {
  const exists = await RNFS.exists(PHOTO_DIR);
  if (!exists) {
    await RNFS.mkdir(PHOTO_DIR);
  }
}

function getExtension(sourceUri: string, mimeType?: string): string {
  if (mimeType) {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    return map[mimeType] || mimeType.split('/')[1] || 'jpg';
  }

  const uriParts = sourceUri.split('.');
  if (uriParts.length > 1) {
    const ext = uriParts.pop()?.split('?')[0];
    if (ext && ext.length <= 5) return ext;
  }

  return 'jpg';
}

async function copyContentUri(sourceUri: string, destPath: string): Promise<void> {
  const response = await fetch(sourceUri);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        await RNFS.writeFile(
          destPath,
          base64.replace(/^data:.*?;base64,/, ''),
          'base64',
        );
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function savePhotoToStorage(
  sourceUri: string,
  productId: string,
  mimeType?: string,
): Promise<string> {
  await ensurePhotoDir();

  const ext = getExtension(sourceUri, mimeType);
  const destPath = `${PHOTO_DIR}/${productId}.${ext}`;

  const destExists = await RNFS.exists(destPath);
  if (destExists) {
    await RNFS.unlink(destPath);
  }

  if (sourceUri.startsWith('content://')) {
    await copyContentUri(sourceUri, destPath);
  } else {
    const sourcePath = sourceUri.replace(/^file:\/\//, '');
    await RNFS.copyFile(sourcePath, destPath);
  }

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
