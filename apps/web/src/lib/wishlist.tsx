"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, type Product } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type WishlistRow = { id: string; product: Product };

type WishlistContextValue = {
  productIds: Set<string>;
  items: WishlistRow[];
  loading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggle: (productId: string) => Promise<"added" | "removed" | "login">;
  refresh: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await api.get<WishlistRow[]>("/wishlist");
      setItems(rows);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const productIds = useMemo(
    () => new Set(items.map((r) => r.product.id)),
    [items],
  );

  const isWishlisted = useCallback(
    (productId: string) => productIds.has(productId),
    [productIds],
  );

  const toggle = useCallback(
    async (productId: string) => {
      if (!user) return "login" as const;

      if (productIds.has(productId)) {
        await api.delete(`/wishlist/${productId}`);
        setItems((prev) => prev.filter((r) => r.product.id !== productId));
        return "removed" as const;
      }
      await api.post("/wishlist", { productId });
      await refresh();
      return "added" as const;
    },
    [user, productIds, refresh],
  );

  const value = useMemo(
    () => ({
      productIds,
      items,
      loading,
      isWishlisted,
      toggle,
      refresh,
    }),
    [productIds, items, loading, isWishlisted, toggle, refresh],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return ctx;
}
