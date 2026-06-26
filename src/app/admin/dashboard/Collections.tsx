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
  images?: string[];
  tags?: string[];
  tag?: string;
  stock: number;
  sizes?: Array<{ size: string; stock: number }>;
}

interface CollectionsProps {
  collections?: Collection[];
  totalItems?: number;
  onUpdate?: () => Promise<void>;
  isLoading?: boolean;
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
  totalItems,
  onUpdate,
  isLoading = false,
  initialSection = 'new-arrival',
  componentTitle = 'Home',
  showAllSections = false,
}) => {
  const [localCollections, setLocalCollections] = useState<Collection[]>(collections);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySection, setDisplaySection] = useState(initialSection);
  const showSectionTabs = !showAllSections;
  const [showForm, setShowForm] = useState(false);
  const [placement, setPlacement] = useState<'home' | 'collection'>('home');
  const [isLoadingData, setIsLoadingData] = useState(Boolean(isLoading && collections.length === 0));
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
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
    setLocalCollections(collections);
  }, [collections]);

  useEffect(() => {
    setIsLoadingData(Boolean(isLoading && collections.length === 0));
  }, [isLoading, collections.length]);

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

  const visibleCollections = useMemo(() => filteredCollections, [filteredCollections]);


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const readFilesAsDataURLs = async (files: File[]) => {
    return await Promise.all(
      files.map(
        file =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(new Error('Unable to read file'));
              }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          })
      )
    );
  };

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setPrice('');
    setStock('10');
    setDescription('');
    setBadge('');
    setDetailDescription('');
    setImagePreview(null);
    setDetailImages([]);
    setDetailPreviews([]);
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

  const handleSectionChange = async (item: Collection, newSection: string) => {
    if (item.collection === newSection) return;
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`/api/collections/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection: newSection, tags: [sections.find(s => s.id === newSection)?.label || newSection] }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Section update failed');
      setLocalCollections(prev => prev.map(prevItem => (prevItem._id === result._id ? result : prevItem)));
      setSuccessMessage(`Updated section for "${result.title}".`);
      if (onUpdate) await onUpdate();
      setTimeout(() => setSuccessMessage(''), 2500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update section.');
    } finally {
      setLoading(false);
    }
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

    const detailImageUrls = detailImages.length > 0 ? await readFilesAsDataURLs(detailImages) : [];
    const images = [imagePreview, ...detailImageUrls].filter(Boolean);

    const selectedCollection = placement === 'collection' ? 'our-collection' : displaySection;
    const selectedTag = placement === 'collection' ? 'Our Collection' : sections.find(s => s.id === selectedCollection)?.label || '';

    const productData = {
      title,
      description,
      price: parseFloat(price),
      category,
      img: imagePreview,
      images,
      collection: selectedCollection,
      tags: [selectedTag, badge].filter(Boolean),
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
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:grid-cols-4">
            <div className="col-span-1 md:col-span-3 lg:col-span-4 p-7 rounded-2xl bg-gradient-to-br from-[#E5A93A] to-[#8C6219] text-black shadow-[0_10px_30px_rgba(229,169,58,0.2)] flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <Package className="w-10 h-10 opacity-90" />
                <span className="bg-black/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">Live Database</span>
              </div>
              <div className="mt-6">
                <h3 className="text-4xl font-black leading-none">{filteredCollections.length}</h3>
                <p className="text-xs uppercase tracking-[0.2em] font-bold mt-1 opacity-80">Total Inventory Items</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                <label className="space-y-2 text-sm">
                  <span className="text-neutral-400 uppercase tracking-[0.2em] text-[10px]">Product Placement</span>
                  <select
                    value={placement}
                    onChange={e => setPlacement(e.target.value as 'home' | 'collection')}
                    className="w-full bg-[#111] border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none"
                  >
                    <option value="home">Home Page</option>
                    <option value="collection">Collection Page</option>
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

{/* Details Upload */}
<label className="space-y-2 text-sm md:col-span-2">
  <span className="text-neutral-400 uppercase tracking-[0.2em] text-[10px]">Details (Additional photos)</span>
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
      <img key={index} src={src} alt={`Detail preview ${index + 1}`} className="w-full h-20 rounded-lg object-cover border border-neutral-800" />
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

          <div className="overflow-x-auto rounded-3xl border border-neutral-800 bg-[#111] p-4">
            {visibleCollections.length > 0 ? (
              <table className="min-w-full border-collapse text-left text-sm text-white">
                <thead>
                  <tr className="border-b border-neutral-800 text-[10px] uppercase tracking-[0.3em] text-neutral-400">
                    <th className="px-4 py-3">Image</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Section</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCollections.map(item => (
                    <tr key={item._id} className="border-b border-neutral-800 hover:bg-white/5">
                      <td className="px-4 py-4 align-middle">
                        <img src={item.img} alt={item.title} className="h-16 w-16 rounded-2xl object-cover" />
                      </td>
                      <td className="px-4 py-4 align-middle font-semibold text-white">{item.title}</td>
                      <td className="px-4 py-4 align-middle text-[#E5A93A]">${item.price}</td>
                      <td className="px-4 py-4 align-middle text-neutral-400 truncate max-w-[300px]">{item.description || '-'}</td>
                      <td className="px-4 py-4 align-middle">
                        <select
                          value={item.collection || 'our-collection'}
                          onChange={e => handleSectionChange(item, e.target.value)}
                          className="w-full bg-[#111] border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none"
                        >
                          {sections.map(sec => (
                            <option key={sec.id} value={sec.id}>{sec.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4 align-middle flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(item)}
                          className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-[#E5A93A] transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          className="rounded-full bg-black/70 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-red-500/90 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-32 text-center">
                <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-neutral-700" />
                </div>
                <h3 className="text-white font-bold mb-2">No Products in {sections.find(s => s.id === displaySection)?.label}</h3>
                <p className="text-neutral-500 text-sm max-w-xs mx-auto">Either try switching tabs or add a brand new item here.</p>
              </div>
            )}
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
