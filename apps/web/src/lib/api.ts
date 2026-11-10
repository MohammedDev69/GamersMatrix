const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

let accessToken: string | null = null;

export type ApiError = {
  message: string;
  statusCode?: number;
  error?: string;
};

type ClientCacheEntry = { expiresAt: number; data: unknown };

/** Browser-side TTL cache for public catalog GETs (complements Redis on API). */
const clientCatalogCache = new Map<string, ClientCacheEntry>();
const CLIENT_CATALOG_TTL_MS = 30_000;

export type ApiFetchOptions = RequestInit & {
  /** Next.js ISR seconds for server components (catalog reads). */
  revalidate?: number;
  /** Skip client memory cache for this request. */
  skipCache?: boolean;
};

function getToken(): string | null {
  return accessToken;
}

export function setToken(token: string | null) {
  accessToken = token;
  // Remove the legacy application JWT if it exists. Supabase owns persistence.
  if (typeof window !== "undefined") localStorage.removeItem("gm_token");
}

function isPublicCatalogPath(path: string): boolean {
  const bare = path.split("?")[0] || path;
  return (
    bare === "/products" ||
    bare.startsWith("/products/") ||
    bare === "/categories" ||
    bare.startsWith("/categories/") ||
    bare === "/store/public-config"
  );
}

function catalogTtlSeconds(path: string): number {
  const bare = path.split("?")[0] || path;
  if (bare === "/store/public-config") return 120;
  if (bare.startsWith("/products/") && bare !== "/products/") return 60;
  return 45;
}

export function clearClientCatalogCache() {
  clientCatalogCache.clear();
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { revalidate, skipCache, ...fetchOptions } = options;
  const method = (fetchOptions.method || "GET").toUpperCase();
  const headers = new Headers(fetchOptions.headers || {});
  const isFormData =
    typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;
  if (!headers.has("Content-Type") && fetchOptions.body && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const catalogGet =
    !skipCache && method === "GET" && isPublicCatalogPath(path);

  if (catalogGet && typeof window !== "undefined") {
    const hit = clientCatalogCache.get(path);
    if (hit && hit.expiresAt > Date.now()) {
      return hit.data as T;
    }
  }

  // Mutations should not reuse stale catalog lists in the browser.
  if (method !== "GET" && typeof window !== "undefined") {
    clearClientCatalogCache();
  }

  const ttl = revalidate ?? catalogTtlSeconds(path);
  const cacheInit: RequestInit = catalogGet
    ? {
        // Prefer ISR-style caching on the Next server; browsers still honor Cache-Control from API.
        next: { revalidate: ttl },
      }
    : { cache: "no-store" };

  const res = await fetch(`${API_BASE}${path}`, {
    ...cacheInit,
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as ApiError;
      message = data.message || message;
      if (Array.isArray(data.message)) {
        message = data.message.join(", ");
      }
    } catch {
      /* ignore */
    }
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return undefined as T;
  const data = (await res.json()) as T;

  if (catalogGet && typeof window !== "undefined") {
    clientCatalogCache.set(path, {
      data,
      expiresAt: Date.now() + CLIENT_CATALOG_TTL_MS,
    });
  }

  return data;
}

export const api = {
  get: <T>(path: string, options?: ApiFetchOptions) =>
    apiFetch<T>(path, options),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "POST",
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "PATCH",
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "EDITOR" | "ADMIN";
  permissions?: string[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
};

export type ProductKind = "GAME_KEY" | "GIFT_CARD" | "SERVICE" | "TOP_UP";

export type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  platform: string;
  priceEGP: number;
  originalPrice?: number | null;
  discountPct?: number | null;
  kind?: ProductKind;
  deliveryNote?: string | null;
  soldCount?: number;
  featured: boolean;
  weeklyDeal: boolean;
  hot?: boolean;
  isNew?: boolean;
  active: boolean;
  categoryId: string;
  category?: Category;
  availableKeys?: number;
  stock?: number;
  avgRating?: number | null;
  reviewCount?: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
  updatedAt?: string;
};

export type CartItem = {
  id: string;
  productId?: string;
  quantity: number;
  product: Product;
  lineTotalEGP?: number;
};

export type Cart = {
  id: string;
  items: CartItem[];
  itemCount?: number;
  subtotalEGP?: number;
  discountEGP?: number;
  feesEGP?: number;
  taxEGP?: number;
  totalEGP?: number;
  couponCode?: string | null;
  couponError?: string | null;
};

export type OrderItem = {
  id: string;
  productId: string;
  title: string;
  unitPriceEGP: number;
  quantity: number;
  product?: Product;
  productKey?: {
    id?: string;
    code: string | null;
    status: string;
    hidden?: boolean;
  } | null;
};

export type Order = {
  id: string;
  orderNumber?: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
  fulfillmentStatus?: "PENDING" | "DELIVERED" | "FAILED";
  totalEGP: number;
  discountEGP?: number;
  couponCode?: string | null;
  isGift?: boolean;
  recipientName?: string | null;
  recipientEmail?: string | null;
  recipientWhatsApp?: string | null;
  giftMessage?: string | null;
  giftDeliveryMethod?: "EMAIL" | "WHATSAPP" | null;
  giftDelivered?: boolean;
  items: OrderItem[];
  payment?: {
    id: string;
    status: string;
    amountEGP: number;
  } | null;
  createdAt: string;
};

export type CheckoutResponse = {
  orderId: string;
  orderNumber?: string;
  checkoutUrl: string;
  clientSecret?: string;
  publicKey?: string;
  mock?: boolean;
  provider?: string;
  amountEGP?: number;
  totals?: {
    subtotalEGP: number;
    discountEGP: number;
    totalEGP: number;
    couponCode: string | null;
  };
};
