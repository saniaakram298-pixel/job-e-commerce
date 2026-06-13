"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Package, Eye, Pencil, Trash2 } from 'lucide-react';

export interface Collection {
  _id: string;
  title: string;
  description?: string;
  price: number;
  collection?: string;
  category: string;
  img: string;
  tags?: string[];
  tag?: string;
  stock: number;
  sizes?: Array<{ size: string; stock: number }>;
}

interface CollectionsProps {
  collections?: Collection[];
  onUpdate?: () => Promise<void>;
  initialSection?: string;
  componentTitle?: string;
  showAllSections?: boolean;
}

interface EditPayload {
  title: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  collection: string;
  tags: string;
}

export const Home: React.FC<CollectionsProps> = ({
  collections = [],
  onUpdate,
  initialSection = 'new-arrival',
  componentTitle = 'Home',
  showAllSections = false,
}) => {
  const [localCollections, setLocalCollections] = useState<Collection[]>(collections);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySection, setDisplaySection] = useState(initialSection);
  const showSectionTabs = !showAllSections;
  const [showForm, setShowForm] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stock, setStock] = useState('10');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Collection | null>(null);
  const [editPayload, setEditPayload] = useState<EditPayload | null>(null);
  const [detailDescription, setDetailDescription] = useState('');
