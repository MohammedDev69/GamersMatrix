export const CacheTTL = {
  /** Hot catalog lists — short so stock/price feel fresh */
  PRODUCTS_LIST: 45,
  /** Single product pages */
  PRODUCT_DETAIL: 90,
  /** Categories rarely change */
  CATEGORIES: 120,
  /** Public store config */
  STORE_PUBLIC: 180,
} as const;

export const CachePrefix = {
  PRODUCTS: 'gm:products',
  PRODUCT: 'gm:product',
  CATEGORIES: 'gm:categories',
  STORE: 'gm:store',
} as const;

export function productsListKey(parts: Record<string, string | undefined>) {
  const normalized = Object.keys(parts)
    .sort()
    .map((k) => `${k}=${parts[k] ?? ''}`)
    .join('&');
  return `${CachePrefix.PRODUCTS}:list:${normalized || 'all'}`;
}

export function productDetailKey(slug: string, lang: string) {
  return `${CachePrefix.PRODUCT}:${lang}:${slug}`;
}

export function categoriesKey(lang: string) {
  return `${CachePrefix.CATEGORIES}:${lang}`;
}

export function storePublicKey() {
  return `${CachePrefix.STORE}:public`;
}
