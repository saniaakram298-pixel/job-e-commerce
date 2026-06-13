# Image Upload API Documentation

This document explains how to use the image upload functionality in the Atelier e-commerce platform.

## Overview

The image upload system provides:
- ✅ File upload to `/public/uploads` directory
- ✅ Image URL generation and serving
- ✅ MongoDB integration to save URLs
- ✅ File validation (type and size)
- ✅ Unique filename generation
- ✅ Client-side React hook for easy integration

## API Endpoints

### 1. Generic Upload Endpoint
**POST `/api/uploads`**

Uploads files and returns URLs. Does not save to MongoDB.

#### Request
```bash
curl -X POST http://localhost:3000/api/uploads \
  -F "file=@image.jpg" \
  -F "file=@image2.png"
```

#### Response
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "filename": "image-1701234567890-abc123def456.jpg",
        "url": "/uploads/image-1701234567890-abc123def456.jpg"
      }
    ],
    "urls": ["/uploads/image-1701234567890-abc123def456.jpg"],
    "count": 1
  },
  "message": "Successfully uploaded 1 file(s)"
}
```

---

### 2. Product Image Upload Endpoint
**POST `/api/uploads/product-images`**

Uploads product images and optionally saves URLs to a product in MongoDB.

#### Request (without saving to product)
```bash
curl -X POST http://localhost:3000/api/uploads/product-images \
  -F "file=@product-image.jpg"
```

#### Request (with product save)
```bash
curl -X POST http://localhost:3000/api/uploads/product-images?productId=507f1f77bcf86cd799439011 \
  -F "file=@product-image.jpg" \
  -F "file=@product-image2.png"
```

#### Response (with product save)
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "filename": "product-image-1701234567890-abc123def456.jpg",
        "url": "/uploads/product-image-1701234567890-abc123def456.jpg"
      }
    ],
    "urls": ["/uploads/product-image-1701234567890-abc123def456.jpg"],
    "count": 1,
    "product": {
      "_id": "507f1f77bcf86cd799439011",
      "images": [
        "/uploads/existing-image.jpg",
        "/uploads/product-image-1701234567890-abc123def456.jpg"
      ],
      "name": "Premium Wedding Dress"
    }
  },
  "message": "Successfully uploaded 1 file(s) and saved to product"
}
```

---

### 3. Delete File Endpoint
**DELETE `/api/uploads?filename=xxx`**

Deletes an uploaded file from the server.

#### Request
```bash
curl -X DELETE "http://localhost:3000/api/uploads?filename=image-1701234567890-abc123def456.jpg"
```

#### Response
```json
{
  "success": true,
  "data": {
    "filename": "image-1701234567890-abc123def456.jpg"
  },
  "message": "File deleted successfully"
}
```

---

### 4. Get Upload Configuration
**GET `/api/uploads`**

Returns upload configuration and constraints.

#### Response
```json
{
  "success": true,
  "data": {
    "config": {
      "maxFileSize": 10485760,
      "maxFileSizeMB": 10,
      "allowedTypes": ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
      "baseUrl": "/uploads"
    }
  },
  "message": "Upload configuration retrieved successfully"
}
```

---

## Frontend Integration

### Using the `useImageUpload` Hook

The easiest way to handle image uploads on the frontend is using the `useImageUpload` hook:

#### Basic Example
```tsx
import { useImageUpload } from '@/hooks/useImageUpload';

export function ImageUploadForm() {
  const { upload, isLoading, error, uploadedUrls } = useImageUpload({
    onSuccess: (response) => {
      console.log('Uploaded URLs:', response.urls);
    },
    onError: (error) => {
      console.error('Upload error:', error);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      upload(e.target.files);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} multiple />
      {isLoading && <p>Uploading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {uploadedUrls.map((url) => (
        <img key={url} src={url} alt="Uploaded" style={{ width: '200px' }} />
      ))}
    </div>
  );
}
```

