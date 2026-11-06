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

export type CurrencyCode = "EGP" | "SAR" | "AED" | "KWD" | "QAR" | "USD" | "EUR";

export type CurrencyOption = {
  code: CurrencyCode;
  country: string;
  nameAr: string;
  locale: string;
  /** Units of this currency per 1 EGP */
  rateFromEgp: number;
  flag: string;
};

/** Fallback rates (approx.) — refreshed live when possible */
const FALLBACK_RATES: Record<CurrencyCode, number> = {
  EGP: 1,
  SAR: 0.077,
  AED: 0.075,
  KWD: 0.0063,
  QAR: 0.075,
  USD: 0.0205,
  EUR: 0.019,
};

export const CURRENCIES: CurrencyOption[] = [
  {
    code: "EGP",
    country: "EG",
    nameAr: "جنيه مصري",
    locale: "ar-EG",
    rateFromEgp: FALLBACK_RATES.EGP,
    flag: "🇪🇬",
  },
  {
    code: "SAR",
    country: "SA",
    nameAr: "ريال سعودي",
    locale: "ar-SA",
    rateFromEgp: FALLBACK_RATES.SAR,
    flag: "🇸🇦",
  },
  {
    code: "AED",
    country: "AE",
    nameAr: "درهم إماراتي",
    locale: "ar-AE",
    rateFromEgp: FALLBACK_RATES.AED,
    flag: "🇦🇪",
  },
  {
    code: "KWD",
    country: "KW",
    nameAr: "دينار كويتي",
    locale: "ar-KW",
    rateFromEgp: FALLBACK_RATES.KWD,
    flag: "🇰🇼",
  },
  {
    code: "QAR",
    country: "QA",
    nameAr: "ريال قطري",
    locale: "ar-QA",
    rateFromEgp: FALLBACK_RATES.QAR,
    flag: "🇶🇦",
  },
  {
    code: "USD",
    country: "US",
    nameAr: "دولار أمريكي",
    locale: "en-US",
    rateFromEgp: FALLBACK_RATES.USD,
    flag: "🇺🇸",
  },
  {
    code: "EUR",
    country: "EU",
    nameAr: "يورو",
    locale: "de-DE",
    rateFromEgp: FALLBACK_RATES.EUR,
    flag: "🇪🇺",
  },
];

const STORAGE_KEY = "gm_currency";

function detectCurrencyFromLocale(): CurrencyCode {
  if (typeof navigator === "undefined") return "EGP";

  const lang = (navigator.language || "").toLowerCase();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

  if (tz.includes("Cairo") || lang.includes("-eg") || lang.endsWith("eg")) return "EGP";
  if (tz.includes("Riyadh") || lang.includes("-sa")) return "SAR";
  if (tz.includes("Dubai") || lang.includes("-ae")) return "AED";
  if (tz.includes("Kuwait") || lang.includes("-kw")) return "KWD";
  if (tz.includes("Qatar") || lang.includes("-qa")) return "QAR";
  if (lang.startsWith("en-us") || tz.includes("New_York") || tz.includes("Los_Angeles"))
    return "USD";
  if (lang.startsWith("de") || lang.startsWith("fr") || lang.startsWith("es") || tz.includes("Berlin") || tz.includes("Paris"))
    return "EUR";

  return "EGP";
}

function formatMoney(
  amountEgp: number,
  currency: CurrencyOption,
  rates: Record<CurrencyCode, number>,
): string {
  const rate = rates[currency.code] ?? currency.rateFromEgp;
  const converted = amountEgp * rate;
  const fraction = currency.code === "KWD" ? 3 : currency.code === "EGP" ? 0 : 2;

  try {
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
      maximumFractionDigits: fraction,
      minimumFractionDigits: currency.code === "EGP" ? 0 : Math.min(2, fraction),
    }).format(converted);
  } catch {
    return `${converted.toFixed(fraction)} ${currency.code}`;
  }
}

type CurrencyContextValue = {
  currency: CurrencyOption;
  currencyCode: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  setCurrencyCode: (code: CurrencyCode) => void;
  formatPrice: (amountEgp: number | string | null | undefined) => string;
  convertFromEgp: (amountEgp: number) => number;
  detected: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencyCode, setCurrencyCodeState] = useState<CurrencyCode>("EGP");
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(FALLBACK_RATES);
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
    if (saved && CURRENCIES.some((c) => c.code === saved)) {
      setCurrencyCodeState(saved);
    } else {
      setCurrencyCodeState(detectCurrencyFromLocale());
    }
    setDetected(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRates() {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/EGP");
        if (!res.ok) return;
        const data = (await res.json()) as {
          result?: string;
          rates?: Record<string, number>;
        };
        if (cancelled || data.result !== "success" || !data.rates) return;

        const next: Record<CurrencyCode, number> = { ...FALLBACK_RATES };
        for (const c of CURRENCIES) {
          if (c.code === "EGP") next.EGP = 1;
          else if (typeof data.rates[c.code] === "number") next[c.code] = data.rates[c.code];
        }
        setRates(next);
      } catch {
        // keep fallback rates
      }
    }

    loadRates();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrencyCode = useCallback((code: CurrencyCode) => {
    setCurrencyCodeState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const currency = useMemo(
    () => CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0],
    [currencyCode],
  );

  /** Formats a store-base amount (API field currently named priceEGP) into the selected display currency. */
  const formatPrice = useCallback(
    (storeBaseAmount: number | string | null | undefined) => {
      const value =
        typeof storeBaseAmount === "string"
          ? Number(storeBaseAmount)
          : storeBaseAmount ?? 0;
      if (Number.isNaN(value)) return formatMoney(0, currency, rates);
      return formatMoney(value, currency, rates);
    },
    [currency, rates],
  );

  const convertFromEgp = useCallback(
    (amountEgp: number) => amountEgp * (rates[currency.code] ?? currency.rateFromEgp),
    [currency, rates],
  );

  const value = useMemo(
    () => ({
      currency,
      currencyCode,
      rates,
      setCurrencyCode,
      formatPrice,
      convertFromEgp,
      detected,
    }),
    [currency, currencyCode, rates, setCurrencyCode, formatPrice, convertFromEgp, detected],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return ctx;
}
