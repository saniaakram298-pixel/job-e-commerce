# 📚 Extension Guide - Connect More Pages to MongoDB

This guide shows how to integrate other pages following the same pattern used for Home, Collections, and New Arrivals.

---

## 🔄 Integration Pattern (General Template)

All integrated pages follow this pattern:

### **1. Add State & Effects**
```tsx
const [data, setData] = useState<ItemType[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/collections');
      if (res.ok) {
        const allData = await res.json();
        // Filter by your category
        const filtered = allData.filter(item => item.category === 'your-category');
        // Map to your format
        const mapped = filtered.map(item => ({...}));
        setData(mapped);
      }
    } catch (error) {
      console.error('Error:', error);
      setData(defaultData);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, []);
```

### **2. Add Loading State in JSX**
```tsx
{loading ? (
  <div>Loading...</div>
) : data.length > 0 ? (
  data.map(item => (...))
) : (
  <div>No items found</div>
)}
```

---

## 🛍️ Cart Page Integration

**File**: `src/app/cart/page.tsx`

### **Current Status**: Uses localStorage
### **To Integrate**: Follow the pattern below

```tsx
// 1. Add state
const [cartItems, setCartItems] = useState<CartItem[]>([]);
const [loading, setLoading] = useState(true);

// 2. Fetch cart data from MongoDB
useEffect(() => {
  const fetchCartItems = async () => {
    try {
      const res = await fetch('/api/collections');
      if (res.ok) {
        const allItems = await res.json();
        // You can filter by multiple categories
        const cartCollections = allItems.filter(item => 
          ['collection', 'new-arrival', 'archive'].includes(item.category)
        );
        setCartItems(cartCollections);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchCartItems();
}, []);

// 3. Use in JSX with loading check
{loading ? (
  <div>Loading cart...</div>
) : (
  cartItems.map(item => (
    <CartItem key={item._id} item={item} />
  ))
)}
```

---

## 💳 Checkout Page Integration

**File**: `src/app/checkout/page.tsx`

### **Current Status**: Likely uses cart state
### **To Integrate**: 

```tsx
// Use cart items from your cart context/state
// Or fetch specific items:

const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);

useEffect(() => {
  const fetchCheckoutItems = async () => {
    try {
      const res = await fetch('/api/collections');
      if (res.ok) {
        const items = await res.json();
        // Only show items with stock > 0
        const inStock = items.filter(item => item.stock > 0);
        const mapped = inStock.map(item => ({
          id: item._id,
          name: item.title,
          price: item.price || 0,
          quantity: 1,
          image: item.img
        }));
        setCheckoutItems(mapped);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  fetchCheckoutItems();
}, []);
```

---

## 📦 Products Page Integration

**File**: `src/app/products/page.tsx`

### **Current Status**: Likely hardcoded
### **To Integrate**:

```tsx
const [products, setProducts] = useState<Product[]>([]);
const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
const [loading, setLoading] = useState(true);
const [selectedCategory, setSelectedCategory] = useState('all');

useEffect(() => {
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/collections');
      if (res.ok) {
        const allData = await res.json();
        // Map collections to product format
        const productsData = allData.map(item => ({
          id: item._id,
          name: item.title,
          price: item.price || 450,
          category: item.category,
          image: item.img,
          stock: item.stock,
          description: item.description
        }));
        setProducts(productsData);
        setFilteredProducts(productsData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchProducts();
}, []);

// Handle category filter
const handleCategoryChange = (category: string) => {
  setSelectedCategory(category);
  if (category === 'all') {
    setFilteredProducts(products);
  } else {
    setFilteredProducts(products.filter(p => p.category === category));
  }
};

// In JSX
{loading ? (
  <div>Loading products...</div>
) : filteredProducts.length > 0 ? (
  filteredProducts.map(product => (
    <ProductCard key={product.id} product={product} />
  ))
) : (
  <div>No products found in {selectedCategory}</div>
)}
```

---

## 📖 Archive Page Integration

**File**: `src/app/archive/page.tsx` (if it exists)

### **Current Status**: Probably doesn't exist yet
### **To Create**:

