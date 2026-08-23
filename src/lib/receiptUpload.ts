import imageCompression from 'browser-image-compression';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

/**
 * Client-side image compression for receipt photos.
 * Targets ~100-300 KB output via JPEG quality 0.7 and max 800px dimension.
 */
export async function compressReceipt(file: File): Promise<File> {
  return imageCompression(file, {
    maxWidthOrHeight: 800,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.7,
  });
}

/**
 * Upload a compressed receipt image to Cloudinary via unsigned upload.
 * Returns the secure Cloudinary URL.
 */
export async function uploadReceipt(file: File): Promise<string> {
  const compressed = await compressReceipt(file);

  const formData = new FormData();
  formData.append('file', compressed);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('public_id', `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

  let res: Response;
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new Error('Upload gagal. Periksa koneksi Anda.');
  }

  if (!res.ok) {
    throw new Error('Upload gagal. Periksa koneksi Anda.');
  }

  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) {
    throw new Error('Upload gagal. Periksa koneksi Anda.');
  }

  // Apply auto-format & quality optimization (no face-crop like avatars)
  const marker = '/image/upload/';
  const idx = data.secure_url.indexOf(marker);
  if (idx !== -1) {
    return `${data.secure_url.slice(0, idx)}${marker}w_800,f_auto,q_auto/${data.secure_url.slice(idx + marker.length)}`;
  }
  return data.secure_url;
}