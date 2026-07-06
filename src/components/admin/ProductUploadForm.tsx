"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

interface ProductUploadFormProps {
  onSubmit?: (formData: FormData) => Promise<void>;
  darkMode?: boolean;
  onSuccess?: () => void;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  discountPrice: string;
  category: string;
  collection: string;
  materials: string[];
  sizes: Array<{ size: string; stock: string }>;
  colors: Array<{ color: string; stock: string }>;
  tags: string[];
  careInstructions: string;
  fit: string;
}

const CATEGORIES = [
  'bridal',
  'groom',
  'formal',
  'informal',
  'children',
  'men',
  'women',
  'old-people',
  'young',
  'new-arrival',
  'accessories',
];

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const COLORS_LIST = [
  'Black',
  'White',
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Pink',
  'Purple',
  'Gold',
  'Silver',
];

export const ProductUploadForm: React.FC<ProductUploadFormProps> = ({
  onSubmit,
  darkMode = false,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    category: 'new-arrival',
    collection: 'Featured',
    materials: [],
    sizes: [{ size: 'Free Size', stock: '10' }],
    colors: [{ color: 'Black', stock: '5' }],
    tags: [],
    careInstructions: '',
    fit: 'Standard',
  });

  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newMaterial, setNewMaterial] = useState('');
  const [newTag, setNewTag] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedImages((prev) => [...prev, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const addMaterial = () => {
    if (newMaterial.trim()) {
      setFormData((prev) => ({
        ...prev,
        materials: [...prev.materials, newMaterial.trim()],
      }));
      setNewMaterial('');
    }
  };

  const removeMaterial = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }));
  };

  const addTag = () => {
    if (newTag.trim()) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const updateSize = (index: number, field: 'size' | 'stock', value: string) => {
    setFormData((prev) => {
      const newSizes = [...prev.sizes];
      newSizes[index] = { ...newSizes[index], [field]: value };
      return { ...prev, sizes: newSizes };
    });
  };

  const addSize = () => {
    setFormData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { size: 'M', stock: '10' }],
    }));
  };

  const removeSize = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }));
  };

  const updateColor = (index: number, field: 'color' | 'stock', value: string) => {
    setFormData((prev) => {
      const newColors = [...prev.colors];
      newColors[index] = { ...newColors[index], [field]: value };
      return { ...prev, colors: newColors };
    });
  };

  const addColor = () => {
    setFormData((prev) => ({
      ...prev,
      colors: [...prev.colors, { color: 'Red', stock: '5' }],
    }));
  };

  const removeColor = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Create FormData for multipart submission
      const submitFormData = new FormData();

      // Add basic fields
      submitFormData.append('name', formData.name);
      submitFormData.append('description', formData.description);
      submitFormData.append('price', formData.price);
      submitFormData.append('discountPrice', formData.discountPrice || '0');
      submitFormData.append('category', formData.category);
      submitFormData.append('collection', formData.collection);
      submitFormData.append('careInstructions', formData.careInstructions);
      submitFormData.append('fit', formData.fit);

      // Add arrays as JSON
      submitFormData.append('materials', JSON.stringify(formData.materials));
      submitFormData.append('sizes', JSON.stringify(formData.sizes));
      submitFormData.append('colors', JSON.stringify(formData.colors));
      submitFormData.append('tags', JSON.stringify(formData.tags));

      // Add images
      uploadedImages.forEach((file, index) => {
        submitFormData.append(`images`, file);
      });

      // Use provided onSubmit or default API call
      if (onSubmit) {
        await onSubmit(submitFormData);
      } else {
        const response = await fetch('/api/products', {
          method: 'POST',
          body: submitFormData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create product');
        }

        const data = await response.json();
        setMessage({ type: 'success', text: `Product created successfully! ID: ${data.product._id}` });

        // Reset form
        setFormData({
          name: '',
          description: '',
          price: '',
          discountPrice: '',
          category: 'new-arrival',
          collection: 'Featured',
          materials: [],
          sizes: [{ size: 'Free Size', stock: '10' }],
          colors: [{ color: 'Black', stock: '5' }],
          tags: [],
          careInstructions: '',
          fit: 'Standard',
        });
        setUploadedImages([]);
        setImagePreviews([]);

        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to create product. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const bgClass = darkMode ? 'bg-[#0F0F0F] border-neutral-800' : 'bg-white border-neutral-200';
  const inputClass = `w-full px-3 py-2 rounded-lg border transition ${
    darkMode
      ? 'bg-neutral-900 border-neutral-700 text-gray-200 placeholder:text-neutral-500 focus:border-[#E5A93A] focus:outline-none'
      : 'bg-white border-neutral-200 text-gray-900 placeholder:text-neutral-400 focus:border-[#E5A93A] focus:outline-none'
  }`;

  return (
    <div className={`rounded-2xl border ${bgClass} p-6 max-w-4xl mx-auto`}>
      <h2 className="text-2xl font-bold mb-6">Add New Product</h2>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-600'
              : 'bg-red-500/10 border border-red-500/30 text-red-600'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Product Name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className={inputClass}
            />
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className={inputClass}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>

          <textarea
            name="description"
            placeholder="Product Description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows={4}
            className={inputClass}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={formData.price}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className={inputClass}
            />
            <input
              type="number"
              name="discountPrice"
              placeholder="Discount Price (Optional)"
              value={formData.discountPrice}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className={inputClass}
            />
            <input
              type="text"
              name="collection"
              placeholder="Collection Name"
              value={formData.collection}
              onChange={handleInputChange}
              className={inputClass}
            />
          </div>
        </div>

        {/* Images Upload */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Product Images</h3>

          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
              darkMode
                ? 'border-neutral-700 hover:border-[#E5A93A] hover:bg-neutral-900/50'
                : 'border-neutral-300 hover:border-[#E5A93A] hover:bg-[#E5A93A]/5'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Upload className="w-8 h-8 mx-auto mb-2 opacity-60" />
            <p className="text-sm opacity-75">Click to upload product images</p>
            <p className="text-xs opacity-50">PNG, JPG, GIF, WEBP (Max 10MB each)</p>
          </div>

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Materials & Care */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Materials & Care</h3>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add material (e.g., Cotton, Silk)"
              value={newMaterial}
              onChange={(e) => setNewMaterial(e.target.value)}
              className={inputClass}
            />
            <button
              type="button"
              onClick={addMaterial}
              className="px-4 py-2 bg-[#E5A93A] text-black rounded-lg hover:bg-[#d49830] transition"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {formData.materials.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.materials.map((material, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1 bg-[#E5A93A]/20 text-[#8C6219] rounded-full text-sm"
                >
                  {material}
                  <button
                    type="button"
                    onClick={() => removeMaterial(index)}
                    className="hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <textarea
              name="careInstructions"
              placeholder="Care Instructions"
              value={formData.careInstructions}
              onChange={handleInputChange}
              rows={3}
              className={inputClass}
            />
            <input
              type="text"
              name="fit"
              placeholder="Fit (e.g., Slim, Regular, Loose)"
              value={formData.fit}
              onChange={handleInputChange}
              className={inputClass}
            />
          </div>
        </div>

        {/* Sizes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Sizes</h3>
            <button
              type="button"
              onClick={addSize}
              className="px-3 py-1 bg-[#E5A93A] text-black rounded hover:bg-[#d49830] transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {formData.sizes.map((size, index) => (
              <div key={index} className="flex gap-2 items-end">
                <select
                  value={size.size}
                  onChange={(e) => updateSize(index, 'size', e.target.value)}
                  className={inputClass}
                >
                  {STANDARD_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Stock"
                  value={size.stock}
                  onChange={(e) => updateSize(index, 'stock', e.target.value)}
                  min="0"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeSize(index)}
                  className="px-3 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Colors</h3>
            <button
              type="button"
              onClick={addColor}
              className="px-3 py-1 bg-[#E5A93A] text-black rounded hover:bg-[#d49830] transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {formData.colors.map((color, index) => (
              <div key={index} className="flex gap-2 items-end">
                <select
                  value={color.color}
                  onChange={(e) => updateColor(index, 'color', e.target.value)}
                  className={inputClass}
                >
                  {COLORS_LIST.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Stock"
                  value={color.stock}
                  onChange={(e) => updateColor(index, 'stock', e.target.value)}
                  min="0"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeColor(index)}
                  className="px-3 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tags</h3>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add tag (e.g., Premium, Best Seller)"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className={inputClass}
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-[#E5A93A] text-black rounded-lg hover:bg-[#d49830] transition"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1 bg-[#E5A93A]/20 text-[#8C6219] rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-[#E5A93A] text-black font-semibold rounded-lg hover:bg-[#d49830] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Product...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};
