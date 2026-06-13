# Atelier Marketplace - Dynamic Category Data Flow Implementation

## Overview
This document outlines the complete implementation of dynamic data flow between the Admin Panel and Customer Landing Page in the Atelier marketplace. Products are automatically synchronized across the platform, grouping by category and displaying the latest items.

---

## 📋 Architecture

### Database Layer
**Model: `src/models/Product.ts`**
- Updated `ProductCategory` type with 11 categories:
  - `bridal`, `groom`, `formal`, `informal`, `children`
  - `men`, `women`, `old-people`, `young`, `new-arrival`, `accessories`
- Added indexes on `category`, `createdAt`, `featured`, and `active` fields for optimal query performance
- Timestamps (`createdAt`, `updatedAt`) automatically track when products are added/modified

### API Layer

#### 1. **Products Endpoint** (`/api/products`)
- **GET**: Fetch products with filtering and sorting
  - Query params: `category`, `page`, `limit`, `sort`, `featured`
  - Returns paginated results with pagination metadata
  
- **POST**: Create new products
  - Validates category against allowed types
  - Saves with timestamps automatically
  - Returns created product with `_id`

#### 2. **Category-Grouped Endpoint** (`/api/products/by-category`) ⭐
- **GET**: Fetch products grouped by category
  - Query params:
    - `grouped=true` (required)
    - `limit=10` (products per category, default: 10)
    - `categories=bridal,groom` (optional, filter specific categories)
  - Returns array of categories with products sorted by newest first
  - Perfect for landing page sections

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "category": "bridal",
      "name": "Bridal",
      "products": [
        {
          "_id": "...",
          "name": "Premium Bridal Dress",
          "price": 850,
          "images": ["url1"],
          "createdAt": "2025-05-14T10:30:00Z"
        }
        // ... up to 10 products, newest first
      ],
      "total": 5
    },
    // ... more categories
  ]
}
```

---

## 🧠 Data Flow Architecture

```
Admin Dashboard
    ↓
POST /api/products (with category, timestamps)
    ↓
MongoDB (saved with createdAt)
    ↓
GET /api/products/by-category?grouped=true
    ↓
Landing Page Components (DepartmentsWithData)
    ↓
Customer views latest products by category
    ↓
Click "View All" or category card
    ↓
Dynamic Route /collections/[category]
    ↓
Full category page with pagination
```

---

## 🔧 Key Implementation Files

### Utility Functions
**File: `src/lib/categoryData.ts`**

```typescript
// Fetch grouped products (for landing page)
const data = await fetchProductsByCategories();
// Returns: CategoryWithProducts[]

// Fetch specific category with pagination
const { products, total, pages } = await fetchProductsByCategory(
  'bridal',
  page=1,
  limit=20
);

// Client-side grouping utility
const grouped = groupAndLimitProducts(products, 10);

// Get category display names
const name = getCategoryDisplayName('bridal'); // "Bridal"
```

### Components

#### **DepartmentsWithData** (`src/components/DepartmentsWithData.tsx`)
- Replaces static `Departments` component
- Fetches data from `/api/products/by-category`
- Displays 10 latest products per category
- Shows product count per category
- Horizontal scroll galleries with hover effects
- Links to category detail pages: `/collections/[category]`

#### **Dynamic Category Page** (`src/collections/[category]/page.tsx`)
- Shows full product list for specific category
- Pagination support (20 items per page)
- Sort options: Newest, Price (Low/High), Trending
- Grid/List view toggle
- Links back to product detail pages

---

## 📝 Data Flow Examples

### Example 1: Admin Adds Product
```typescript
// Admin Form Submission
const productData = {
  name: "Premium Bridal Gown",
  description: "Elegant white bridal dress with lace details",
  price: 850,
  category: "bridal",           // Must be one of 11 categories
  images: ["base64_or_url"],
  sizes: [{ size: "XS", stock: 5 }],
  tags: ["Featured"],
  active: true
};

// POST to /api/products
// ✓ Saved to MongoDB with createdAt timestamp
// ✓ Category indexed for fast queries
```

### Example 2: Landing Page Display
```typescript
// Home Page uses DepartmentsWithData
// Component automatically fetches:
GET /api/products/by-category?grouped=true&limit=10

// Response groups all products:
{
  category: "bridal",
  products: [
    { name: "Premium Bridal Gown", createdAt: "2025-05-14T10:30:00Z" },
    { name: "Elegant Ceremony Dress", createdAt: "2025-05-14T09:15:00Z" },
    // ... up to 10 products, newest first
  ]
}

// Component renders horizontal scroll gallery
```

### Example 3: Customer Browsing Category
```typescript
// Customer clicks "View All" under Bridal section
// Navigates to: /collections/bridal

// Page fetches:
GET /api/products?category=bridal&page=1&limit=20&sort=newest

