type ProductLike = any;

const cache: Record<string, ProductLike[]> = {};

export function getCachedProducts(category: string): ProductLike[] | undefined {
  return cache[category];
}

export function setCachedProducts(category: string, products: ProductLike[]): void {
  cache[category] = products;
}

export function removeProductFromCache(category: string, productId: string): void {
  if (!cache[category]) return;
  cache[category] = cache[category].filter((p) => p._id !== productId);
}

export function clearCategoryCache(category: string): void {
  delete cache[category];
}

export function clearAllCache(): void {
  Object.keys(cache).forEach((k) => delete cache[k]);
}
