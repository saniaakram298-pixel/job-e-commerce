import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Configuration for file uploads
 */
export const UPLOAD_CONFIG = {
  // Maximum file size: 10MB
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  // Allowed file types
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  // Upload directory relative to public folder
  UPLOAD_DIR: 'uploads',
  // Base URL for serving uploads
  BASE_URL: '/uploads',
};

/**
 * Generates a unique filename for the uploaded file
 * @param originalName - Original filename
 * @returns Unique filename with timestamp and hash
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomHash = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  
  // Clean the filename
  const cleanName = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);

  return `${cleanName}-${timestamp}-${randomHash}${ext}`;
}

/**
 * Gets the full path to the uploads directory
 * Creates the directory if it doesn't exist
 */
export async function getUploadsDirectory(): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', UPLOAD_CONFIG.UPLOAD_DIR);
  
  try {
    // Check if directory exists
    await fs.access(uploadsDir);
  } catch {
    // Directory doesn't exist, create it
    await fs.mkdir(uploadsDir, { recursive: true });
  }

  return uploadsDir;
}

/**
 * Saves uploaded file to disk and returns the URL
 * @param file - File from FormData
 * @returns Object with filename, path, and URL
 */
export async function saveUploadedFile(file: File): Promise<{
  filename: string;
  filepath: string;
  url: string;
}> {
  // Validate file type
  if (!UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type. Allowed types: ${UPLOAD_CONFIG.ALLOWED_TYPES.join(', ')}`
    );
  }

  // Validate file size
  if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds maximum allowed size of ${UPLOAD_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  const uploadsDir = await getUploadsDirectory();
  const filename = generateUniqueFilename(file.name);
  const filepath = path.join(uploadsDir, filename);

  // Convert File to Buffer and write to disk
  const buffer = await file.arrayBuffer();
  await fs.writeFile(filepath, Buffer.from(buffer));

  // Return URL that can be used in the application
  const url = `${UPLOAD_CONFIG.BASE_URL}/${filename}`;

  return {
    filename,
    filepath,
    url,
  };
}

/**
 * Deletes a file from the uploads directory
 * @param filename - Filename to delete
 */
export async function deleteUploadedFile(filename: string): Promise<void> {
  // Security: ensure filename doesn't contain path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new Error('Invalid filename');
  }

  const uploadsDir = await getUploadsDirectory();
  const filepath = path.join(uploadsDir, filename);

  try {
    await fs.unlink(filepath);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    // File doesn't exist, which is fine
  }
}

/**
 * Gets the URL for a filename
 * @param filename - Filename to get URL for
 * @returns URL string
 */
export function getFileUrl(filename: string): string {
  // Security: ensure filename doesn't contain path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new Error('Invalid filename');
  }
  return `${UPLOAD_CONFIG.BASE_URL}/${filename}`;
}

/**
 * Extracts filename from a URL
 * @param url - URL string
 * @returns Filename
 */
export function getFilenameFromUrl(url: string): string {
  return url.replace(UPLOAD_CONFIG.BASE_URL + '/', '');
}
