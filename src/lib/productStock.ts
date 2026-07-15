export interface ProductVariantStockEntry {
  size?: string;
  color?: string;
  stock?: number | string | null;
}

export interface ProductStockLike {
  sizes?: ProductVariantStockEntry[];
  colors?: ProductVariantStockEntry[];
}

export const normalizeNumericStock = (value: unknown, fallback = 0) => {
  const parsed = typeof value === 'number' ? value : Number(value ?? fallback);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(0, parsed);
};

export const normalizeVariantEntries = <T extends ProductVariantStockEntry>(
  entries: T[] | undefined,
  variantKey: 'size' | 'color'
) => {
  if (!Array.isArray(entries)) {
    return [] as T[];
  }

  return entries
    .map((entry) => ({
      ...entry,
      [variantKey]: String((entry as Record<string, unknown>)?.[variantKey] ?? '').trim(),
      stock: normalizeNumericStock((entry as Record<string, unknown>)?.stock),
    }))
    .filter((entry) => Boolean((entry as Record<string, unknown>)[variantKey]));
};

export const normalizeProductVariants = (
  sizes?: Array<{ size?: string; stock?: number | string | null }>,
  colors?: Array<{ color?: string; stock?: number | string | null }>
) => {
  const normalizedSizes = normalizeVariantEntries(sizes ?? [], 'size');
  const normalizedColors = normalizeVariantEntries(colors ?? [], 'color');

  return {
    sizes: normalizedSizes.map((entry) => ({
      size: String(entry.size ?? '').trim(),
      stock: normalizeNumericStock(entry.stock),
    })),
    colors: normalizedColors.map((entry) => ({
      color: String(entry.color ?? '').trim(),
      stock: normalizeNumericStock(entry.stock),
    })),
  };
};

export const getTotalStock = (product?: ProductStockLike | null) =>
  (product?.sizes ?? []).reduce((total, entry) => total + normalizeNumericStock(entry?.stock), 0);