// Displays:
// - Full product grid with pagination
// - All bridal products (newest first)
// - Next/Previous buttons
```

---

## 🎯 Key Features

### ✅ Automatic Updates
- When admin adds product with category, it appears on landing page within seconds
- Newest products always shown first (`createdAt: -1` sort)
- No manual page refresh needed

### ✅ Performance Optimized
- MongoDB indexes on `category`, `createdAt`, `featured`, `active`
- `.lean()` queries for read-only operations
- Pagination on category pages (20 items per page)
- Limited to 10 latest per category on home page

### ✅ SEO & User Experience
- Dynamic routes for each category: `/collections/bridal`, `/collections/groom`, etc.
- Proper meta titles and descriptions
- Breadcrumb navigation
- Filter/sort options on category pages

### ✅ Scalability
- Easy to add new categories (update `ProductCategory` type)
- Infinite pagination on category pages
- Database indexes prevent slow queries

---

## 📚 Available Categories

| Category ID | Display Name | Admin Usage |
|-----------|-------------|------------|
| `bridal` | Bridal | Wedding dresses & groom wear |
| `groom` | Groom | Groom suits & formal wear |
| `formal` | Formal | Formal occasion dresses |
| `informal` | Informal | Casual & everyday wear |
| `children` | Children | Kids & children clothing |
| `men` | Men | Men's collection |
| `women` | Women | Women's collection |
| `old-people` | Old People | Senior fashion |
| `young` | Young | Youth fashion |
| `new-arrival` | New Arrivals | Latest additions |
| `accessories` | Accessories | Bags, shoes, jewelry |

---

## 🚀 How to Use

### Adding Products in Admin Dashboard
1. Navigate to `/admin/dashboard`
2. Fill product form:
   - **Title**: Product name
   - **Category**: Select from 11 categories
   - **Price**: Set price
   - **Description**: Product details
   - **Image**: Upload image
   - **Badge**: Optional (Sale, Bonus)
3. Click "Add to Collection"
4. Product automatically appears on landing page

### Viewing Products
**Landing Page (`/`)**
- Shows 10 latest products per category
- Horizontal scroll galleries
- "View All" link to category detail page

**Category Pages (`/collections/[category]`)**
- Full product list for category
- Pagination (20 per page)
- Sort & filter options
- Grid/List view toggle

---

## 🔌 API Reference

### Fetch Grouped Categories
```
GET /api/products/by-category?grouped=true&limit=10&categories=bridal,groom
```

### Fetch Single Category
```
GET /api/products?category=bridal&page=1&limit=20&sort=newest
```

### Create Product
```
POST /api/products
Content-Type: application/json

{
  "name": "Product Name",
  "description": "...",
  "price": 100,
  "category": "bridal",
  "collection": "bridal",
  "images": ["url_or_base64"],
  "sizes": [{ "size": "M", "stock": 5 }],
  "tags": ["Featured"],
  "active": true
}
```

---

## 🐛 Troubleshooting

### Products Not Showing on Landing Page
- Check category is valid (one of 11 categories)
- Verify product has `active: true`
- Check MongoDB connection in `/api/debug/setup`
- Ensure API response includes products in data.products array

### Slow Category Pages
- Check database has indexes: `category`, `createdAt`
- Verify pagination limit (20 items per page)
- Monitor MongoDB Atlas metrics

### Wrong Product Order
- Ensure products use `sort: { createdAt: -1 }` (newest first)
- Check product timestamps are set correctly

---

## 📊 Data Schema Summary

**Product Document:**
```typescript
{
  _id: ObjectId,
  name: string,
  description: string,
  price: number,
  discountPrice?: number,
  category: "bridal" | "groom" | ... (11 types),
  images: string[],
  tags: string[],
  featured: boolean,
  active: boolean,
  createdAt: Date,    // ← Auto-set, used for sorting
  updatedAt: Date     // ← Auto-updated
}
```

**Indexes:**
- `category` (ascending)
- `category + createdAt` (descending)
- `featured + createdAt` (for featured products)
- `active + category` (for active products query)

---

## ✨ Next Steps

### Optional Enhancements
1. **Add to Redis Cache**: Cache grouped categories for 5 minutes
2. **Image CDN**: Use Cloudinary/ImageKit for images
3. **Search**: Add full-text search on product names
4. **Filters**: Add price range, color, size filters on category pages
5. **Related Products**: Show related items based on tags
6. **Wishlist**: Save favorite products

### Monitoring
- Track API response times
- Monitor MongoDB query performance
- Log admin product additions
- Track category popularity

---

## 📞 Support

For issues or questions about the data flow implementation:
1. Check MongoDB Atlas connection
2. Verify all 11 categories are created in database
3. Test API endpoints using Postman/Insomnia
4. Check browser console for client-side errors
5. Review server logs at `/api/debug/setup`

---

**Version**: 1.0  
**Last Updated**: May 14, 2025  
**Status**: ✅ Production Ready
