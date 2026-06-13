export const dynamic = 'force-dynamic';
/**
 * API Route: GET /api/products/by-category
 * Fetches products grouped by category, limiting to X products per category
 * Perfect for landing page sections where each category shows its latest products
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product, ProductCategory } from '@/models/Product';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const grouped = searchParams.get('grouped') === 'true';
    const limitPerCategory = parseInt(searchParams.get('limit') || '10');
    const categoriesParam = searchParams.get('categories');
    
    // Parse category list if provided
    let targetCategories: ProductCategory[] | undefined;
    if (categoriesParam) {
      targetCategories = categoriesParam
        .split(',')
        .map((c) => c.trim().toLowerCase() as ProductCategory)
        .filter((c) => c.length > 0);
    }

    if (!grouped) {
      return createErrorResponse('Invalid request. Use ?grouped=true', 400);
    }

    // Get all available categories
    const CATEGORIES: ProductCategory[] = [
      'bridal',
      'groom',
      'formal',
      'informal',
      'children',
      'men',
      'women',
      'old-people',
      'young',
      'new-arrival',
      'accessories',
    ];

    const categoriesToFetch = targetCategories || CATEGORIES;

    // Fetch products for each category, sorted by newest first, limited to N items
    const results = await Promise.all(
      categoriesToFetch.map(async (category) => {
        const products = await Product.find({
          category,
          active: true,
        })
          .sort({ createdAt: -1 }) // Newest first
          .limit(limitPerCategory)
          .lean();

        return {
          category,
          name: formatCategoryName(category),
          products: products.map((p) => ({
            _id: p._id.toString(),
            name: p.name,
            price: p.price,
            discountPrice: p.discountPrice,
            images: p.images,
            category: p.category,
            featured: p.featured,
            createdAt: p.createdAt.toISOString(),
            tags: p.tags,
          })),
          total: products.length,
        };
      })
    );

    // Filter out empty categories
    const filteredResults = results.filter((r) => r.total > 0);

    return createSuccessResponse(
      filteredResults,
      'Products grouped by category fetched successfully'
    );
  } catch (error) {
    console.error('Get products by category error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Format category name for display
 */
function formatCategoryName(category: ProductCategory): string {
  const names: Record<ProductCategory, string> = {
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

  return names[category] || category;
}
