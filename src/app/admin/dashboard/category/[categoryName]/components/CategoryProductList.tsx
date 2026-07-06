'use client';

import React, { useEffect, useState } from 'react';
import { Trash2, Edit, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getCachedProducts,
  setCachedProducts,
  removeProductFromCache,
} from '../../categoryCache';

interface Size {
  size: string;
  stock: number;
}

interface Color {
  color: string;
  stock: number;
}

interface Product {
  _id: string;
  title: string;
  price: number;
  discountPrice?: number;
  img: string;
  category: string;
  collection?: string;
  stock: number;
  sizes?: Size[];
  colors?: Color[];
  description?: string;
}

interface EditSize {
  size: string;
  stock: number;
}

interface EditColor {
  color: string;
  stock: number;
}

interface EditProductForm {
  title: string;
  description: string;
  price: string;
  discountPrice: string;
  stock: string;
  category: string;
  collection: string;
  img: string;
  sizes: EditSize[];
  colors: EditColor[];
}

interface CategoryProductListProps {
  categoryName: string;
  refreshKey: number;
  onProductsUpdated?: (products: Product[]) => void;
  initialProducts?: Product[];
}

export default function CategoryProductList({
  categoryName,
  refreshKey,
  onProductsUpdated,
  initialProducts = [],
}: CategoryProductListProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editValues, setEditValues] = useState<EditProductForm | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(initialProducts.length > 0);

  const decodedCategory = decodeURIComponent(categoryName);

  useEffect(() => {
    setProducts(initialProducts);
    setError(null);
    setHasInitialized(initialProducts.length > 0);
  }, [initialProducts]);

  useEffect(() => {
    // Try to use cached products first to avoid repeated DB hits
    const cached = getCachedProducts(decodedCategory);
    if (cached && cached.length > 0 && refreshKey === 0) {
      setProducts(cached);
      onProductsUpdated?.(cached);
      setHasInitialized(true);
      return;
    }

    // Fetch when no cache exists, or when refresh is requested
    if (!hasInitialized || refreshKey > 0) {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, categoryName]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/products?category=${encodeURIComponent(decodedCategory)}&page=1&limit=100&sort=newest`
      );
      const data = await response.json();
      const productsData = Array.isArray(data?.data?.products)
        ? data.data.products.map((item: any) => ({
            _id: item._id?.toString?.() ?? String(item._id),
            title: item.title || item.name || 'Untitled product',
            name: item.name || item.title || 'Untitled product',
            price: Number(item.price || 0),
            discountPrice: item.discountPrice != null ? Number(item.discountPrice) : undefined,
            img: item.img || (Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : ''),
            images: Array.isArray(item.images) ? item.images : [],
            category: item.category || '',
            stock: Number(item.stock ?? 0),
            description: item.description || '',
            collection: item.collection || '',
            sizes: Array.isArray(item.sizes)
              ? item.sizes.map((s: any) => ({ size: s.size, stock: s.stock }))
              : [],
            colors: Array.isArray(item.colors)
              ? item.colors.map((c: any) => ({ color: c.color, stock: c.stock }))
              : [],
          }))
        : [];

      if (productsData.length >= 0) {
        setProducts(productsData);
        // persist in cache so we don't reload repeatedly
        setCachedProducts(decodedCategory, productsData);
        onProductsUpdated?.(productsData);
        setError(null);
      } else {
        setError('Failed to load products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
      setHasInitialized(true);
    }
  };

  const formatNumericValue = (value: number) =>
    value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditValues({
      title: product.title,
      description: product.description || '',
      price: String(product.price ?? 0),
      discountPrice: product.discountPrice != null ? String(product.discountPrice) : '',
      stock: String(product.stock ?? 0),
      category: product.category || '',
      collection: product.collection || '',
      img: product.img || '',
      sizes: product.sizes && product.sizes.length > 0 ? product.sizes : [{ size: 'Free Size', stock: product.stock ?? 0 }],
      colors: product.colors && product.colors.length > 0 ? product.colors : [{ color: 'Default', stock: product.stock ?? 0 }],
    });
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    setEditValues(null);
  };

  const handleEditValueChange = (
    field: keyof Omit<EditProductForm, 'sizes' | 'colors'>,
    value: string
  ) => {
    setEditValues((prev) =>
      prev ? { ...prev, [field]: value } : prev
    );
  };

  const updateSizeRow = (index: number, field: keyof EditSize, value: string) => {
    setEditValues((prev) => {
      if (!prev) return prev;
      const sizes = prev.sizes.map((item, rowIndex) =>
        rowIndex === index ? { ...item, [field]: field === 'stock' ? Number(value) : value } : item
      );
      return { ...prev, sizes };
    });
  };

  const updateColorRow = (index: number, field: keyof EditColor, value: string) => {
    setEditValues((prev) => {
      if (!prev) return prev;
      const colors = prev.colors.map((item, rowIndex) =>
        rowIndex === index ? { ...item, [field]: field === 'stock' ? Number(value) : value } : item
      );
      return { ...prev, colors };
    });
  };

  const addSizeRow = () => {
    setEditValues((prev) =>
      prev
        ? { ...prev, sizes: [...prev.sizes, { size: '', stock: 0 }] }
        : prev
    );
  };

  const addColorRow = () => {
    setEditValues((prev) =>
      prev
        ? { ...prev, colors: [...prev.colors, { color: '', stock: 0 }] }
        : prev
    );
  };

  const removeSizeRow = (index: number) => {
    setEditValues((prev) =>
      prev
        ? { ...prev, sizes: prev.sizes.filter((_, idx) => idx !== index) }
        : prev
    );
  };

  const removeColorRow = (index: number) => {
    setEditValues((prev) =>
      prev
        ? { ...prev, colors: prev.colors.filter((_, idx) => idx !== index) }
        : prev
    );
  };

  const handleSaveEdit = async () => {
    if (!editingProduct || !editValues) return;

    const payload = {
      name: editValues.title,
      description: editValues.description,
      price: Number(editValues.price || 0),
      discountPrice: editValues.discountPrice ? Number(editValues.discountPrice) : undefined,
      category: editValues.category,
      collection: editValues.collection,
      img: editValues.img,
      sizes: editValues.sizes
        .map((size) => ({ size: String(size.size).trim(), stock: Number(size.stock || 0) }))
        .filter((item) => item.size),
      colors: editValues.colors
        .map((color) => ({ color: String(color.color).trim(), stock: Number(color.stock || 0) }))
        .filter((item) => item.color),
      stock: Number(editValues.stock || 0),
    };

    setEditSaving(true);
    try {
      const response = await fetch(`/api/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to update product');
      }

      const updatedProduct = {
        ...editingProduct,
        title: payload.name,
        description: payload.description,
        price: payload.price,
        discountPrice: payload.discountPrice,
        category: payload.category,
        collection: payload.collection,
        img: payload.img,
        stock: payload.stock,
        sizes: payload.sizes,
        colors: payload.colors,
      };

      const updatedProducts = products.map((item) =>
        item._id === updatedProduct._id ? updatedProduct : item
      );
      setProducts(updatedProducts);
      onProductsUpdated?.(updatedProducts);
      toast.success('Product updated successfully');
      closeEditModal();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(error instanceof Error ? error.message : 'Error updating product');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    setDeletingId(productId);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Product deleted successfully');
        setProducts((prev) => prev.filter((p) => p._id !== productId));
        removeProductFromCache(decodedCategory, productId);
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error deleting product');
    } finally {
      setDeletingId(null);
    }
  };

  // Note: loading state is tracked but no spinner is shown per requirements.

  if (error && products.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          Products ({products.length})
        </h3>
      </div>

      {/* Table */}
      {products.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Product ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Color
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} className="border-b border-gray-200 hover:bg-gray-50">
                  {/* Product ID */}
                  <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                    {product._id.substring(0, 8)}...
                  </td>

                  {/* Image */}
                  <td className="px-6 py-4">
                    {product.img ? (
                      <img
                        src={product.img}
                        alt={product.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </td>

                  {/* Title */}
                  <td className="px-6 py-4 text-sm text-gray-800">
                    <span className="truncate block max-w-xs">{product.title}</span>
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                    {formatNumericValue(product.price)}
                  </td>

                  {/* Size */}
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {product.sizes && product.sizes.length > 0 ? (
                      <div className="space-y-1">
                        {product.sizes.map((size, idx) => (
                          <div key={idx} className="text-xs bg-blue-50 px-2 py-1 rounded">
                            {size.size}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>

                  {/* Color */}
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {product.colors && product.colors.length > 0 ? (
                      <div className="space-y-1">
                        {product.colors.map((color, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded border border-gray-300"
                              style={{
                                backgroundColor: color.color.toLowerCase() === 'black' ? '#000' :
                                  color.color.toLowerCase() === 'white' ? '#fff' :
                                  color.color.toLowerCase() === 'red' ? '#ef4444' :
                                  color.color.toLowerCase() === 'blue' ? '#3b82f6' :
                                  color.color.toLowerCase() === 'green' ? '#22c55e' :
                                  color.color.toLowerCase() === 'yellow' ? '#eab308' :
                                  color.color.toLowerCase() === 'pink' ? '#ec4899' :
                                  '#d1d5db'
                              }}
                            />
                            <span className="text-xs">{color.color}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>

                  {/* Stock */}
                  <td className="px-6 py-4 text-sm font-medium">
                    <span className={product.stock > 0 ? 'text-green-700' : 'text-red-700'}>
                      {product.stock}
                    </span>
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4 text-sm text-gray-700 capitalize">
                    {product.category}
                  </td>

                  {/* Discount */}
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {product.discountPrice ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-green-700">
                          {formatNumericValue(product.discountPrice)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {product.price > 0
                            ? `${(((product.price - product.discountPrice) / product.price) * 100).toFixed(0)}% off`
                            : ''}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(product)}
                      className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-900"
                      title="Edit product"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product._id)}
                      disabled={deletingId === product._id}
                      className="inline-flex items-center gap-2 text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center">
          <p className="text-gray-500">No products found for this category</p>
        </div>
      )}

      {editingProduct && editValues && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Edit Product</h2>
                <p className="text-sm text-gray-500">Update the product details below.</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className="text-gray-700">Title</span>
                <input
                  value={editValues.title}
                  onChange={(e) => handleEditValueChange('title', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </label>

              <label className="block text-sm">
                <span className="text-gray-700">Category</span>
                <input
                  value={editValues.category}
                  onChange={(e) => handleEditValueChange('category', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </label>

              <label className="block text-sm">
                <span className="text-gray-700">Collection</span>
                <input
                  value={editValues.collection}
                  onChange={(e) => handleEditValueChange('collection', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </label>

              <label className="block text-sm">
                <span className="text-gray-700">Image URL</span>
                <input
                  value={editValues.img}
                  onChange={(e) => handleEditValueChange('img', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </label>

              <label className="block text-sm">
                <span className="text-gray-700">Price</span>
                <input
                  type="number"
                  step="0.01"
                  value={editValues.price}
                  onChange={(e) => handleEditValueChange('price', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </label>

              <label className="block text-sm">
                <span className="text-gray-700">Discount Price</span>
                <input
                  type="number"
                  step="0.01"
                  value={editValues.discountPrice}
                  onChange={(e) => handleEditValueChange('discountPrice', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </label>

              <label className="block text-sm md:col-span-2">
                <span className="text-gray-700">Description</span>
                <textarea
                  value={editValues.description}
                  onChange={(e) => handleEditValueChange('description', e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </label>

              <label className="block text-sm">
                <span className="text-gray-700">Stock</span>
                <input
                  type="number"
                  value={editValues.stock}
                  onChange={(e) => handleEditValueChange('stock', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </label>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">Sizes</span>
                  <button
                    type="button"
                    onClick={addSizeRow}
                    className="text-sm text-amber-700 hover:text-amber-900"
                  >
                    Add size
                  </button>
                </div>
                <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  {editValues.sizes.map((size, index) => (
                    <div key={index} className="grid gap-3 sm:grid-cols-[1fr_auto] items-center">
                      <input
                        value={size.size}
                        onChange={(e) => updateSizeRow(index, 'size', e.target.value)}
                        placeholder="Size label"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={String(size.stock)}
                          onChange={(e) => updateSizeRow(index, 'stock', e.target.value)}
                          className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeSizeRow(index)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">Colors</span>
                  <button
                    type="button"
                    onClick={addColorRow}
                    className="text-sm text-amber-700 hover:text-amber-900"
                  >
                    Add color
                  </button>
                </div>
                <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  {editValues.colors.map((color, index) => (
                    <div key={index} className="grid gap-3 sm:grid-cols-[1fr_auto] items-center">
                      <input
                        value={color.color}
                        onChange={(e) => updateColorRow(index, 'color', e.target.value)}
                        placeholder="Color label"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={String(color.stock)}
                          onChange={(e) => updateColorRow(index, 'stock', e.target.value)}
                          className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeColorRow(index)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={editSaving}
                className="rounded-full bg-amber-700 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {editSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
