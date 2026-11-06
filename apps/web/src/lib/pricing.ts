/**
 * Central pricing helpers. Amounts from the API are store-base units
 * (currently exposed as priceEGP). Display formatting goes through useCurrency.
 */

export type PricedItem = {
  priceEGP: number;
  originalPrice?: number | null;
  discountPct?: number | null;
};

/** Valid sale only when comparison price is present and strictly above current. */
export function getValidSale(item: PricedItem): {
  current: number;
  compareAt: number | null;
  discountPct: number | null;
} {
  const current =
    typeof item.priceEGP === "number" && !Number.isNaN(item.priceEGP)
      ? item.priceEGP
      : 0;
  const compare =
    typeof item.originalPrice === "number" && !Number.isNaN(item.originalPrice)
      ? item.originalPrice
      : null;

  if (compare === null || compare <= current) {
    return { current, compareAt: null, discountPct: null };
  }

  const computedPct = Math.round(((compare - current) / compare) * 100);
  const discountPct =
    typeof item.discountPct === "number" && item.discountPct > 0
      ? item.discountPct
      : computedPct > 0
        ? computedPct
        : null;

  return { current, compareAt: compare, discountPct };
}

export function isOutOfStock(product: {
  stock?: number | null;
  availableKeys?: number | null;
}): boolean {
  if (typeof product.stock === "number") return product.stock <= 0;
  if (typeof product.availableKeys === "number") {
    return product.availableKeys <= 0;
  }
  return false;
}
