import { useState, useCallback } from 'react';

export interface UploadResponse {
  files: Array<{ filename: string; url: string }>;
  urls: string[];
  count: number;
  product?: {
    _id: string;
    images: string[];
    name: string;
  };
}

export interface UseImageUploadOptions {
  maxFiles?: number;
  allowedTypes?: string[];
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: string) => void;
}

/**
 * Hook for uploading images to the server
 * 
 * Usage:
 * const { upload, isLoading, error, uploadedUrls } = useImageUpload({
 *   onSuccess: (res) => console.log('Uploaded:', res.urls),
 *   onError: (err) => console.error('Upload failed:', err),
 * });
 * 
 * Then in your component:
 * <input
 *   type="file"
 *   multiple
 *   onChange={(e) => upload(e.target.files, '/api/uploads/product-images?productId=123')}
 * />
 */
export function useImageUpload(options: UseImageUploadOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [response, setResponse] = useState<UploadResponse | null>(null);

  const upload = useCallback(
    async (
      files: FileList | File[] | null,
      endpoint: string = '/api/uploads'
    ) => {
      if (!files || files.length === 0) {
        const errorMsg = 'No files selected';
        setError(errorMsg);
        options.onError?.(errorMsg);
        return;
      }

      // Check max files limit
      if (options.maxFiles && files.length > options.maxFiles) {
        const errorMsg = `Maximum ${options.maxFiles} file(s) allowed`;
        setError(errorMsg);
        options.onError?.(errorMsg);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const formData = new FormData();

        // Add all files to FormData
        for (const file of Array.from(files)) {
          // Validate file type if specified
          if (
            options.allowedTypes &&
            !options.allowedTypes.includes(file.type)
          ) {
            const errorMsg = `Invalid file type: ${file.name}. Allowed types: ${options.allowedTypes.join(', ')}`;
            setError(errorMsg);
            options.onError?.(errorMsg);
            setIsLoading(false);
            return;
          }

          formData.append('file', file);
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          const errorMsg = data.message || 'Upload failed';
          setError(errorMsg);
          options.onError?.(errorMsg);
          setIsLoading(false);
          return;
        }

        const data: any = await res.json();
        const uploadResponse: UploadResponse = data.data || data;

        setUploadedUrls(uploadResponse.urls);
        setResponse(uploadResponse);
        options.onSuccess?.(uploadResponse);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Upload failed';
        setError(errorMsg);
        options.onError?.(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  const deleteFile = useCallback(async (filename: string) => {
    try {
      const res = await fetch(
        `/api/uploads?filename=${encodeURIComponent(filename)}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        throw new Error('Failed to delete file');
      }

      // Remove from uploaded URLs
      setUploadedUrls((prev) =>
        prev.filter((url) => !url.includes(filename))
      );
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Delete failed';
      setError(errorMsg);
      options.onError?.(errorMsg);
    }
  }, [options]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setUploadedUrls([]);
    setResponse(null);
  }, []);

  return {
    upload,
    deleteFile,
    isLoading,
    error,
    uploadedUrls,
    response,
    clearError,
    reset,
  };
}
