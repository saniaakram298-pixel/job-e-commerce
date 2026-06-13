import { NextRequest, NextResponse } from 'next/server';
import { saveUploadedFile } from '@/lib/uploadHandler';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
export const dynamic = 'force-dynamic';

/**
 * POST /api/uploads/product-images
 * Uploads product images and saves URLs to MongoDB
 * 
 * Query params:
 *   - productId: ID of the product to attach images to (optional)
 * 
 * Request body: FormData with files
 * Response: { 
 *   urls: string[],
 *   files: Array<{ filename, url }>,
 *   product?: { _id, images }
 * }
 * 
 * Usage:
 * const formData = new FormData();
 * formData.append('file', fileInput.files[0]);
 * 
 * // Just get URLs (no MongoDB save):
 * const res = await fetch('/api/uploads/product-images', { method: 'POST', body: formData });
 * 
 * // Save to product in MongoDB:
 * const res = await fetch('/api/uploads/product-images?productId=123', { method: 'POST', body: formData });
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const files = formData.getAll('file') as File[];
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

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
        return createErrorResponse(
          `Error uploading file ${file.name}: ${error.message}`,
          400
        );
      }
    }

    // If productId is provided, add the images to the product in MongoDB
    let updatedProduct = null;
    if (productId) {
      try {
        const product = await Product.findById(productId);
        
        if (!product) {
          return createErrorResponse('Product not found', 404);
        }

        // Add new URLs to existing images array
        if (!Array.isArray(product.images)) {
          product.images = [];
        }
        product.images.push(...urls);

        await product.save();
        updatedProduct = {
          _id: product._id,
          images: product.images,
          name: product.name,
        };
      } catch (error: any) {
        console.error('Error updating product in database:', error);
        return createErrorResponse(
          `Error saving to product: ${error.message}`,
          500
        );
      }
    }

    const response: any = {
      files: uploadedFiles,
      urls: urls,
      count: uploadedFiles.length,
    };

    if (updatedProduct) {
      response.product = updatedProduct;
    }

    return createSuccessResponse(
      response,
      `Successfully uploaded ${uploadedFiles.length} file(s)${productId ? ' and saved to product' : ''}`
    );
  } catch (error) {
    console.error('Product image upload error:', error);
    return createErrorResponse('Error processing upload', 500);
  }
}
