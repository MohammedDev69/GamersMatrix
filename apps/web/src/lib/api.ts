const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export type ApiError = {
  message: string;
  statusCode?: number;
  error?: string;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("gm_token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("gm_token", token);
  else localStorage.removeItem("gm_token");
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers || {});
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!headers.has("Content-Type") && options.body && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    ...options,
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
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
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

/** @deprecated Prefer catalog repository */
export { FIXTURE_PRODUCTS as FALLBACK_PRODUCTS } from "@/lib/catalog/fixtures";
