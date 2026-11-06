import { api, type Category, type Product } from "@/lib/api";
import {
  FIXTURE_CATEGORIES,
  FIXTURE_PRODUCTS,
  FIXTURE_SOURCE,
} from "./fixtures";

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
  source: "api" | typeof FIXTURE_SOURCE;
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type ProductResult = {
  product: Product | null;
  source: "api" | typeof FIXTURE_SOURCE | "none";
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
  return params.toString();
}

function filterFixtures(q: CatalogQuery): Product[] {
  let list = [...FIXTURE_PRODUCTS].filter((p) => p.active);

  if (q.category) {
    const cat = FIXTURE_CATEGORIES.find(
      (c) => c.slug === q.category || c.id === q.category,
    );
    list = list.filter(
      (p) =>
        p.categoryId === q.category ||
        p.categoryId === cat?.id ||
        (q.category === "offers" && p.weeklyDeal) ||
        (q.category === "games" && p.kind === "GAME_KEY") ||
        (q.category === "gift-cards" && p.kind === "GIFT_CARD") ||
        (q.category === "top-ups" && p.kind === "TOP_UP") ||
        (q.category === "services" && p.kind === "SERVICE"),
    );
  }
  if (q.featured) list = list.filter((p) => p.featured);
  if (q.weeklyDeal) list = list.filter((p) => p.weeklyDeal);
  if (q.hot) list = list.filter((p) => p.hot);
  if (q.isNew) list = list.filter((p) => p.isNew);
  if (q.kind) list = list.filter((p) => p.kind === q.kind);
  if (q.platform) {
    const needle = q.platform.toLowerCase();
    list = list.filter((p) => p.platform.toLowerCase().includes(needle));
  }
  if (q.search) {
    const s = q.search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s) ||
        p.platform.toLowerCase().includes(s) ||
        p.slug.toLowerCase().includes(s),
    );
  }

  switch (q.sort) {
    case "price_asc":
      list.sort((a, b) => a.priceEGP - b.priceEGP);
      break;
    case "price_desc":
      list.sort((a, b) => b.priceEGP - a.priceEGP);
      break;
    case "newest":
      list.sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
      break;
    default:
      list.sort(
        (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
      );
  }

  return list;
}

function allowFixtures(): boolean {
  // Never serve demo catalog data in production builds
  return process.env.NODE_ENV !== "production";
}

function paginate(
  items: Product[],
  page: number,
  pageSize: number,
): CatalogResult {
  const total = items.length;
  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return {
    items: slice,
    source: FIXTURE_SOURCE,
    total,
    page,
    pageSize,
    hasMore: start + pageSize < total,
  };
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

  try {
    const qs = toQueryString({
      ...q,
      limit: q.limit ?? page * pageSize,
    });
    const data = await api.get<Product[]>(`/products?${qs}`);
    if (data.length > 0) {
      const total = data.length;
      const start = (page - 1) * pageSize;
      // API has no offset yet — client-slice when we requested enough rows
      const items =
        data.length > pageSize ? data.slice(start, start + pageSize) : data;
      return {
        items,
        source: "api",
        total,
        page,
        pageSize,
        hasMore:
          data.length > pageSize
            ? start + pageSize < data.length
            : data.length >= pageSize,
      };
    }
    // Empty API response: fixtures only in non-production
    if (allowFixtures()) {
      return paginate(filterFixtures(q), page, pageSize);
    }
    return emptyCatalog(page, pageSize);
  } catch {
    if (allowFixtures()) {
      return paginate(filterFixtures(q), page, pageSize);
    }
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
    );
    if (product) return { product, source: "api" };
  } catch {
    /* fixtures below */
  }

  if (!allowFixtures()) {
    return { product: null, source: "none" };
  }

  const fixture = FIXTURE_PRODUCTS.find((p) => p.slug === slug) || null;
  return {
    product: fixture,
    source: fixture ? FIXTURE_SOURCE : "none",
  };
}

export async function listCategories(lang?: string): Promise<{
  items: Category[];
  source: "api" | typeof FIXTURE_SOURCE;
}> {
  try {
    const items = await api.get<Category[]>(
      `/categories${lang ? `?lang=${lang}` : ""}`,
    );
    if (items.length > 0) return { items, source: "api" };
    if (allowFixtures()) {
      return { items: FIXTURE_CATEGORIES, source: FIXTURE_SOURCE };
    }
    return { items: [], source: "api" };
  } catch {
    if (allowFixtures()) {
      return { items: FIXTURE_CATEGORIES, source: FIXTURE_SOURCE };
    }
    return { items: [], source: "api" };
  }
}

export async function getCategoryBySlug(
  slug: string,
  lang?: string,
): Promise<{ category: Category | null; source: "api" | typeof FIXTURE_SOURCE | "none" }> {
  const { items, source } = await listCategories(lang);
  const category = items.find((c) => c.slug === slug) || null;
  if (category) return { category, source };
  return { category: null, source: "none" };
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

/** @deprecated Prefer catalog repository — kept for gradual migration */
export { FIXTURE_PRODUCTS as FALLBACK_PRODUCTS };
