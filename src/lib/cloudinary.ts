const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

export function optimizeAvatarUrl(url: string): string {
  const marker = '/image/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  return `${url.slice(0, idx)}${marker}w_300,h_300,c_fill,g_face,f_auto,q_auto/${url.slice(idx + marker.length)}`;
}

export async function uploadAvatarToCloudinary(file: File, userId: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('public_id', `avatar_${userId}_${Date.now()}`);

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
  return optimizeAvatarUrl(data.secure_url);
}