const [detailImages, setDetailImages] = useState<File[]>([]); // Multiple files
const [detailPreviews, setDetailPreviews] = useState<string[]>([]);

  const categories = [
    'bridal',
    'groom',
    'formal',
    'informal',
    'children',
    'men',
    'women',
    'old-people',
    'young',
    'accessories',
  ];

  const sections = [
    { id: 'new-arrival', label: 'New Arrival' },
    { id: 'best-seller', label: 'Best Sellers' },
    { id: 'our-collection', label: 'Our Collection' },
  ];

  useEffect(() => {
    if (collections.length > 0) {
      setLocalCollections(collections);
      setIsLoadingData(false);
      return;
    }
  }, [collections]);

  const fetchCollections = async (pageNumber: number = 1) => {
    try {
      setIsLoadingData(true);
      const response = await fetch(`/api/collections?page=${pageNumber}&limit=${limit}`, { cache: 'no-store' });
      const data = await response.json();
      if (response.ok && Array.isArray(data.collections)) {
        setLocalCollections(data.collections);
        setTotalCount(data.pagination?.total || 0);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        console.error('Failed to fetch collections:', data);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (collections.length === 0) {
      fetchCollections(page);
    }
  }, [collections.length, page]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach(cat => {
      counts[cat] = localCollections.filter(item => item.category?.toLowerCase() === cat.toLowerCase()).length;
    });
    return counts;
  }, [localCollections]);

  const filteredCollections = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return localCollections.filter(item => {
      const itemCollection = (item.collection || item.tag || '').toLowerCase().replace(/\s+/g, '-');
      if (!showAllSections && itemCollection !== displaySection) return false;

      if (!normalizedSearch) return true;

      const searchText = [
        item.title,
        item.description,
        item.category,
        item.collection,
        ...(item.tags ?? (item.tag ? [item.tag] : [])),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchText.includes(normalizedSearch);
    });
  }, [localCollections, searchTerm, displaySection]);

  const visibleCollections = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredCollections.slice(startIndex, startIndex + limit);
  }, [filteredCollections, page, limit]);

  useEffect(() => {
    const pages = Math.max(1, Math.ceil(filteredCollections.length / limit));
    setTotalPages(pages);
    setTotalCount(filteredCollections.length);
    setPage(prevPage => Math.min(prevPage, pages));
  }, [filteredCollections, limit]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setPrice('');
    setStock('10');
    setDescription('');
    setBadge('');
    setImagePreview(null);
    setErrorMessage('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this product permanently?')) return;
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Delete failed');
      setLocalCollections(prev => prev.filter(item => item._id !== id));
      setTotalCount(prev => Math.max(0, prev - 1));
      setSuccessMessage('Product deleted successfully.');
      if (onUpdate) await onUpdate();
      setTimeout(() => setSuccessMessage(''), 2500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to delete product.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updatedProduct: Collection) => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`/api/collections/${updatedProduct._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Update failed');
      setLocalCollections(prev => prev.map(item => (item._id === result._id ? result : item)));
      setSuccessMessage(`Updated "${result.title}" successfully.`);
      setEditingItem(null);
      setEditPayload(null);
      if (onUpdate) await onUpdate();
      setTimeout(() => setSuccessMessage(''), 2500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update product.');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (item: Collection) => {
    setEditingItem(item);
    setEditPayload({
      title: item.title,
      description: item.description || '',
      price: String(item.price || 0),
      stock: String(item.stock || 0),
      category: item.category,
      collection: item.collection || displaySection,
      tags: (item.tags || (item.tag ? [item.tag] : [])).join(', '),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editPayload) return;
    const updatedItem: Collection = {
      ...editingItem,
      title: editPayload.title,
      description: editPayload.description,
      price: Number(editPayload.price) || 0,
      stock: Number(editPayload.stock) || 0,
      category: editPayload.category,
      collection: editPayload.collection,
      tags: editPayload.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    };
    await handleUpdate(updatedItem);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    if (!title.trim() || !category || !price || !imagePreview) {
      setErrorMessage('Please fill all required fields and upload an image.');
      setLoading(false);
      return;
    }

    const productData = {
      title,
      description,
      price: parseFloat(price),
      category,
      img: imagePreview,
      collection: displaySection,
      tags: [sections.find(s => s.id === displaySection)?.label || '', badge].filter(Boolean),
      stock: Number(stock) || 10,
      sizes: [{ size: 'Free Size', stock: Number(stock) || 10 }],
    };

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save product');

      setLocalCollections(prev => [result, ...prev]);
      setTotalCount(prev => prev + 1);
      setSuccessMessage(`✓ "${title}" added successfully!`);
      resetForm();
      setShowForm(false);
      if (onUpdate) await onUpdate();
      setTimeout(() => setSuccessMessage(''), 2500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-6 bg-black min-h-screen text-white">
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">Admin</p>
        <h1 className="text-4xl font-black">{componentTitle}</h1>
        <p className="max-w-2xl text-sm text-neutral-400">
          Manage the items that should appear in the {componentTitle === 'Home' ? 'homepage sections' : 'frontend collection module'}.
        </p>
      </div>
      {isLoadingData ? (
        <div className="text-center py-20 text-neutral-500">Loading your inventory...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
            <div className="col-span-2 p-7 rounded-2xl bg-gradient-to-br from-[#E5A93A] to-[#8C6219] text-black shadow-[0_10px_30px_rgba(229,169,58,0.2)] flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <Package className="w-10 h-10 opacity-90" />
                <span className="bg-black/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">Live Database</span>
              </div>
              <div className="mt-6">
                <h3 className="text-4xl font-black leading-none">{localCollections.length}</h3>
                <p className="text-xs uppercase tracking-[0.2em] font-bold mt-1 opacity-80">Total Inventory Items</p>
              </div>
            </div>

            {categories.map(cat => (
              <div key={cat} className="p-5 rounded-2xl border border-neutral-800 bg-[#121212] hover:bg-[#181818] hover:border-[#E5A93A] transition-all group cursor-default">
                <p className="text-[9px] text-neutral-500 uppercase tracking-widest mb-2 font-bold group-hover:text-[#E5A93A]">{cat}</p>
                <div className="flex items-baseline gap-1">
                  <h4 className="text-2xl font-semibold text-white">{stats[cat] || 0}</h4>
                  <span className="text-[10px] text-neutral-600 font-bold uppercase">Items</span>
                </div>
              </div>
            ))}
          </div>

          {showSectionTabs ? (
            <div className="flex border-b border-neutral-800 gap-6">
              {sections.map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setDisplaySection(sec.id)}
                  className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${displaySection === sec.id ? 'text-[#E5A93A]' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  {sec.label}
                  {displaySection === sec.id && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E5A93A] animate-in fade-in duration-300" />}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-[#111] p-5 rounded-2xl border border-neutral-800/50 shadow-inner">
              <div>
                <p className="text-xs uppercase tracking-widest text-neutral-500">All collection items</p>
                <h2 className="text-lg font-semibold text-white">Collection overview</h2>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#111] p-5 rounded-2xl border border-neutral-800/50 shadow-inner">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600" />
              <input
                type="text"
                placeholder="Search current selection..."
                className="w-full bg-[#050505] border border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E5A93A]/20 focus:border-[#E5A93A] transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              onClick={() => setShowForm(prev => !prev)}
              className="w-full md:w-auto flex items-center justify-center gap-3 bg-[#E5A93A] hover:bg-[#ffbf42] text-black px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-[#E5A93A]/10"
            >
              <Plus className={`w-4 h-4 transition-transform duration-300 ${showForm ? 'rotate-45' : ''}`} />
              {showForm ? 'Cancel Entry' : 'Add Inside Current Block'}
            </button>
          </div>

          {showForm && (
            <form className="p-8 rounded-3xl bg-[#0B0B0B] border border-neutral-800 shadow-lg" onSubmit={handleSubmit}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold">Add product to {componentTitle === 'Home' ? sections.find(s => s.id === displaySection)?.label : componentTitle}</h3>
                  <p className="text-sm text-neutral-400">New items are saved directly to MongoDB and shown in the {componentTitle === 'Home' ? 'homepage sections' : 'Collection module'}.</p>
                </div>
                <span className="text-sm text-neutral-500 uppercase tracking-[0.3em]">Current section</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm">
                  <span className="text-neutral-400 uppercase tracking-[0.2em] text-[10px]">Title</span>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-[#111] border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-neutral-400 uppercase tracking-[0.2em] text-[10px]">Price</span>
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full bg-[#111] border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-neutral-400 uppercase tracking-[0.2em] text-[10px]">Stock</span>
                  <input
                    type="number"
                    value={stock}
                    onChange={e => setStock(e.target.value)}
                    className="w-full bg-[#111] border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-neutral-400 uppercase tracking-[0.2em] text-[10px]">Category</span>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-[#111] border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm md:col-span-2">
                  <span className="text-neutral-400 uppercase tracking-[0.2em] text-[10px]">Tags</span>
                  <input
                    value={badge}
                    onChange={e => setBadge(e.target.value)}
                    placeholder="Optional tags, comma-separated"
                    className="w-full bg-[#111] border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm md:col-span-2">
                  <span className="text-neutral-400 uppercase tracking-[0.2em] text-[10px]">Description</span>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-[#111] border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none resize-none"
                  />
                </label>
                <label className="space-y-2 text-sm md:col-span-2">
                  <span className="text-neutral-400 uppercase tracking-[0.2em] text-[10px]">Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full text-sm text-white file:bg-[#E5A93A] file:border-0 file:px-4 file:py-2 file:rounded-full file:text-black"
                  />
                  {imagePreview && <img src={imagePreview} alt="Preview" className="mt-3 w-full rounded-2xl border border-neutral-800 object-cover max-h-52" />}
                </label>
                {/* Detail Description */}
<label className="space-y-2 text-sm md:col-span-2">
  <span className="text-neutral-400 uppercase tracking-[0.2em] text-[10px]">Detail Description (Optional)</span>
  <textarea
    value={detailDescription}
    onChange={e => setDetailDescription(e.target.value)}
    rows={4}
    className="w-full bg-[#111] border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none resize-none"
  />
</label>

{/* Multiple Images Upload */}
<label className="space-y-2 text-sm md:col-span-2">
  <span className="text-neutral-400 uppercase tracking-[0.2em] text-[10px]">Product Gallery (Multiple Images)</span>
  <input
    type="file"
    multiple
    accept="image/*"
    onChange={(e) => {
      if (e.target.files) {
        const filesArray = Array.from(e.target.files);
        setDetailImages(filesArray);
        setDetailPreviews(filesArray.map(file => URL.createObjectURL(file)));
      }
    }}
    className="w-full text-sm text-white file:bg-[#E5A93A] file:border-0 file:px-4 file:py-2 file:rounded-full file:text-black"
  />
  <div className="grid grid-cols-4 gap-2 mt-3">
    {detailPreviews.map((src, index) => (
      <img key={index} src={src} alt={`Preview ${index}`} className="w-full h-20 rounded-lg object-cover border border-neutral-800" />
    ))}
  </div>
</label>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-[#E5A93A] text-black font-bold uppercase text-xs tracking-[0.3em] transition hover:bg-[#ffbf42] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Save product
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-6 py-3 rounded-xl border border-neutral-700 text-sm uppercase tracking-[0.2em] text-neutral-300 hover:border-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {editingItem && editPayload && (
            <div className="p-8 rounded-3xl bg-[#0B0B0B] border border-neutral-800 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold">Edit: {editingItem.title}</h3>
                  <p className="text-sm text-neutral-400">Update fields and save to persist changes immediately.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setEditPayload(null);
                  }}
                  className="text-sm uppercase tracking-[0.3em] text-neutral-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm">
                  <span className="text-neutral-400 uppercase tracking-[0.2em] text-[10px]">Title</span>
                  <input
                    value={editPayload.title}
                    onChange={e => setEditPayload({ ...editPayload, title: e.target.value })}
                    className="w-full bg-[#111] border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-neutral-400 uppercase tracking-[0.2em] text-[10px]">Price</span>
                  <input
                    type="number"
                    value={editPayload.price}
                    onChange={e => setEditPayload({ ...editPayload, price: e.target.value })}
                    className="w-full bg-[#111] border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-neutral-400 uppercase tracking-[0.2em] text-[10px]">Stock</span>
                  <input
                    type="number"
                    value={editPayload.stock}
                    onChange={e => setEditPayload({ ...editPayload, stock: e.target.value })}
                    className="w-full bg-[#111] border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-neutral-400 uppercase tracking-[0.2em] text-[10px]">Collection</span>
                  <select
                    value={editPayload.collection}
                    onChange={e => setEditPayload({ ...editPayload, collection: e.target.value })}
                    className="w-full bg-[#111] border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none"
                  >
                    {sections.map(sec => (
                      <option key={sec.id} value={sec.id}>{sec.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm md:col-span-2">
                  <span className="text-neutral-400 uppercase tracking-[0.2em] text-[10px]">Category</span>
                  <select
                    value={editPayload.category}
                    onChange={e => setEditPayload({ ...editPayload, category: e.target.value })}
                    className="w-full bg-[#111] border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm md:col-span-2">
                  <span className="text-neutral-400 uppercase tracking-[0.2em] text-[10px]">Tags</span>
                  <input
                    value={editPayload.tags}
                    onChange={e => setEditPayload({ ...editPayload, tags: e.target.value })}
                    placeholder="comma-separated tags"
                    className="w-full bg-[#111] border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm md:col-span-2">
                  <span className="text-neutral-400 uppercase tracking-[0.2em] text-[10px]">Description</span>
                  <textarea
                    value={editPayload.description}
                    onChange={e => setEditPayload({ ...editPayload, description: e.target.value })}
                    rows={3}
                    className="w-full bg-[#111] border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none resize-none"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-[#E5A93A] text-black font-bold uppercase text-xs tracking-[0.3em] transition hover:bg-[#ffbf42] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Save changes
                </button>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setEditPayload(null);
                  }}
                  className="px-6 py-3 rounded-xl border border-neutral-700 text-sm uppercase tracking-[0.2em] text-neutral-300 hover:border-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {successMessage && (
              <div className="rounded-2xl bg-green-500/10 border border-green-500/30 p-4 text-green-200">{successMessage}</div>
            )}
            {errorMessage && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-red-200">{errorMessage}</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleCollections.length > 0 ? (
              visibleCollections.map(item => (
                <div key={item._id} className="relative h-[400px] rounded-[2rem] overflow-hidden border border-neutral-800 bg-[#111] group transition-all hover:border-[#E5A93A]/50">
                  <img src={item.img} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-40 transition duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>

                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    {(item.tags || (item.tag ? [item.tag] : [])).filter(Boolean).map((t, idx) => (
                      <span key={idx} className="bg-[#E5A93A] text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter w-fit">
                        {t}
                      </span>
                    ))}
                    <span className="bg-white/5 backdrop-blur-md border border-white/10 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest w-fit">
                      {item.category}
                    </span>
                  </div>

                  <div className="absolute top-6 right-6 flex items-center gap-2">
                    <button
                      onClick={() => startEditing(item)}
                      className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-[#E5A93A] transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="rounded-full bg-black/70 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-red-500/90 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="absolute top-6 right-6">
                    <p className="text-[#E5A93A] text-xl font-bold font-mono tracking-tighter">${item.price}</p>
                  </div>

                  <div className="absolute bottom-8 left-8 right-8">
                    <h4 className="text-2xl font-light text-white tracking-wide uppercase mb-4 group-hover:text-[#E5A93A] transition-colors">{item.title}</h4>
                    <div className="flex items-center justify-between translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 border-t border-white/10 pt-4">
                      <div className="flex flex-col">
                        <p className="text-[10px] text-neutral-500 uppercase font-bold">In Stock</p>
                        <p className="text-white font-mono">{item.stock}</p>
                      </div>
                      <button className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors">
                        <Eye className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-32 text-center border-2 border-dashed border-neutral-900 rounded-[3rem] bg-[#080808]">
                <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-neutral-700" />
                </div>
                <h3 className="text-white font-bold mb-2">No Products in {sections.find(s => s.id === displaySection)?.label}</h3>
                <p className="text-neutral-500 text-sm max-w-xs mx-auto">Either try switching tabs or add a brand new item here.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 items-center justify-between rounded-3xl border border-neutral-800 bg-[#080808] p-5 text-sm text-neutral-400 md:flex-row">
            <div>
              Showing <span className="font-semibold text-white">{visibleCollections.length}</span> of <span className="font-semibold text-white">{totalCount}</span> items
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="rounded-xl border border-neutral-700 px-4 py-2 text-xs uppercase tracking-[0.3em] transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-white">Page {page} / {totalPages}</span>
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
                className="rounded-xl border border-neutral-700 px-4 py-2 text-xs uppercase tracking-[0.3em] transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const Collection: React.FC<CollectionsProps> = (props) => (
  <Home
    {...props}
    initialSection="our-collection"
    componentTitle="Collection"
    showAllSections
  />
);
