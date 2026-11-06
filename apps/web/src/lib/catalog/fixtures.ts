/**
 * Development fixtures for Gamers Matrix storefront.
 * Used only when the API is unavailable or returns empty for a query.
 * Clearly segregated from live production data.
 */
import type { Category, Product } from "@/lib/api";

export const FIXTURE_SOURCE = "dev-fixtures" as const;

export const FIXTURE_CATEGORIES: Category[] = [
  {
    id: "cat-games",
    name: "ألعاب",
    slug: "games",
    description: "أكواد ألعاب رقمية لمنصات متعددة",
    icon: "gamepad",
  },
  {
    id: "cat-gift",
    name: "بطاقات هدايا",
    slug: "gift-cards",
    description: "بطاقات شحن وهدايا رقمية",
    icon: "gift",
  },
  {
    id: "cat-topup",
    name: "شحن مباشر",
    slug: "top-ups",
    description: "شحن أرصدة وخدمات داخل الألعاب",
    icon: "zap",
  },
  {
    id: "cat-offers",
    name: "عروض",
    slug: "offers",
    description: "منتجات عليها خصم صالح حالياً",
    icon: "tag",
  },
  {
    id: "cat-services",
    name: "خدمات",
    slug: "services",
    description: "خدمات تفعيل وحسابات",
    icon: "wrench",
  },
];