#### With Product Save
```tsx
import { useImageUpload } from '@/hooks/useImageUpload';

export function ProductImageUpload({ productId }: { productId: string }) {
  const { upload, isLoading, response } = useImageUpload({
    onSuccess: (res) => {
      console.log('Product images saved:', res.product?.images);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Use the product-specific endpoint with productId
      upload(
        e.target.files,
        `/api/uploads/product-images?productId=${productId}`
      );
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} multiple disabled={isLoading} />
      {isLoading && <p>Uploading...</p>}
      {response?.product && (
        <div>
          <p>Product: {response.product.name}</p>
          <p>Total images: {response.product.images.length}</p>
        </div>
      )}
    </div>
  );
}
```

#### Advanced Configuration
```tsx
const { upload, deleteFile, isLoading, error, uploadedUrls, reset } = useImageUpload({
  maxFiles: 5,
  allowedTypes: ['image/jpeg', 'image/png'],
  onSuccess: (response) => {
    console.log('Upload complete');
  },
  onError: (error) => {
    console.error('Error:', error);
  },
});

// Delete a file
await deleteFile('image-1701234567890-abc123def456.jpg');

// Reset state
reset();
```

---

## Using with Raw Fetch API

If you prefer not to use the hook:

```tsx
// Upload single file
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const res = await fetch('/api/uploads', {
  method: 'POST',
  body: formData,
});

const data = await res.json();
console.log('Uploaded URL:', data.data.urls[0]);

// Upload multiple files
const formData = new FormData();
for (const file of fileInput.files) {
  formData.append('file', file);
}

const res = await fetch('/api/uploads', {
  method: 'POST',
  body: formData,
});

const data = await res.json();
console.log('Uploaded URLs:', data.data.urls);
```

---

## File Constraints

| Constraint | Value |
|-----------|-------|
| Max file size | 10 MB |
| Max file size (MB) | 10 |
| Allowed types | image/jpeg, image/png, image/webp, image/gif, image/svg+xml |
| Upload directory | `/public/uploads` |
| URL pattern | `/uploads/[filename]` |

---

## MongoDB Integration

### How Product Images are Stored

When using the `/api/uploads/product-images?productId=XXX` endpoint:

1. File is saved to `/public/uploads/[filename]`
2. URL is added to product's `images` array in MongoDB
3. Multiple images can be added to the same product

### Example Product Document
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Premium Wedding Dress",
  "images": [
    "/uploads/wedding-dress-1701234567890-abc123.jpg",
    "/uploads/wedding-dress-1701234567891-def456.png",
    "/uploads/wedding-dress-detail-1701234567892-ghi789.jpg"
  ]
}
```

### Accessing Saved Images in Components

```tsx
import { Product } from '@/models/Product';

export async function ProductGallery({ productId }: { productId: string }) {
  const product = await Product.findById(productId);

  return (
    <div className="gallery">
      {product?.images.map((imageUrl) => (
        <img key={imageUrl} src={imageUrl} alt="Product" />
      ))}
    </div>
  );
}
```

---

## Filename Generation

Filenames are automatically generated using:
- Original filename (cleaned)
- Timestamp (milliseconds since epoch)
- Random hash (8 bytes hex)

Example: `wedding-dress-1701234567890-abc123def456.jpg`

This ensures:
- ✅ Unique filenames
- ✅ No collisions
- ✅ Readable names
- ✅ Security (no path traversal)

---

## Error Handling

### Common Errors

```json
{
  "success": false,
  "message": "Invalid file type. Allowed types: image/jpeg, image/png, image/webp, image/gif, image/svg+xml"
}
```

```json
{
  "success": false,
  "message": "File size exceeds maximum allowed size of 10MB"
}
```

```json
{
  "success": false,
  "message": "No files provided"
}
```

```json
{
  "success": false,
  "message": "Product not found"
}
```

---

## Utility Functions

### `uploadHandler.ts`

Located at `/src/lib/uploadHandler.ts`, provides these utilities:

```tsx
// Generate unique filename
import { generateUniqueFilename } from '@/lib/uploadHandler';
const filename = generateUniqueFilename('photo.jpg');
// Output: photo-1701234567890-abc123def456.jpg

// Get uploads directory
import { getUploadsDirectory } from '@/lib/uploadHandler';
const dir = await getUploadsDirectory();

// Save file to disk
import { saveUploadedFile } from '@/lib/uploadHandler';
const result = await saveUploadedFile(file);
// Returns: { filename, filepath, url }

