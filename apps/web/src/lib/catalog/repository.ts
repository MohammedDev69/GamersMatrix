import { api, type Category, type Product } from "@/lib/api";

export type CatalogQuery = {
  lang?: string;
  category?: string;
  featured?: boolean;
  weeklyDeal?: boolean;
  search?: string;
  kind?: string;
  platform?: string;
  hot?: boolean;
  isNew?: boolean;
  popular?: boolean;
  sort?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
};

export type CatalogResult = {
  items: Product[];
  source: "api";
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

type CatalogEnvelope = {
  items: Product[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
};

export type ProductResult = {
  product: Product | null;
  source: "api" | "none";
};

function toQueryString(q: CatalogQuery): string {
  const params = new URLSearchParams();
  if (q.lang) params.set("lang", q.lang);
  if (q.category) params.set("category", q.category);
  if (q.featured) params.set("featured", "true");
  if (q.weeklyDeal) params.set("weeklyDeal", "true");
  if (q.search) params.set("search", q.search);
  if (q.kind) params.set("kind", q.kind);
  if (q.platform) params.set("platform", q.platform);
  if (q.hot) params.set("hot", "true");
  if (q.isNew) params.set("isNew", "true");
  if (q.popular) params.set("popular", "true");
  if (q.sort) params.set("sort", q.sort);
  if (q.limit) params.set("limit", String(q.limit));
  if (q.page) params.set("page", String(q.page));
  if (q.pageSize) params.set("pageSize", String(q.pageSize));
  return params.toString();
}

function emptyCatalog(page: number, pageSize: number): CatalogResult {
  return {
    items: [],
    source: "api",
    total: 0,
    page,
    pageSize,
    hasMore: false,
  };
}

export async function listProducts(q: CatalogQuery = {}): Promise<CatalogResult> {
  const page = q.page && q.page > 0 ? q.page : 1;
  const pageSize = q.pageSize && q.pageSize > 0 ? Math.min(q.pageSize, 48) : 20;
  // Section/widget callers ask for a fixed `limit` and expect a plain array.
  // Catalogue paging sends page + pageSize so the API runs LIMIT/OFFSET instead
  // of us re-downloading every previous page (limit = page * pageSize).
  const wantsPage = q.page !== undefined || q.limit === undefined;

  try {
    const qs = wantsPage
      ? toQueryString({ ...q, page, pageSize })
      : toQueryString(q);
    const data = await api.get<Product[] | CatalogEnvelope>(`/products?${qs}`, {
      revalidate: 45,
    });

    if (Array.isArray(data)) {
      return {
        items: data,
        source: "api",
        total: data.length,
        page: 1,
        pageSize: Math.max(data.length, 1),
        hasMore: false,
      };
    }

    return {
      items: data.items,
      source: "api",
      total: data.meta.total,
      page: data.meta.page,
      pageSize: data.meta.pageSize,
      hasMore: data.meta.hasMore,
    };
  } catch {
    return emptyCatalog(page, pageSize);
  }
}

export async function getProductBySlug(
  slug: string,
  lang?: string,
): Promise<ProductResult> {
  try {
    const product = await api.get<Product>(
      `/products/${encodeURIComponent(slug)}${lang ? `?lang=${lang}` : ""}`,
      { revalidate: 60 },
    );
    return product ? { product, source: "api" } : { product: null, source: "none" };
  } catch {
    return { product: null, source: "none" };
  }
}

export async function listCategories(lang?: string): Promise<{
  items: Category[];
  source: "api";
}> {
  try {
    const items = await api.get<Category[]>(
      `/categories${lang ? `?lang=${lang}` : ""}`,
      { revalidate: 120 },
    );
    return { items, source: "api" };
  } catch {
    return { items: [], source: "api" };
  }
}

export async function getCategoryBySlug(
  slug: string,
  lang?: string,
): Promise<{ category: Category | null; source: "api" | "none" }> {
  const { items } = await listCategories(lang);
  const category = items.find((c) => c.slug === slug) || null;
  return category
    ? { category, source: "api" }
    : { category: null, source: "none" };
}

export async function listRelatedProducts(
  product: Product,
  lang?: string,
  limit = 6,
): Promise<Product[]> {
  const result = await listProducts({
    lang,
    kind: product.kind,
    limit: limit + 1,
    pageSize: limit + 1,
  });
  return result.items.filter((p) => p.id !== product.id).slice(0, limit);
}