/** Branded placeholder (not a fake game cover). */
export const PRODUCT_ART_PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#100C19"/>
          <stop offset="100%" stop-color="#2A0E4E"/>
        </linearGradient>
      </defs>
      <rect width="600" height="800" fill="url(#g)"/>
      <text x="300" y="390" text-anchor="middle" fill="#B96AFF" font-family="sans-serif" font-size="28" font-weight="700">GAMERS MATRIX</text>
      <text x="300" y="430" text-anchor="middle" fill="#9486A6" font-family="sans-serif" font-size="16">Artwork placeholder</text>
    </svg>`,
  );

/**
 * Demo catalog amounts are in the store base unit used by the API today (EGP field).
 * Display currency is chosen by the storefront currency layer — never hardcode in UI.
 */
export const FIXTURE_PRODUCTS: Product[] = [
  {
    id: "demo-gow",
    title: "God of War Ragnarök",
    slug: "god-of-war-ragnarok",
    description:
      "انطلق في رحلة ملحمية مع كراتوس وأتريوس عبر الممالك التسعة.",
    imageUrl:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    platform: "PlayStation 5",
    priceEGP: 1299,
    originalPrice: 1899,
    discountPct: 32,
    kind: "GAME_KEY",
    featured: true,
    weeklyDeal: false,
    hot: true,
    isNew: false,
    active: true,
    categoryId: "cat-games",
    availableKeys: 5,
  },
  {
    id: "demo-elden",
    title: "Elden Ring",
    slug: "elden-ring",
    description: "عالم مفتوح مظلم من صناع Dark Souls.",
    imageUrl:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    platform: "PC",
    priceEGP: 999,
    originalPrice: 1499,
    discountPct: 33,
    kind: "GAME_KEY",
    featured: true,
    weeklyDeal: false,
    isNew: true,
    active: true,
    categoryId: "cat-games",
    availableKeys: 8,
  },
  {
    id: "demo-spiderman",
    title: "Marvel's Spider-Man 2",
    slug: "spiderman-2",
    description: "بيتر ومايلز يواجهان تهديدات جديدة في نيويورك.",
    imageUrl:
      "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=800&q=80",
    platform: "PlayStation 5",
    priceEGP: 1599,
    originalPrice: 2199,
    discountPct: 27,
    kind: "GAME_KEY",
    featured: true,
    weeklyDeal: false,
    isNew: true,
    active: true,
    categoryId: "cat-games",
    availableKeys: 3,
  },
  {
    id: "demo-steam-wallet",
    title: "Steam Wallet 50",
    slug: "steam-wallet-50",
    description: "بطاقة محفظة Steam رقمية.",
    imageUrl:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    platform: "Steam",
    priceEGP: 450,
    kind: "GIFT_CARD",
    featured: true,
    weeklyDeal: true,
    active: true,
    categoryId: "cat-gift",
    availableKeys: 20,
    deliveryNote: "يُسلَّم الكود رقمياً بعد تأكيد الدفع من الخادم.",
  },
  {
    id: "demo-psn",
    title: "PlayStation Store 100",
    slug: "psn-100",
    description: "بطاقة PlayStation Store.",
    imageUrl:
      "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=800&q=80",
    platform: "PlayStation",
    priceEGP: 890,
    originalPrice: 990,
    discountPct: 10,
    kind: "GIFT_CARD",
    featured: false,
    weeklyDeal: true,
    active: true,
    categoryId: "cat-gift",
    availableKeys: 12,
  },
  {
    id: "demo-pubg",
    title: "PUBG UC 660",
    slug: "pubg-uc-660",
    description: "شحن عملة UC داخل اللعبة.",
    imageUrl:
      "https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=800&q=80",
    platform: "Mobile",
    priceEGP: 320,
    kind: "TOP_UP",
    featured: true,
    weeklyDeal: false,
    hot: true,
    active: true,
    categoryId: "cat-topup",
    availableKeys: 50,
    deliveryNote: "قد يُطلب معرّف اللاعب. توافق المنطقة يظهر قبل الدفع.",
  },
  {
    id: "demo-freefire",
    title: "Free Fire Diamonds 520",
    slug: "free-fire-520",
    description: "شحن ألماس Free Fire.",
    imageUrl:
      "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=800&q=80",
    platform: "Mobile",
    priceEGP: 210,
    kind: "TOP_UP",
    featured: false,
    weeklyDeal: true,
    active: true,
    categoryId: "cat-topup",
    availableKeys: 40,
  },
  {
    id: "demo-hogwarts",
    title: "Hogwarts Legacy",
    slug: "hogwarts-legacy",
    description: "مغامرة في عالم السحر.",
    imageUrl:
      "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=800&q=80",
    platform: "PC",
    priceEGP: 899,
    originalPrice: 1399,
    discountPct: 35,
    kind: "GAME_KEY",
    featured: true,
    weeklyDeal: true,
    active: true,
    categoryId: "cat-offers",
    availableKeys: 6,
  },
  {
    id: "demo-nitro",
    title: "Discord Nitro — شهر",
    slug: "discord-nitro-monthly",
    description: "رابط تفعيل Discord Nitro لمدة شهر.",
    imageUrl:
      "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&w=800&q=80",
    platform: "Discord",
    priceEGP: 189,
    originalPrice: 249,
    discountPct: 24,
    kind: "SERVICE",
    featured: true,
    weeklyDeal: true,
    active: true,
    categoryId: "cat-services",
    availableKeys: 15,
    deliveryNote: "افتح الرابط وأنت مسجّل بحساب Discord المطلوب.",
  },
  {
    id: "demo-ps-act",
    title: "تفعيل حساب PlayStation",
    slug: "psn-account-activation",
    description: "خدمة تفعيل حساب بلايستيشن.",
    imageUrl:
      "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=800&q=80",
    platform: "PlayStation",
    priceEGP: 149,
    kind: "SERVICE",
    featured: false,
    weeklyDeal: false,
    active: true,
    categoryId: "cat-services",
    availableKeys: 0,
    stock: 0,
    deliveryNote: "بعد الدفع تصل تعليمات التفعيل عبر صفحة الطلب.",
  },
  {
    id: "demo-bg3",
    title: "Baldur's Gate 3",
    slug: "baldurs-gate-3",
    description: "مغامرة تقمص أدوار.",
    imageUrl:
      "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=800&q=80",
    platform: "PC",
    priceEGP: 1699,
    kind: "GAME_KEY",
    featured: true,
    weeklyDeal: false,
    isNew: true,
    active: true,
    categoryId: "cat-games",
    availableKeys: 4,
  },
  {
    id: "demo-gta",
    title: "Grand Theft Auto V",
    slug: "gta-v",
    description: "عيش حياة الإجرام في لوس سانتوس.",
    imageUrl:
      "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=800&q=80",
    platform: "PC",
    priceEGP: 699,
    originalPrice: 999,
    discountPct: 30,
    kind: "GAME_KEY",
    featured: false,
    weeklyDeal: true,
    active: true,
    categoryId: "cat-offers",
    availableKeys: 10,
  },
];
