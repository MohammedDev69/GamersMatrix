/**
 * Resolves a product image URL for the storefront.
 * Empty / invalid values return null so UI can show a branded placeholder.
 */
export function getProductImageUrl(value?: string | null): string | null {
  const url = value?.trim();
  if (!url || url.startsWith("data:")) return null;

  if (url.startsWith("/")) return url;

  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}
