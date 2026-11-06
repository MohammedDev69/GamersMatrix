"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, type Cart, type CartItem, type Product } from "./api";
import { useAuth } from "./auth";

type CartContextValue = {
  cart: Cart | null;
  items: CartItem[];
  count: number;
  loading: boolean;
  refresh: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  localAdd: (product: Product) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const LOCAL_KEY = "gm_guest_cart";

type LocalItem = { product: Product; quantity: number };

function readLocal(): LocalItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]") as LocalItem[];
  } catch {
    return [];
  }
}

function writeLocal(items: LocalItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [localItems, setLocalItems] = useState<LocalItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(null);
      setLocalItems(readLocal());
      return;
    }
    setLoading(true);
    try {
      const data = await api.get<Cart>("/cart");
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      if (!user) throw new Error("يجب تسجيل الدخول لإضافة للسلة");
      await api.post("/cart/items", { productId, quantity });
      await refresh();
    },
    [user, refresh],
  );

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      if (!user) return;
      await api.patch(`/cart/items/${itemId}`, { quantity });
      await refresh();
    },
    [user, refresh],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!user) {
        const next = readLocal().filter((_, i) => String(i) !== itemId);
        writeLocal(next);
        setLocalItems(next);
        return;
      }
      await api.delete(`/cart/items/${itemId}`);
      await refresh();
    },
    [user, refresh],
  );

  const clear = useCallback(async () => {
    if (!user) {
      writeLocal([]);
      setLocalItems([]);
      return;
    }
    await api.delete("/cart");
    await refresh();
  }, [user, refresh]);

  const localAdd = useCallback((product: Product) => {
    const current = readLocal();
    const idx = current.findIndex((i) => i.product.id === product.id);
    if (idx >= 0) current[idx].quantity += 1;
    else current.push({ product, quantity: 1 });
    writeLocal(current);
    setLocalItems(current);
  }, []);

  const items: CartItem[] = useMemo(() => {
    if (user && cart) return cart.items || [];
    return localItems.map((item, index) => ({
      id: String(index),
      productId: item.product.id,
      quantity: item.quantity,
      product: item.product,
    }));
  }, [user, cart, localItems]);

  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      cart,
      items,
      count,
      loading,
      refresh,
      addItem,
      updateItem,
      removeItem,
      clear,
      localAdd,
    }),
    [
      cart,
      items,
      count,
      loading,
      refresh,
      addItem,
      updateItem,
      removeItem,
      clear,
      localAdd,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
