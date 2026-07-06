import 'server-only';

import { connectDB } from '@/lib/mongodb';
import { Category } from '@/models/Category';
import { Product } from '@/models/Product';

export interface SharedCategoryItem {
  slug: string;
  name: string;
  description?: string;
  productCount: number;
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

export async function getSharedCategoryCatalog(): Promise<SharedCategoryItem[]> {
  try {
    await connectDB();

    const [categoryDocs, rawCategories, categoryStats] = await Promise.all([
      Category.find({}, { name: 1, slug: 1, description: 1 }).lean().exec(),
      Product.distinct('category', { active: true }),
      Product.aggregate([
        {
          $match: {
            active: true,
            category: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: '$category',
            productCount: { $sum: 1 },
          },
        },
        {
          $sort: { productCount: -1, _id: 1 },
        },
      ]),
    ]);

    const categoryMap = new Map<string, SharedCategoryItem>();

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

    (rawCategories || []).forEach((value) => {
      const rawName = String(value || '').trim();
      const slug = normalizeCategorySlug(rawName);
      if (!slug) return;

      if (!categoryMap.has(slug)) {
        categoryMap.set(slug, {
          slug,
          name: rawName || formatCategoryName(slug),
          description: '',
          productCount: 0,
        });
      }
    });

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

    const catalog = Array.from(categoryMap.values())
      .map((item) => ({
        ...item,
        name: item.name || formatCategoryName(item.slug),
      }))
      .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name));

    return catalog;
  } catch (error) {
    console.error('[categoryCatalog] Error loading categories:', error);
    return [];
  }
}
