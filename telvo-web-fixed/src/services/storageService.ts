// src/services/storageService.ts
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'rxtcnv16';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

function getCloudinaryUploadUrl() {
  return `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
}

export async function uploadImage(file: File, path: string): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only JPG, PNG, or WEBP images are allowed.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Images must be smaller than 8MB.');
  }
  if (!CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary upload preset is not configured.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', path);

  const response = await fetch(getCloudinaryUploadUrl(), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloudinary upload failed: ${text}`);
  }

  const result = await response.json();
  if (!result.secure_url) {
    throw new Error('Cloudinary upload succeeded but no URL was returned.');
  }

  return result.secure_url as string;
}

const MAX_APK_BYTES = 150 * 1024 * 1024; // 150MB

export async function uploadApk(file: File, versionCode: number, onProgress?: (pct: number) => void): Promise<{ url: string; sizeBytes: number }> {
  if (!file.name.toLowerCase().endsWith('.apk')) {
    throw new Error('Please choose a .apk file.');
  }
  if (file.size > MAX_APK_BYTES) {
    throw new Error('APK must be smaller than 150MB.');
  }

  // GitHub Releases is the recommended source for APK distribution; if the admin
  // wants to upload an APK from the site, it is uploaded via Cloudinary instead of
  // Firebase Storage.
  if (!CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary upload preset is not configured.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', `app_releases/${versionCode}`);

  onProgress?.(10);
  const response = await fetch(getCloudinaryUploadUrl(), {
    method: 'POST',
    body: formData,
  });
  onProgress?.(100);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloudinary APK upload failed: ${text}`);
  }

  const result = await response.json();
  if (!result.secure_url) {
    throw new Error('Cloudinary APK upload succeeded but no download URL was returned.');
  }

  return { url: result.secure_url as string, sizeBytes: file.size };
}
