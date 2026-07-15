import { v2 as cloudinary } from 'cloudinary';

export const CLOUDINARY_CONFIG = {
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,
  MAX_VIDEO_SIZE: 100 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/avif',
  ],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/ogg', 'video/mpeg'],
} as const;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

export const getAllowedTypes = (resourceType: 'image' | 'video' | 'auto' = 'auto') => {
  if (resourceType === 'video') return [...CLOUDINARY_CONFIG.ALLOWED_VIDEO_TYPES];
  if (resourceType === 'image') return [...CLOUDINARY_CONFIG.ALLOWED_IMAGE_TYPES];
  return [...CLOUDINARY_CONFIG.ALLOWED_IMAGE_TYPES, ...CLOUDINARY_CONFIG.ALLOWED_VIDEO_TYPES];
};

export const isValidUploadType = (file: File, resourceType: 'image' | 'video' | 'auto' = 'auto') => {
  const allowedTypes: string[] = getAllowedTypes(resourceType);
  return allowedTypes.includes(file.type);
};

export const getMaxFileSize = (resourceType: 'image' | 'video' | 'auto' = 'auto') => {
  if (resourceType === 'video') return CLOUDINARY_CONFIG.MAX_VIDEO_SIZE;
  return CLOUDINARY_CONFIG.MAX_IMAGE_SIZE;
};

export async function uploadToCloudinary(
  file: File,
  options: {
    folder?: string;
    resourceType?: 'image' | 'video' | 'auto';
  } = {}
) {
  const resourceType = options.resourceType ?? (file.type.startsWith('video/') ? 'video' : 'image');
  const allowedTypes = getAllowedTypes(resourceType);
  const maxFileSize = getMaxFileSize(resourceType);

 // Line 50 ko is tarah se replace karein:
if (!allowedTypes.includes(file.type as typeof allowedTypes[number])) {
  throw new Error(`Invalid file type: ${file.type}`);
}
  if (file.size > maxFileSize) {
    throw new Error(`File size exceeds the maximum allowed size of ${Math.round(maxFileSize / (1024 * 1024))}MB`);
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: options.folder || 'products',
          resource_type: resourceType,
        },
        (error, uploadResult) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(uploadResult);
        }
      )
      .end(buffer);
  });

  return {
    secureUrl: result?.secure_url || '',
    publicId: result?.public_id || '',
    resourceType: result?.resource_type || resourceType,
  };
}
