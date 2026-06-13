# 🚀 Atelier Landing Page - Testing & Deployment Guide

## Quick Start

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Run development server
npm run dev

# 3. Open browser
http://localhost:3000

# 4. Verify landing page loads with all sections
```

---

## ✅ Testing Checklist

### Test 1: API Endpoints Working

**1.1 Test Categories Endpoint**
```bash
# In browser, go to:
http://localhost:3000/api/products/categories

# Should return:
{
  "success": true,
  "data": {
    "categories": [
      {
        "category": "bridal",
        "categoryName": "Bridal",
        "name": "Product Name",
        "image": "https://image-url.jpg",
        "productId": "prod_123"
      }
    ]
  }
}
```

**1.2 Test Featured Endpoint**
```bash
# In browser, go to:
http://localhost:3000/api/products/featured

# Should return products with featured=true
```

**1.3 Test New Arrivals Endpoint**
```bash
# In browser, go to:
http://localhost:3000/api/products/new-arrivals?limit=8

# Should return 8 products sorted by createdAt DESC
```

### Test 2: Landing Page Sections

**2.1 New Arrivals Section**
```
Expected:
  ✓ Shows 8 products
  ✓ Products are newest first
  ✓ All images display
  ✓ Prices visible
  ✓ Category tags visible
  
Location: http://localhost:3000/
Scroll to: "New Arrivals" section
```

**2.2 Featured Products Section**
```
Expected:
  ✓ Shows only marked products
  ✓ Dynamic images from MongoDB
  ✓ All products marked as featured
  
Location: http://localhost:3000/
Scroll to: "Featured Products" section
```

**2.3 Our Collections Section**
```
Expected:
  ✓ Shows 8-10 category blocks
  ✓ Each has different image
  ✓ Images are product images (not placeholders)
  ✓ Categories are properly named
  
Location: http://localhost:3000/
Scroll to: "Our Collections" section
```

### Test 3: Category Filtering

**3.1 Test URL-based filtering**
```
Test URLs:
  http://localhost:3000/collections?category=formal
  http://localhost:3000/collections?category=bridal
  http://localhost:3000/collections?category=women

Expected:
  ✓ Only products in that category appear
  ✓ Product count matches
  ✓ No cross-category products
```

**3.2 Test category representative update**
```
Steps:
  1. Note current Bridal category image
  2. Add new Bridal product with different image
  3. Go back to landing page
  4. Check Bridal image updated
  
Expected:
  ✓ Image changes to newest product
  ✓ No manual refresh needed
```

### Test 4: Image Display

**4.1 Test all images load**
```
Check: 
  ✓ No broken image icons
  ✓ All images visible
  ✓ No console errors
  
Open DevTools: F12 → Console
Expected: No 404 errors
```

**4.2 Test image quality**
```
Expected:
  ✓ Images load at proper resolution
  ✓ No pixelation or stretching
  ✓ Aspect ratios maintained
```

### Test 5: Responsive Design

**5.1 Test on different screens**
```
Screen sizes:
  ✓ Mobile (375px width)
  ✓ Tablet (768px width)
  ✓ Desktop (1440px width)
  
Expected: All sections visible and functional
```

**5.2 Test touch interactions**
```
On mobile:
  ✓ New Arrivals horizontal scroll works
  ✓ Categories load properly
  ✓ Images display correctly
```

---

## 📊 Data Requirements

### Minimum Test Data

For testing, add to MongoDB:

```javascript
// Minimum: 20 products
db.products.insertMany([
  {
    name: "Bridal Gown",
    category: "bridal",
    price: 500,
    featured: true,
    active: true,
    images: ["bridal1.jpg"],
    createdAt: new Date()
  },
  {
    name: "Formal Dress",
    category: "formal",
    price: 300,
    featured: false,
    active: true,
    images: ["formal1.jpg"],
    createdAt: new Date()
  },
  // ... more products
])
```

### Recommended Test Data

```
Categories to fill: 8+
  ✓ Bridal (3+ products)
  ✓ Formal (3+ products)
  ✓ Women (3+ products)
  ✓ Men (3+ products)
  ✓ Others (2+ each)

Featured products: 5+
Newest products: 8+ (for New Arrivals)
Total minimum: 20-30 products
```

---

## 🔍 Verification Tests

### Before Push to Production

Run these tests:

```javascript
// Test 1: Verify API response structure
fetch('/api/products/categories')
  .then(r => r.json())
  .then(d => {
    console.log('Categories:', d.data.categories.length);
    console.assert(d.success, 'API should return success: true');
    console.assert(d.data.categories.length > 0, 'Should have categories');
  });

// Test 2: Verify New Arrivals
fetch('/api/products/new-arrivals?limit=8')
  .then(r => r.json())
  .then(d => {
    console.log('New Arrivals:', d.data.products.length);
    console.assert(d.data.products.length <= 8, 'Should limit to 8');
  });

// Test 3: Verify Featured
fetch('/api/products/featured')
  .then(r => r.json())
  .then(d => {
    console.log('Featured:', d.data.products.length);
    console.assert(d.data.products.every(p => p.featured), 'All should be featured');
  });
```

---

## 🚀 Deployment Steps

### Step 1: Local Testing

```bash
# Development
npm run dev

# Navigate browser
http://localhost:3000

# Check all sections load
# Check no console errors
# Test API endpoints work
```

### Step 2: Production Build

```bash
# Build for production
npm run build