// Delete file from disk
import { deleteUploadedFile } from '@/lib/uploadHandler';
await deleteUploadedFile('photo-1701234567890-abc123def456.jpg');

// Get URL for filename
import { getFileUrl } from '@/lib/uploadHandler';
const url = getFileUrl('photo.jpg');
// Returns: /uploads/photo.jpg

// Extract filename from URL
import { getFilenameFromUrl } from '@/lib/uploadHandler';
const filename = getFilenameFromUrl('/uploads/photo.jpg');
// Returns: photo.jpg
```

---

## Security Features

- ✅ File type validation (MIME types)
- ✅ File size limits (10MB)
- ✅ Unique filename generation (prevents collisions)
- ✅ Path traversal protection
- ✅ Directory creation (auto-creates `/public/uploads`)
- ✅ Error handling and validation

---

## Troubleshooting

### Images not appearing after upload?
1. Check if `/public/uploads` directory exists
2. Verify file permissions on the directory
3. Clear browser cache
4. Check browser console for errors

### "Product not found" error?
1. Verify the `productId` is correct and exists in MongoDB
2. Check if product ID format is correct (MongoDB ObjectId)

### File size errors?
1. Maximum file size is 10MB
2. Adjust `MAX_FILE_SIZE` in `/src/lib/uploadHandler.ts` if needed

### CORS issues?
- This API is same-origin, so CORS shouldn't be an issue
- If using from external domain, configure Next.js CORS headers

---

## File Structure

```
nextjs-app/
├── public/
│   └── uploads/                    # ✅ Uploaded images stored here
├── src/
│   ├── app/
│   │   └── api/
│   │       └── uploads/
│   │           ├── route.ts        # ✅ Generic upload endpoint
│   │           └── product-images/
│   │               └── route.ts    # ✅ Product image endpoint
│   ├── hooks/
│   │   └── useImageUpload.ts       # ✅ React hook for uploads
│   └── lib/
│       └── uploadHandler.ts        # ✅ Upload utilities
```

---

## Configuration

To modify upload constraints, edit `/src/lib/uploadHandler.ts`:

```tsx
export const UPLOAD_CONFIG = {
  // Maximum file size: 20MB (change from 10MB)
  MAX_FILE_SIZE: 20 * 1024 * 1024,
  
  // Add more allowed types
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    // 'image/avif' // Add if needed
  ],
  
  // Change upload directory
  UPLOAD_DIR: 'uploads', // Currently /public/uploads
  
  // Change base URL
  BASE_URL: '/uploads', // Currently /uploads
};
```

---

## Next Steps

1. ✅ Integrate `useImageUpload` hook into your components
2. ✅ Use `/api/uploads/product-images` for products
3. ✅ Images automatically saved in `/public/uploads`
4. ✅ URLs stored in MongoDB product documents
5. ✅ Display images in product components

---

## Example Complete Component

```tsx
'use client';

import { useImageUpload } from '@/hooks/useImageUpload';
import { useState } from 'react';

export function ProductImageManager({ productId }: { productId: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const { upload, isLoading, error, response } = useImageUpload({
    maxFiles: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    onSuccess: (res) => {
      console.log('Successfully uploaded!', res.product?.images);
    },
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      upload(e.dataTransfer.files, `/api/uploads/product-images?productId=${productId}`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      upload(e.target.files, `/api/uploads/product-images?productId=${productId}`);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
      >
        <input
          type="file"
          onChange={handleFileSelect}
          disabled={isLoading}
          className="hidden"
          id="fileInput"
          multiple
        />
        <label htmlFor="fileInput" className="cursor-pointer">
          {isLoading ? 'Uploading...' : 'Drag images or click to select'}
        </label>
      </div>

      {preview && <img src={preview} alt="Preview" className="w-40 h-40 object-cover" />}
      {error && <div className="text-red-600">{error}</div>}
      {response?.product && (
        <div className="bg-green-50 p-4 rounded">
          <p className="font-semibold">{response.product.name}</p>
          <p className="text-sm text-gray-600">
            {response.product.images.length} images uploaded
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## License

This upload system is part of The Atelier e-commerce platform.
