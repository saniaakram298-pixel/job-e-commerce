# 🎯 Admin Guide - Atelier Landing Page Management

## Quick Overview

Your Atelier landing page now has **3 automatic sections**:

1. **New Arrivals** - Automatically shows 8 latest products
2. **Featured Products** - Shows products you mark as "Featured"  
3. **Our Collections** - Groups products by category, shows newest per category

---

## 📝 How to Use Each Section

### 1️⃣ New Arrivals (Automatic)

**What it does:** Automatically shows the 8 most recently added products

**Your action needed:** NONE! Just add new products normally.

**How it works:**
- Every time you add a product → New Arrivals updates automatically
- Always shows the 8 newest items
- Regardless of category

**Example:**
```
Monday: Add Dress #1 → Appears in New Arrivals
Tuesday: Add Dress #2 → Appears in New Arrivals (pushes older item out of top 8)
Friday: Add Shirt #3 → Appears in New Arrivals
Oldest product from Monday disappears (replaced by #3)
```

**How to verify:** Go to landing page → "New Arrivals" section shows your newest products

---

### 2️⃣ Featured Products (Manual Selection)

**What it does:** Shows products you specifically mark as "Featured"

**Your action needed:** 
1. Go to Admin Panel → Products
2. Find a product you want to feature
3. Check the "Featured" checkbox
4. Save product
5. It appears in "Featured Products" section on landing page

**How it works:**
```
Admin Panel:
  ├─ Product: "Elegant Bridal Gown"
  ├─ Featured: ☑️ (checked)
  └─ Save
    ↓
  Landing Page appears in "Featured Products"
```

**How to verify:**
1. Add 5 products to MongoDB
2. Go to Admin Panel
3. Mark 3 of them as Featured
4. Go to landing page
5. "Featured Products" section shows exactly those 3 items

---

### 3️⃣ Our Collections (Automatic by Category)

**What it does:** Groups products by category, each category shows its newest product as the representative image

**Your action needed:**
1. When adding product → Select category
2. That's it! Rest is automatic.

**How it works:**
```
Add Product:
  ├─ Name: "Formal Black Dress"
  ├─ Category: "Formal" ← Important!
  ├─ Image: upload_image.jpg
  └─ Save
    ↓
  Landing Page:
  └─ "Our Collections"
      └─ "Formal" block
          └─ Shows formal_image.jpg
              (your new product's image)
```

**Categories Available:**
- Bridal
- Groom
- Formal
- Informal
- Children
- Men
- Women
- Old People
- Young
- Accessories

**How to verify:**
1. Add "Bridal" product with image
2. Landing page → "Our Collections"
3. Bridal block shows that image
4. Add another Bridal product
5. Bridal image updates to the newer one

---

## 🖼️ Image Requirements

**For all products:**
- Upload at least 1 image (becomes first image in array)
- First image is used as:
  - Product thumbnail in New Arrivals
  - Category representative in Our Collections
  - Featured Products main image

**Image Format:**
- JPG, PNG supported
- Upload to product `images` field
- First image in array is used

**Example:**
```json
Product: {
  name: "Dress",
  images: [
    "dress-main.jpg",      // ← This appears in New Arrivals
    "dress-detail.jpg",
    "dress-back.jpg"
  ]
}
```

---

## ✅ Checklist - Setting Up Landing Page

### First Time Setup:

- [ ] Add 10+ products with proper categories
- [ ] Upload images for each product
- [ ] Mark 3-5 products as "Featured"
- [ ] Verify each category has at least 1 product
- [ ] Go to landing page, verify all sections load

### Ongoing Maintenance:

- [ ] Every week: Add new products
- [ ] Monthly: Review and update Featured items
- [ ] Check that images load properly
- [ ] Verify categories have diverse products

---

## 📍 Landing Page Sections & What They Show

### Section 1: "New Arrivals"
```
Shows: 8 most recently added products
Updates: Automatically when you add products
Order: Newest first
```

### Section 2: "Featured Products"
```
Shows: Products marked with Featured checkbox
Updates: When you check/uncheck Featured
Order: By rating/newest
```

### Section 3: "Our Collections"
```
Shows: One representative image per category
Updates: When new product added to that category
Each Category Shows: 10 most recent products in that category
```

---

## 🎨 Image Best Practices

### Do's:
✅ Use high-quality images (at least 800x800px)
✅ Use consistent aspect ratios per category
✅ Upload main product image first
✅ Keep image file sizes under 2MB

### Don'ts:
❌ Don't upload placeholder images
❌ Don't upload corrupted files
❌ Don't use extremely low resolution
❌ Don't forget to upload images (will show placeholder)