# Should complete with no errors
# If errors appear, fix before deploying
```

### Step 3: Pre-deployment Checklist

- [ ] `npm run build` succeeds
- [ ] All API endpoints respond correctly
- [ ] Landing page loads all sections
- [ ] Images display properly
- [ ] No console errors
- [ ] Category filtering works
- [ ] Featured products appear
- [ ] New Arrivals shows latest items
- [ ] Mobile responsive
- [ ] Database has test data

### Step 4: Deploy

```bash
# Push to production
git push origin main

# Or manually deploy your Next.js app
# (depends on your hosting provider)
```

### Step 5: Post-deployment Verification

```bash
# Check production site
https://yourdomain.com

# Verify same as local:
✓ Sections load
✓ Images display
✓ No 404 errors
✓ API endpoints work
```

---

## 🐛 Common Issues & Fixes

### Issue: Sections show "loading" forever

**Cause:** API endpoints not working or database not connected

**Fix:**
```javascript
// Check:
1. Is MongoDB connected? 
   - Check .env MONGODB_URI
2. Are there products in database?
   - Query: db.products.find().limit(5)
3. Do API endpoints respond?
   - http://localhost:3000/api/products/categories
```

### Issue: Images showing as broken

**Cause:** Image URLs invalid or not accessible

**Fix:**
```javascript
// Check:
1. Are images uploaded to MongoDB?
   - Query: db.products.findOne().images
2. Are URLs accessible?
   - Try opening URL in browser
3. Is image field populated?
   - Should be: images: ["url1", "url2"]
```

### Issue: Categories all showing same image

**Cause:** Only 1 product in database

**Fix:**
```javascript
// Add more products:
// Each category needs at least 1 product
// With different images
```

### Issue: Featured section empty

**Cause:** No products marked as featured

**Fix:**
```javascript
// In Admin Panel:
1. Find a product
2. Check "Featured" checkbox
3. Save product
4. Reload landing page
```

### Issue: New Arrivals showing old products

**Cause:** createdAt field not set correctly

**Fix:**
```javascript
// Check product.createdAt exists
// Products should have createdAt timestamps
// Can verify with: db.products.findOne().createdAt
```

---

## 📈 Performance Monitoring

### Monitor After Deployment

```javascript
// Check API response times
console.time('categories');
fetch('/api/products/categories').then(r => r.json());
console.timeEnd('categories');
// Should be < 200ms

console.time('featured');
fetch('/api/products/featured').then(r => r.json());
console.timeEnd('featured');
// Should be < 200ms

console.time('new-arrivals');
fetch('/api/products/new-arrivals').then(r => r.json());
console.timeEnd('new-arrivals');
// Should be < 200ms
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Page Load | < 3s |
| API Response | < 200ms each |
| Images Load | < 2s |
| First Contentful Paint | < 1.5s |
| Lighthouse Score | > 80 |

---

## 📋 Testing Report Template

Use this to document your testing:

```
Testing Date: ___________
Environment: ☐ Local  ☐ Staging  ☐ Production

SECTION TESTS:
☐ New Arrivals loads correctly
☐ New Arrivals shows 8 products
☐ New Arrivals images display
☐ Featured Products loads
☐ Featured Products shows marked items only
☐ Featured Products images display
☐ Our Collections loads
☐ Our Collections shows all categories
☐ Each category has different image
☐ Category images are product images (not placeholders)

API TESTS:
☐ /api/products/categories responds correctly
☐ /api/products/featured responds correctly
☐ /api/products/new-arrivals responds correctly

FUNCTIONALITY TESTS:
☐ Category filtering works
☐ URL parameters respected
☐ Images load from MongoDB
☐ Product counts correct

RESPONSIVE TESTS:
☐ Mobile (375px) displays correctly
☐ Tablet (768px) displays correctly
☐ Desktop (1440px) displays correctly

ERRORS:
☐ No console errors
☐ No 404 errors
☐ No network errors

PERFORMANCE:
☐ Page loads < 3s
☐ API responses < 200ms
☐ Images < 2s

STATUS:
☐ Ready for Production
☐ Needs Fixes

Notes: ___________________
```

---

## ✅ Final Checklist

Before declaring completion:

- [ ] All 3 new API endpoints created
- [ ] page.tsx updated with fetch logic
- [ ] Landing page loads all sections
- [ ] Categories show dynamic images
- [ ] Featured Products section works
- [ ] New Arrivals shows 8 latest
- [ ] Images not placeholders
- [ ] Category filtering works
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] Build succeeds
- [ ] Deployed to production
- [ ] Post-deployment verification passed
- [ ] Documentation complete

---

## 🎉 Success Criteria

Your implementation is successful when:

✅ Landing page loads without errors
✅ New Arrivals shows 8 newest products
✅ Featured Products shows marked items
✅ Our Collections shows categories with different images
✅ All images load from MongoDB (not placeholders)
✅ Category filtering works on /collections
✅ Responsive on all devices
✅ API endpoints return proper JSON
✅ No broken images or 404s
✅ Admin can manage content easily

---

## 🆘 Support

If issues arise:

1. Check database connections
2. Verify product data in MongoDB
3. Check API endpoints respond
4. Look at browser console for errors
5. Check Next.js server logs
6. Verify image URLs are accessible
7. Clear browser cache and reload

---

## 📞 Quick Support Links

- MongoDB Connection: Check .env MONGODB_URI
- API Docs: See IMPLEMENTATION_COMPLETE.md
- Admin Guide: See ADMIN_GUIDE.md
- Components: Check src/components/
- Types: Check src/types/

---

**You're ready to deploy! 🚀**

After following this guide, your Atelier landing page will be fully functional with dynamic categories, featured products, and new arrivals!
