# Image Upload API - Quick Start Guide

## ⚡ 30-Second Setup

1. **Files are already created!** Just start using them.

## 🚀 Quick Usage

### Frontend (React Component)
```tsx
'use client';

import { useImageUpload } from '@/hooks/useImageUpload';

export function MyImageUpload() {
  const { upload, isLoading, uploadedUrls } = useImageUpload();

  return (
    <div>
      <input
        type="file"
        onChange={(e) => e.target.files && upload(e.target.files)}
        disabled={isLoading}
        multiple
      />
      {uploadedUrls.map((url) => (
        <img key={url} src={url} alt="Uploaded" />
      ))}
    </div>
  );
}
```

### Upload to Product
```tsx
const { upload } = useImageUpload();

// Upload and save to product in MongoDB
upload(fileList, `/api/uploads/product-images?productId=${productId}`);
```

### Raw Fetch (No Hook)
```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const res = await fetch('/api/uploads', {
  method: 'POST',
  body: formData,
});

const { data } = await res.json();
console.log('URL:', data.urls[0]); // e.g., /uploads/image-123-abc.jpg
```

## 📁 What Was Created

| File | Purpose |
|------|---------|
| `/src/lib/uploadHandler.ts` | File handling utilities |
| `/src/app/api/uploads/route.ts` | Generic upload endpoint |
| `/src/app/api/uploads/product-images/route.ts` | Product image upload + MongoDB save |
| `/src/hooks/useImageUpload.ts` | React hook for uploads |
| `/public/uploads/` | Directory for storing images |
| `IMAGE_UPLOAD_API.md` | Full documentation |

## 🎯 API Endpoints

### Generic Upload
```
POST /api/uploads
Response: { urls: ["/uploads/file.jpg"], ... }
```

### Save to Product
```
POST /api/uploads/product-images?productId=XXX
Response: { urls: [...], product: { _id, images, name } }
```

### Delete File
```
DELETE /api/uploads?filename=XXX
```

## ⚙️ Configuration

Edit `/src/lib/uploadHandler.ts`:
```typescript
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,        // 10 MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', ...],
  UPLOAD_DIR: 'uploads',                  // /public/uploads
  BASE_URL: '/uploads',                   // URL prefix
};
```

## ✅ Features

- ✅ Upload to `/public/uploads`
- ✅ Get shareable URLs (`/uploads/filename.jpg`)
- ✅ Save URLs to MongoDB
- ✅ File validation (type & size)
- ✅ Unique filenames (no collisions)
- ✅ Delete files
- ✅ React hook for easy integration

## 🔒 Limits

- **Max size:** 10 MB
- **Types:** JPEG, PNG, WebP, GIF, SVG
- **Storage:** `/public/uploads` (filesystem)

## 📖 Full Docs

See `IMAGE_UPLOAD_API.md` for complete documentation with examples.

## 🆘 Troubleshooting

**Images not showing?**
- Check `/public/uploads` directory exists
- Check browser console for errors

**MongoDB not saving?**
- Verify product ID is correct
- Check MongoDB connection

**File size error?**
- Max is 10 MB (edit `UPLOAD_CONFIG` to increase)

## 💡 Common Patterns

### With Progress Bar
```tsx
const { upload, isLoading } = useImageUpload();

return (
  <div>
    <input onChange={(e) => upload(e.target.files)} />
    {isLoading && <ProgressBar />}
  </div>
);
```

### With Drag & Drop
```tsx
const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  upload(e.dataTransfer.files);
};

return <div onDrop={handleDrop}>Drop images here</div>;
```

### With Image Preview
```tsx
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files?.[0]) {
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(e.target.files[0]);
    upload(e.target.files);
  }
};
```

---

**Ready to use! Start uploading images! 🎉**