---

## 🔄 What Happens When You...

### ...Add a New Product
```
Action: Create product + upload image + select category
Result:
  ✓ Appears in "New Arrivals" (if in top 8)
  ✓ Category representative image updates
  ✓ Instantly visible on landing page
Timeline: Within 1 minute
```

### ...Mark Product as Featured
```
Action: Check "Featured" checkbox in Admin
Result:
  ✓ Appears in "Featured Products" section
  ✓ Shows featured image
Timeline: Instant (within 1 second)
```

### ...Change Product Category
```
Action: Edit product → change category
Result:
  ✓ Moves to new category section
  ✓ Disappears from old category
  ✓ May become representative image for new category
Timeline: Within 1 minute
```

### ...Delete a Product
```
Action: Delete product
Result:
  ✓ Removes from New Arrivals (if was in top 8)
  ✓ Removes from Featured (if was marked featured)
  ✓ Removes from category section
Timeline: Within 1 minute
```

---

## ❓ FAQ

### Q: My category is empty on the landing page?
**A:** Check that at least one product in that category has:
- ✓ `active: true`
- ✓ `images` array with at least 1 image
- ✓ Correct category selected

### Q: New Arrivals not updating?
**A:** Clear browser cache:
- Press Ctrl+Shift+Delete
- Clear browsing data
- Reload landing page

### Q: Featured section not showing?
**A:** Make sure you:
1. Go to Admin Panel
2. Find a product
3. Check "Featured" checkbox
4. Click Save
5. Reload landing page

### Q: Images not showing?
**A:** Verify:
- Image file was uploaded successfully
- Image URL is accessible
- File is not corrupted
- Try uploading again if failed

### Q: Same image showing for all categories?
**A:** This means each category only has products from one source. Add more products to different categories to see variety.

---

## 📊 Monitoring Landing Page

### Daily:
- Check if new products appear in New Arrivals
- Verify images load properly

### Weekly:
- Update Featured products
- Add new products
- Check category diversity

### Monthly:
- Review overall category coverage
- Update marketing section
- Check user engagement metrics

---

## 🚀 Pro Tips

### Tip 1: Fresh Content Weekly
Add 2-3 new products weekly to keep landing page fresh.

### Tip 2: Strategic Featuring
Feature your best-selling or highest-margin items.

### Tip 3: Category Rotation
Rotate featured items monthly to highlight different categories.

### Tip 4: Image Consistency
Use similar lighting/angles within each category for professional look.

### Tip 5: Stock Check
Add popular items with good stock in Featured section.

---

## 🎯 Landing Page Performance

These are the metrics that matter:

| Metric | Current | Target |
|--------|---------|--------|
| Page Load Time | <3s | <2s |
| Images Loaded | ✓ | ✓ |
| Categories | 10 | All used |
| Products | 50+ | 100+ |
| Featured | ? | 5-10 |

---

## 💡 Common Admin Tasks

### Task: Add 10 Products Monthly
**Steps:**
1. Go to Admin Panel
2. Click "Add Product"
3. Fill name, price, description
4. Select category
5. Upload image
6. Click Save
7. Repeat 9 more times

### Task: Feature Top 5 Products
**Steps:**
1. Go to Admin Panel → Products
2. Find top sellers
3. Check "Featured" for each
4. Save
5. Verify on landing page

### Task: Update Category Representative
**Steps:**
1. Add new product to category
2. Landing page automatically updates
3. New product becomes representative
4. No manual action needed

### Task: Hide Product Without Deleting
**Steps:**
1. Go to Admin Panel → Products
2. Find product
3. Uncheck "Active"
4. Save
5. Product disappears from landing page (but data preserved)

---

## 🔐 Important Notes

- **Products are from MongoDB** - Not hardcoded
- **Images are dynamic** - Load from actual product images
- **Updates are automatic** - No cache to clear usually
- **Categories are enforced** - Product can only be in one category
- **Featured is optional** - Products can exist without being featured

---

## 📞 Questions?

Check:
1. **Is image uploaded?** → Check Product.images array
2. **Is category selected?** → Check Product.category field
3. **Is product active?** → Check Product.active = true
4. **Is featured checked?** → Check Product.featured = true

Everything is connected to MongoDB. If landing page doesn't show something, check the database!

---

## 🎉 You're Ready!

Your Atelier landing page is now fully dynamic and managed through the Admin Panel. Just:

1. Add products regularly
2. Upload images
3. Select categories
4. Mark featured items
5. Watch landing page update automatically!

Enjoy! ✨
