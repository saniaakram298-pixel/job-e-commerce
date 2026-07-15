'use client';

import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';





interface ProductUploadFormProps {
  category: string;
  onProductAdded?: () => void;
}

export default function ProductUploadForm({ category, onProductAdded }: ProductUploadFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    discountPrice: '',
    stock: '10',
    sizes: 'Free Size',
    colors: 'Black',
    collection: 'best-seller',
    img: '',
    thumbnailImages: [] as string[],
    isBestSeller: false,
    isTrending: false,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [thumbnailPreviews, setThumbnailPreviews] = useState<string[]>([]);

  const categories = [
    'bridal', 'groom', 'formal', 'informal', 'children',
    'men', 'women', 'old-people', 'young', 'accessories'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

 const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];

  if (file) {
    setImageFiles((prev) => [file, ...prev]);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};

  const handleThumbnailImageChange = (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const files = Array.from(e.target.files || []);

  if (files.length === 0) return;

  setImageFiles((prev) => [...prev, ...files]);

  Promise.all(
    files.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        })
    )
  ).then((results) => {
    setThumbnailPreviews((prev) => [...prev, ...results]);
  });
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
   if (!formData.title || !formData.price || imageFiles.length === 0) {
  toast.error('Please fill in all required fields');
  return;
}

    setLoading(true);
    try {
      const stockValue = Number(formData.stock || 10);
      const sizeEntries = formData.sizes
        .split(',')
        .map((size) => ({ size: size.trim(), stock: stockValue }))
        .filter((entry) => entry.size);
      const colorEntries = formData.colors
        .split(',')
        .map((color) => ({ color: color.trim(), stock: stockValue }))
        .filter((entry) => entry.color);

      const safeSizeEntries = sizeEntries.length > 0 ? sizeEntries : [{ size: 'Free Size', stock: stockValue }];
      const safeColorEntries = colorEntries.length > 0 ? colorEntries : [{ color: 'Black', stock: stockValue }];

      const form = new FormData();

      form.append('name', formData.title);
      form.append('description', formData.description);
      form.append('price', formData.price);
      form.append('discountPrice', formData.discountPrice);
      form.append('category', category);
      form.append('collection', formData.collection);
      form.append('sizes', JSON.stringify(safeSizeEntries));
      form.append('colors', JSON.stringify(safeColorEntries));
      form.append('tags', JSON.stringify([category]));
      form.append('materials', JSON.stringify([]));
      form.append('featured', 'false');
      form.append('isBestSeller', String(formData.isBestSeller));
      form.append('isTrending', String(formData.isTrending));
      form.append('active', 'true');

      const mainImageFile = imageFiles[0];
      const thumbnailFiles = imageFiles.slice(1);

      if (mainImageFile) {
        form.append('mainImage', mainImageFile);
      }

      thumbnailFiles.forEach((file) => {
        form.append('thumbnails', file);
      });

      const response = await fetch('/api/products', {
        method: 'POST',
        body: form,
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        toast.success('Product added successfully!');
        setFormData({
          title: '',
          description: '',
          price: '',
          discountPrice: '',
          stock: '10',
          sizes: 'Free Size',
          colors: 'Black',
          collection: 'best-seller',
          img: '',
          thumbnailImages: [],
          isBestSeller: false,
          isTrending: false,
        });
        setImagePreview(null);
        setThumbnailPreviews([]);
        setIsOpen(false);
        onProductAdded?.();
      } else {
        console.error('Failed to add product response:', result);
        toast.error(result?.error || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error(error instanceof Error ? error.message : 'Error adding product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Open Form Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-amber-700 text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors font-medium"
        >
          <Upload className="w-4 h-4" />
          Add New Product
        </button>
      )}

      {/* Form Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 m-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Add New Product</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Image *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
                {imagePreview && (
                  <div className="mt-4 flex justify-center">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-xs max-h-64 rounded-lg object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thumbnail Images
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleThumbnailImageChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {thumbnailPreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {thumbnailPreviews.map((preview, index) => (
                      <div key={`${preview}-${index}`} className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-1">
                        <img
                          src={preview}
                          alt={`Thumbnail preview ${index + 1}`}
                          className="h-20 w-full rounded-md object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter product title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter product description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Price and Discount Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Price
                  </label>
                  <input
                    type="number"
                    name="discountPrice"
                    value={formData.discountPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="10"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Sizes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sizes (comma-separated)
                </label>
                <input
                  type="text"
                  name="sizes"
                  value={formData.sizes}
                  onChange={handleInputChange}
                  placeholder="e.g., S, M, L, XL"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Colors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colors (comma-separated)
                </label>
                <input
                  type="text"
                  name="colors"
                  value={formData.colors}
                  onChange={handleInputChange}
                  placeholder="e.g., Black, Red, Blue"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Collection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collection
                </label>
                <select
                  name="collection"
                  value={formData.collection}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="best-seller">Best Seller</option>
                  <option value="trending">Trending</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm">
                  <input
                    type="checkbox"
                    name="isBestSeller"
                    checked={formData.isBestSeller}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-gray-300 text-amber-700 focus:ring-amber-500"
                  />
                  Mark as Best Seller
                </label>
                <label className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm">
                  <input
                    type="checkbox"
                    name="isTrending"
                    checked={formData.isTrending}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-gray-300 text-amber-700 focus:ring-amber-500"
                  />
                  Mark as Trending
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-amber-700 text-white py-2 rounded-lg hover:bg-amber-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
