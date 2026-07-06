/**
 * Collection Page Metadata Generator
 * Generates optimized metadata for collection pages to improve SEO and caching
 */

interface CollectionMetadata {
  title: string;
  description: string;
  slug: string;
  keywords: string[];
}

/**
 * Generate metadata for collection page
 */
export function generateCollectionMetadata(slug: string, productCount: number = 0): CollectionMetadata {
  const titleCase = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${titleCase} Collection - Shop Now`,
    description: `Browse our curated ${titleCase.toLowerCase()} collection. ${productCount ? `${productCount} premium products` : 'Premium quality items'} available. Free shipping on orders over $100.`,
    slug,
    keywords: [titleCase.toLowerCase(), 'collection', 'shop', 'fashion', 'curated'],
  };
}

/**
 * Generate multiple collection metadata for prerendering
 */
export function generateMultipleCollectionMetadata(
  slugs: string[],
  productCounts: Record<string, number> = {}
): CollectionMetadata[] {
  return slugs.map((slug) =>
    generateCollectionMetadata(slug, productCounts[slug] || 0)
  );
}

export default {
  generateCollectionMetadata,
  generateMultipleCollectionMetadata,
};
