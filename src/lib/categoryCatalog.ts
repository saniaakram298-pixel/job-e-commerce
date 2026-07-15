import 'server-only';

import { connectDB } from '@/lib/mongodb';
import { Category } from '@/models/Category';
import { Product } from '@/models/Product';

export interface SharedCategoryItem {
  slug: string;
  name: string;
  description?: string;
  productCount: number;
  image?: string;
}

export function normalizeCategorySlug(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatCategoryName(value: string): string {
  if (!value) return 'Uncategorized';
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();
}

function escapeRegex(value: string): string {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ✅ SAME IMAGE LOGIC (unchanged)
async function getRepresentativeCategoryImage(item: SharedCategoryItem): Promise<string> {
  try {
    const candidates = Array.from(
      new Set(
        [item.slug, item.name, formatCategoryName(item.slug), formatCategoryName(item.name)]
          .map((value) => normalizeCategorySlug(value))
          .filter(Boolean)
      )
    );

    const matchQueries = candidates.flatMap((value) => [
      { category: { $regex: new RegExp(`^${escapeRegex(value)}$`, 'i') } },
      { subcategory: { $regex: new RegExp(`^${escapeRegex(value)}$`, 'i') } },
    ]);

    const product = await Product.findOne({
      active: true,
      $or: matchQueries,
    })
      .select('images img')
      .sort({ createdAt: -1 })
      .lean();

    if (product) {
      const images = Array.isArray((product as any).images) ? (product as any).images : [];
      return images[0] || (product as any).img || '';
    }
  } catch (error) {
    console.error('[categoryCatalog] Error resolving category image:', error);
  }

  return '';
}

// 🔥🔥🔥 MAIN FIXED FUNCTION
export async function getSharedCategoryCatalog(): Promise<SharedCategoryItem[]> {
  try {
    await connectDB();

    // ✅ FETCH CATEGORIES + PRODUCT COUNTS
    const [categoryDocs, categoryStats] = await Promise.all([
      Category.find({}, { name: 1, slug: 1, description: 1 }).lean().exec(),

      // 🔥 FIX: include BOTH category + subcategory
      Product.aggregate([
        {
          $match: {
            active: true,
          },
        },
        {
          $project: {
            category: {
              $ifNull: ['$category', '$subcategory'], // ✅ KEY FIX
            },
          },
        },
        {
          $group: {
            _id: '$category',
            productCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const categoryMap = new Map<string, SharedCategoryItem>();

    // ✅ STEP 1: categories from DB
    (categoryDocs || []).forEach((doc: any) => {
      const rawName = String(doc?.name || '').trim();
      const slug = normalizeCategorySlug(doc?.slug || rawName);
      if (!slug) return;

      categoryMap.set(slug, {
        slug,
        name: rawName || formatCategoryName(slug),
        description: String(doc?.description || ''),
        productCount: 0,
      });
    });

    // ✅ STEP 2: apply product counts
    (categoryStats || []).forEach((item: any) => {
      const slug = normalizeCategorySlug(item._id);
      if (!slug) return;

      const existing = categoryMap.get(slug);
      const productCount = Number(item.productCount || 0);

      if (existing) {
        existing.productCount = productCount;
      } else {
        categoryMap.set(slug, {
          slug,
          name: formatCategoryName(slug),
          description: '',
          productCount,
        });
      }
    });

    // ✅ SORT + CLEAN
    const catalog = Array.from(categoryMap.values())
      .map((item) => ({
        ...item,
        name: item.name || formatCategoryName(item.slug),
      }))
      .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name));

    // ✅ ADD IMAGES
    const catalogWithImages = await Promise.all(
      catalog.map(async (item) => ({
        ...item,
        image: await getRepresentativeCategoryImage(item),
      }))
    );

    return catalogWithImages;
  } catch (error) {
    console.error('[categoryCatalog] Error loading categories:', error);
    return [];
  }
}