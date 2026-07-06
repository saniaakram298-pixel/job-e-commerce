/**
 * Category Cache Utility
 * In-memory cache for category data to avoid redundant queries
 * 
 * Usage:
 * - Cache category metadata on homepage load
 * - Retrieve cached data instantly on subsequent visits
 * - Auto-expire cache after 5 minutes
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CategoryCache {
  [key: string]: CacheEntry<any>;
}

const cache: CategoryCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Set cache entry
 */
export function setCacheEntry<T>(key: string, data: T, ttl = CACHE_TTL): void {
  cache[key] = {
    data,
    timestamp: Date.now(),
    ttl,
  };
}

/**
 * Get cache entry
 * Returns null if not found or expired
 */
export function getCacheEntry<T>(key: string): T | null {
  const entry = cache[key];

  if (!entry) {
    return null;
  }

  // Check if cache has expired
  const isExpired = Date.now() - entry.timestamp > entry.ttl;

  if (isExpired) {
    delete cache[key];
    return null;
  }

  return entry.data as T;
}

/**
 * Clear specific cache entry
 */
export function clearCacheEntry(key: string): void {
  delete cache[key];
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  Object.keys(cache).forEach((key) => {
    delete cache[key];
  });
}

/**
 * Check if cache entry exists and is valid
 */
export function isCacheFresh(key: string): boolean {
  const entry = cache[key];

  if (!entry) {
    return false;
  }

  return Date.now() - entry.timestamp <= entry.ttl;
}

export default {
  setCacheEntry,
  getCacheEntry,
  clearCacheEntry,
  clearAllCache,
  isCacheFresh,
};
