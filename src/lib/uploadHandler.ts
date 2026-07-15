import { v2 as cloudinary } from 'cloudinary';
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ],
  BASE_URL: process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL || 'https://res.cloudinary.com',
};

// config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

export async function saveUploadedFile(file: File): Promise<{
  filename: string;
  url: string;
}> {
  if (!UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
    throw new Error('File size too large');
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'products' }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      })
      .end(buffer);
  });

  return {
    filename: result.public_id,
    url: result.secure_url,
  };
}

export async function deleteUploadedFile(filename: string): Promise<void> {
  if (!filename) {
    throw new Error('Filename is required');
  }

  await cloudinary.uploader.destroy(filename);
}