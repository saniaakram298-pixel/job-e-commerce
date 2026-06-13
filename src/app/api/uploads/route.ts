import { NextRequest, NextResponse } from 'next/server';
import { saveUploadedFile, deleteUploadedFile, UPLOAD_CONFIG } from '@/lib/uploadHandler';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
export const dynamic = 'force-dynamic';

/**
 * GET /api/uploads
 * Returns upload configuration and allowed types
 */
export async function GET(request: NextRequest) {
  try {
    return createSuccessResponse(
      {
        config: {
          maxFileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
          maxFileSizeMB: UPLOAD_CONFIG.MAX_FILE_SIZE / 1024 / 1024,
          allowedTypes: UPLOAD_CONFIG.ALLOWED_TYPES,
          baseUrl: UPLOAD_CONFIG.BASE_URL,
        },
      },
      'Upload configuration retrieved successfully'
    );
  } catch (error) {
    console.error('Get upload config error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * POST /api/uploads
 * Handles single or multiple file uploads
 * 
 * Request body: FormData with files
 * Response: { urls: string[], files: Array<{ filename, url }> }
 * 
 * Example:
 * const formData = new FormData();
 * formData.append('file', fileInput.files[0]);
 * const res = await fetch('/api/uploads', { method: 'POST', body: formData });
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('file') as File[];

    if (!files || files.length === 0) {
      return createErrorResponse('No files provided', 400);
    }

    // Validate that we have actual File objects
    if (!Array.isArray(files) || !files[0] || !(files[0] instanceof File)) {
      return createErrorResponse('Invalid file format', 400);
    }

    const uploadedFiles = [];
    const urls = [];

    // Process each uploaded file
    for (const file of files) {
      if (!file || !(file instanceof File)) {
        continue;
      }

      try {
        const { filename, url } = await saveUploadedFile(file);
        uploadedFiles.push({ filename, url });
        urls.push(url);
      } catch (error: any) {
        console.error(`Error uploading file ${file.name}:`, error);
        return createErrorResponse(`Error uploading file ${file.name}: ${error.message}`, 400);
      }
    }

    return createSuccessResponse(
      {
        files: uploadedFiles,
        urls: urls,
        count: uploadedFiles.length,
      },
      `Successfully uploaded ${uploadedFiles.length} file(s)`
    );
  } catch (error) {
    console.error('Upload error:', error);
    return createErrorResponse('Error processing upload', 500);
  }
}

/**
 * DELETE /api/uploads
 * Deletes an uploaded file
 * 
 * Query params: ?filename=xxx
 * 
 * Example:
 * await fetch('/api/uploads?filename=image-123-abc.jpg', { method: 'DELETE' });
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return createErrorResponse('Filename query parameter is required', 400);
    }

    await deleteUploadedFile(filename);

    return createSuccessResponse(
      { filename },
      'File deleted successfully'
    );
  } catch (error: any) {
    console.error('Delete upload error:', error);
    return createErrorResponse(error.message || 'Error deleting file', 500);
  }
}
