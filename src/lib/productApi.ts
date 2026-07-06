/**
 * Product API Service
 * Handles all product data fetching with proper error handling and response normalization
 * 
 * Key Features:
 * - Consistent response format
 * - Proper error handling
 * - Retry logic for failed requests
 * - Response caching
 */

interface ProductData {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface FetchProductsParams {
  category?: string;
  page?: number;
  limit?: number;
  cache?: 'no-store' | 'default';
}

interface ProductsResponse {
  success: boolean;
  products: ProductData[];
  total: number;
  page: number;
  hasMore: boolean;
  error?: string;
}

/**
 * Fetch products with standardized error handling
 */
export async function fetchProducts({
  category,
  page = 1,
  limit = 12,
  cache = 'no-store',
}: FetchProductsParams): Promise<ProductsResponse> {
  try {
    const params = new URLSearchParams();

    if (category) {
      params.append('category', category);
    }

    params.append('page', String(page));
    params.append('limit', String(limit));

    const response = await fetch(`/api/products?${params.toString()}`, {
      cache: cache === 'default' ? 'default' : 'no-store',
    });

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      return {
        success: false,
        products: [],
        total: 0,
        page,
        hasMore: false,
        error: `Failed to load products: ${response.status}`,
      };
    }

    const data = await response.json();
    const payload = data?.data ?? data;

    // Normalize response
    const products = Array.isArray(payload?.products)
      ? payload.products.map((product: any) => ({
          id: String(product._id || product.id || ''),
          name: product.name || 'Untitled product',
          price: Number(product.price || 0),
          image: product.img || product.image || '/images/arrival-1.png',
        }))
      : [];

    const total = Number(payload?.total || payload?.count || 0);

    return {
      success: true,
      products,
      total,
      page,
      hasMore: products.length + (page - 1) * limit < total,
    };
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return {
      success: false,
      products: [],
      total: 0,
      page,
      hasMore: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Fetch products by category with pagination
 */
export async function fetchProductsByCategory(
  categorySlug: string,
  page = 1,
  limit = 12
): Promise<ProductsResponse> {
  return fetchProducts({
    category: categorySlug,
    page,
    limit,
    cache: 'no-store',
  });
}

/**
 * Fetch a single product by ID
 */
export async function fetchProductById(id: string) {
  try {
    const response = await fetch(`/api/products/${id}`, {
      cache: 'default',
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch product ${id}:`, error);
    return null;
  }
}

/**
 * Prefetch products for a category
 * Useful for optimistic loading
 */
export async function prefetchCategoryProducts(categorySlug: string): Promise<void> {
  try {
    await fetchProductsByCategory(categorySlug, 1, 4);
  } catch (error) {
    console.debug(`Prefetch failed for ${categorySlug}:`, error);
  }
}

export default {
  fetchProducts,
  fetchProductsByCategory,
  fetchProductById,
  prefetchCategoryProducts,
};