```tsx
"use client";
import React, { useState, useEffect } from 'react';

interface ArchiveItem {
  id: string;
  title: string;
  tag: string;
  img: string;
  category: string;
}

export default function ArchivePage() {
  const [archiveItems, setArchiveItems] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArchive = async () => {
      try {
        const res = await fetch('/api/collections');
        if (res.ok) {
          const data = await res.json();
          // Filter only archive items
          const archive = data.filter((item: any) => item.category === 'archive');
          const mapped = archive.map((item: any) => ({
            id: item._id,
            title: item.title,
            tag: item.tag,
            img: item.img,
            category: item.category
          }));
          setArchiveItems(mapped);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArchive();
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <h1>Archive</h1>
      {loading ? (
        <div>Loading...</div>
      ) : archiveItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {archiveItems.map(item => (
            <div key={item.id}>
              <img src={item.img} alt={item.title} />
              <h3>{item.title}</h3>
              <p>{item.tag}</p>
            </div>
          ))}
        </div>
      ) : (
        <div>No archive items yet</div>
      )}
    </main>
  );
}
```

---

## 📰 Journal Page Integration

**File**: `src/app/journal/page.tsx`

### **Current Status**: Probably hardcoded or doesn't exist
### **To Create/Integrate**:

```tsx
"use client";
import React, { useState, useEffect } from 'react';

interface JournalEntry {
  id: string;
  title: string;
  tag: string;
  description: string;
  img: string;
  date: Date;
}

export default function JournalPage() {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJournal = async () => {
      try {
        const res = await fetch('/api/collections');
        if (res.ok) {
          const data = await res.json();
          // Filter journal entries
          const journal = data.filter((item: any) => item.category === 'journal');
          const mapped = journal.map((item: any) => ({
            id: item._id,
            title: item.title,
            tag: item.tag,
            description: item.description || 'Read more...',
            img: item.img,
            date: item.createdAt
          }));
          setJournalEntries(mapped);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJournal();
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <h1>The Journal</h1>
      {loading ? (
        <div>Loading articles...</div>
      ) : journalEntries.length > 0 ? (
        <div className="grid gap-8">
          {journalEntries.map(entry => (
            <article key={entry.id}>
              <img src={entry.img} alt={entry.title} />
              <h2>{entry.title}</h2>
              <p className="text-gray-500">{entry.tag}</p>
              <p>{entry.description}</p>
            </article>
          ))}
        </div>
      ) : (
        <div>No journal entries yet</div>
      )}
    </main>
  );
}
```

---

## 🔍 Search/Filter Examples

### **Search by Title**
```tsx
const [searchTerm, setSearchTerm] = useState('');

const filtered = data.filter(item => 
  item.title.toLowerCase().includes(searchTerm.toLowerCase())
);
```

### **Filter by Category & Price**
```tsx
const filtered = data.filter(item => 
  item.category === selectedCategory && 
  item.price <= maxPrice
);
```

### **Sort by Price**
```tsx
const sorted = [...data].sort((a, b) => a.price - b.price);
```

### **Paginate Results**
```tsx
const itemsPerPage = 12;
const [currentPage, setCurrentPage] = useState(1);

const paginated = data.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

const totalPages = Math.ceil(data.length / itemsPerPage);
```

---

## 🧠 Best Practices

### **Do's** ✅
- Always add loading states
- Always add fallback data
- Use try-catch for error handling
- Filter on the client side (already have all data)
- Memoize filter logic with useMemo
- Cache collections if fetching multiple times

### **Don'ts** ❌
- Don't fetch inside loops
- Don't re-fetch on every render
- Don't ignore loading states
- Don't mix hardcoded data with API data
- Don't forget error handling

---

## 💡 Advanced Patterns

### **Reusable Hook for Collections**
```tsx
// hooks/useCollections.ts
function useCollections(category?: string) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await fetch('/api/collections');
        const collections = await res.json();
        const filtered = category ? 
          collections.filter(c => c.category === category) : 
          collections;
        setData(filtered);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [category]);

  return { data, loading };
}

// Usage:
const { data: newArrivals, loading } = useCollections('new-arrival');
```

### **Context for Global Collections**
```tsx
// context/CollectionsContext.tsx
const CollectionsContext = React.createContext();

export function useCollections() {
  return useContext(CollectionsContext);
}

// Use in multiple pages without re-fetching
```

---

## 📊 Testing the Integrations

1. **Create test data in admin**:
   - Add items with each category
   - Verify stock levels
   
2. **Check each page**:
   - Home page shows new-arrivals
   - Collections shows all categories
   - New Arrivals shows only new-arrival
   - Editorial shows editorial items
   - Lookbook shows lookbook items
   
3. **Test filters**:
   - Search functionality
   - Category filters
   - Price ranges
   
4. **Check performance**:
   - Loading states appear
   - Data loads quickly
   - No errors in console

---

## 🎓 Summary

All pages follow the same pattern:
1. **Fetch** collections from `/api/collections`
2. **Filter** by category
3. **Map** to your data format
4. **Display** with loading states

You can now integrate any page using these templates! 🚀
