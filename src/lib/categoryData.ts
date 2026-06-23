/**
 * Category Data Utility
 * Provides functions for fetching and grouping products by category
 * with automatic limiting to the latest 10 products per category
 */

import { ProductCategory, ProductTypedef } from '@/types/product';

export interface CategoryProduct {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number;
  images: string[];
  category: ProductCategory;
  featured: boolean;
  createdAt: string;
  tags?: string[];
  stock?: number;
}

export interface CategoryGroupedData {
  [category: string]: CategoryProduct[];
}

export interface CategoryWithProducts {
  category: ProductCategory;
  name: string;
  products: CategoryProduct[];
  total: number;
}

// Define all available categories
export const AVAILABLE_CATEGORIES: Record<ProductCategory, string> = {
  bridal: 'Bridal',
  groom: 'Groom',
  formal: 'Formal',
  informal: 'Informal',
  children: 'Children',
  men: 'Men',
  women: 'Women',
  'old-people': 'Old People',
  young: 'Young',
  'new-arrival': 'New Arrivals',
  accessories: 'Accessories',
};

/**
 * Fetch products grouped by category
 * Returns only the latest 10 products per category
 */
export async function fetchProductsByCategories(
  categories?: ProductCategory[],
  limit: number = 10
): Promise<CategoryWithProducts[]> {
  try {
    const params = new URLSearchParams();
    params.append('grouped', 'true');
    params.append('limit', limit.toString());
    
    if (categories?.length) {
      params.append('categories', categories.join(','));
    }

    const response = await fetch(`/api/products/by-category?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch products by category');
    }

    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching products by categories:', error);
    return [];
  }
}

/**
 * Fetch products for a specific category with pagination
 */
export async function fetchProductsByCategory(
  category: ProductCategory,
  page: number = 1,
  limit: number = 20
): Promise<{ products: CategoryProduct[]; total: number; pages: number }> {
  try {
    const params = new URLSearchParams();
    params.append('category', category);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('sort', 'newest');

    const response = await fetch(`/api/products?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch category products');
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return {
        products: data.data.products,
        total: data.data.pagination.total,
        pages: data.data.pagination.pages,
      };
    }

    return { products: [], total: 0, pages: 0 };
  } catch (error) {
    console.error('Error fetching category products:', error);
    return { products: [], total: 0, pages: 0 };
  }
}

/**
 * Get display name for a category
 */
export function getCategoryDisplayName(category: ProductCategory): string {
  return AVAILABLE_CATEGORIES[category] || category;
}

/**
 * Get all category IDs
 */
export function getAllCategoryIds(): ProductCategory[] {
  return Object.keys(AVAILABLE_CATEGORIES) as ProductCategory[];
}

/**
 * Filter and slice products (client-side utility)
 * Groups products by category and limits to specified count
 */
export function groupAndLimitProducts(
  products: CategoryProduct[],
  limitPerCategory: number = 10
): CategoryGroupedData {
  const grouped: CategoryGroupedData = {};

  // Initialize empty arrays for each category
  getAllCategoryIds().forEach((cat) => {
    grouped[cat] = [];
  });

  // Group products and slice
  products.forEach((product) => {
    if (
      grouped[product.category] &&
      grouped[product.category].length < limitPerCategory
    ) {
      grouped[product.category].push(product);
    }
  });

  return grouped;
}

/**
 * Convert grouped data to array format with category metadata
 */
export function groupedToArray(
  grouped: CategoryGroupedData
): CategoryWithProducts[] {
  return Object.entries(grouped)
    .map(([category, products]) => ({
      category: category as ProductCategory,
      name: getCategoryDisplayName(category as ProductCategory),
      products,
      total: products.length,
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => {
      // Sort by category order
      const order = getAllCategoryIds();
      return order.indexOf(a.category) - order.indexOf(b.category);
    });
}

export type { ProductCategory };
