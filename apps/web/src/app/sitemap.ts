import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const apiBase =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type ProductRow = { slug: string; updatedAt?: string };

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${apiBase}${path}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl.replace(/\/$/, "");
  const locales = ["ar", "en"] as const;
  const staticPaths = [
    "",
    "/products",
    "/shop",
    "/refund-policy",
    "/privacy",
    "/terms",
    "/help",
    "/contact",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const p of staticPaths) {
      entries.push({
        url: `${base}/${locale}${p}`,
        changeFrequency: p === "" ? "daily" : "weekly",
        priority: p === "" ? 1 : 0.7,
      });
    }
  }

  const products = await fetchJson<ProductRow[]>("/products?limit=500");
  if (products) {
    for (const product of products) {
      if (!product?.slug) continue;
      for (const locale of locales) {
        entries.push({
          url: `${base}/${locale}/products/${product.slug}`,
          lastModified: product.updatedAt
            ? new Date(product.updatedAt)
            : undefined,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
  }

  return entries;
}
