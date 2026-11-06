"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, FALLBACK_PRODUCTS, type Product } from "@/lib/api";
import { useCurrency } from "@/lib/currency";

export function HeroBanner() {
  const [items, setItems] = useState<Product[]>([]);
  const [active, setActive] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    api
      .get<Product[]>("/products?featured=true")
      .then((data) => {
        const list = (data.length ? data : FALLBACK_PRODUCTS.filter((p) => p.featured)).slice(0, 4);
        setItems(list.length ? list : FALLBACK_PRODUCTS.slice(0, 4));
      })
      .catch(() =>
        setItems(FALLBACK_PRODUCTS.filter((p) => p.featured).slice(0, 4)),
      );
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % items.length);
    }, 6000);
    return () => clearInterval(id);
  }, [items.length, active]);

  useEffect(() => {
    setProgressKey((k) => k + 1);
  }, [active]);

  const current = items[active] ?? items[0];

  if (!current) {
    return (
      <section className="aspect-[21/9] animate-pulse rounded-[var(--gm-radius-card)] bg-[var(--gm-surface)]" />
    );
  }

  return (
    <section className="gm-hero gm-animate-fade-up">
      <div key={`bg-${current.id}`} className="gm-animate-fade-in absolute inset-0 -z-10">
        <Image src={current.imageUrl} alt="" fill priority className="scale-125 object-cover opacity-35 blur-3xl" sizes="50vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#12091a] via-[#12091a]/60 to-[#12091a]/20" />
      </div>

      <div className="grid items-center gap-8 p-6 md:p-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div key={`copy-${current.id}`} className="gm-animate-hero-copy order-2 space-y-5 lg:order-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--gm-border-strong)] bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-[var(--gm-accent-bright)] backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7c3aed] shadow-[0_0_10px_#7c3aed]" />
            {current.platform}
          </span>
          <h1 className="gm-grad-text max-w-xl text-4xl font-extrabold leading-[1.25] md:text-6xl">{current.title}</h1>
          <p className="line-clamp-3 max-w-lg text-sm leading-8 text-white/70 md:text-base">{current.description}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <span className="gm-display text-3xl font-bold text-white">{formatPrice(current.priceEGP)}</span>
            {current.originalPrice ? <span className="text-base text-white/40 line-through">{formatPrice(current.originalPrice)}</span> : null}
            {current.discountPct ? <span className="gm-animate-badge rounded-full bg-gradient-to-l from-[#6b21a8] to-[#581c87] px-3 py-1 text-xs font-bold text-white">وفّر {current.discountPct}%</span> : null}
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href={`/products/${current.slug}`} className="gm-btn gm-btn-primary !px-7 !py-3 text-base">اشتري الآن</Link>
            <Link href="/products" className="gm-btn gm-btn-outline !px-6 !py-3 text-base backdrop-blur">تصفح المتجر</Link>
          </div>
        </div>

        <Link href={`/products/${current.slug}`} key={`cover-${current.id}`} className="gm-animate-scale-in order-1 mx-auto block w-[min(70%,300px)] lg:order-2">
          <div className="gm-hero-float relative" style={{ animation: "gm-float-tilt 6s ease-in-out infinite" }}>
            <div className="absolute -inset-6 rounded-[40px] bg-[radial-gradient(circle,rgba(88,28,135,0.55),transparent_70%)] blur-2xl" />
            <div className="gm-ring" />
            <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-white/20 shadow-[0_30px_70px_rgba(124,58,237,0.6)]">
              <Image src={current.imageUrl} alt={current.title} fill priority className="object-cover" sizes="300px" />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
            </div>
          </div>
        </Link>
      </div>

      <ul className="flex gap-2 overflow-x-auto border-t border-[var(--gm-border)] bg-black/20 p-3 backdrop-blur md:px-12">
        {items.map((item, i) => {
          const selected = i === active;
          return (
            <li key={item.id} className="min-w-[180px] flex-1">
              <button type="button" onClick={() => setActive(i)} className={`relative flex w-full items-center gap-3 overflow-hidden rounded-2xl p-2 text-start transition duration-300 ${selected ? "bg-white/10" : "opacity-60 hover:bg-white/5 hover:opacity-100"}`}>
                <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded-lg">
                  <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="40px" />
                </span>
                <span className="line-clamp-2 text-sm font-medium leading-snug text-white">{item.title}</span>
                {selected ? <span key={progressKey} className="gm-hero-progress absolute inset-x-0 bottom-0 h-0.5 origin-right bg-gradient-to-l from-[#7c3aed] to-[#581c87]" /> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
