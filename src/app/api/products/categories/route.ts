import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
export const dynamic = 'force-dynamic';

/**
 * GET /api/products/categories
 * Fetches one representative product per category with first image
 * Returns:
 * - category: category name
 * - name: representative product name
 * - image: first image of the product
 * - productId: product ID for linking
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

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

    const categoryImages = await Promise.all(
      categories.map(async (cat) => {
        const product = await Product.findOne({ category: cat, active: true })
          .select('name images category _id')
          .sort({ createdAt: -1 })
          .lean();

        if (product && product.images && product.images.length > 0) {
          return {
            category: cat,
            categoryName: getCategoryDisplayName(cat),
            name: product.name,
            image: product.images[0],
            productId: product._id,
          };
        }

        return null;
      })
    );

    const validCategories = categoryImages.filter((cat) => cat !== null);

    return createSuccessResponse({
      categories: validCategories,
      total: validCategories.length,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return createErrorResponse('Failed to fetch categories', 500);
  }
}

/**
 * Convert category ID to display name
 */
function getCategoryDisplayName(categoryId: string): string {
  const displayNames: { [key: string]: string } = {
    bridal: 'Bridal',
    groom: 'Groom',
    formal: 'Formal',
    informal: 'Informal',
    children: 'Children',
    men: 'Men',
    women: 'Women',
    'old-people': 'Old People',
    young: 'Young',
    accessories: 'Accessories',
  };

  return displayNames[categoryId] || categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
}
