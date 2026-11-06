"use client";

import { MessageCircle } from "lucide-react";

const WHATSAPP =
  process.env.NEXT_PUBLIC_WHATSAPP?.replace(/[^\d]/g, "") || "201000000000";

export function WhatsAppFab() {
  const href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    "مرحباً، أحتاج مساعدة بخصوص طلب في Gamers Matrix",
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل عبر واتساب"
      className="fixed bottom-5 end-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_28px_rgba(37,211,102,0.45)] transition duration-200 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gm-violet-500)] motion-reduce:transition-none"
    >
      <MessageCircle className="h-7 w-7" fill="currentColor" />
    </a>
  );
}
