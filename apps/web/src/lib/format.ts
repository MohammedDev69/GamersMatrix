/**
 * Admin-oriented formatter for store-base amounts currently stored as EGP.
 * Storefront UI must use `useCurrency().formatPrice` instead so display
 * currency stays configurable and is not hardcoded in components.
 */
export function formatEGP(amount: number | string | null | undefined): string {
  const value = typeof amount === "string" ? Number(amount) : amount ?? 0;
  if (Number.isNaN(value)) return "٠ ج.م";
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format a monetary amount in an explicit ISO currency code (no conversion). */
export function formatMoneyAmount(
  amount: number | string | null | undefined,
  currencyCode: string,
  locale = "ar",
): string {
  const value = typeof amount === "string" ? Number(amount) : amount ?? 0;
  if (Number.isNaN(value)) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
    }).format(0);
  }
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
    }).format(value);
  } catch {
    return `${value} ${currencyCode}`;
  }
}

export function formatNumber(amount: number | string | null | undefined): string {
  const value = typeof amount === "string" ? Number(amount) : amount ?? 0;
  return new Intl.NumberFormat("ar-EG").format(value);
}
