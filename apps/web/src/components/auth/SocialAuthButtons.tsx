"use client";

import { useState } from "react";
import { Gamepad2, Loader2, Mail } from "lucide-react";
import { useLocale } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/lib/auth";

type Provider = "google" | "discord";

export function SocialAuthButtons({
  onError,
}: {
  onError?: (message: string) => void;
}) {
  const ar = useLocale() === "ar";
  const { loginWithProvider, configured } = useAuth();
  const reduceMotion = useReducedMotion();
  const [busy, setBusy] = useState<Provider | null>(null);

  async function start(provider: Provider) {
    setBusy(provider);
    onError?.("");
    try {
      await loginWithProvider(provider);
    } catch (error) {
      onError?.(
        error instanceof Error
          ? error.message
          : ar
            ? "تعذر بدء تسجيل الدخول"
            : "Could not start sign in",
      );
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          type="button"
          disabled={!configured || busy !== null}
          onClick={() => start("google")}
          whileHover={reduceMotion ? undefined : { y: -2 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className="gm-btn gm-btn-secondary !min-h-11 !rounded-[var(--gm-radius-btn)] border-[var(--gm-border-strong)]"
        >
          {busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4.5 w-4.5" />}
          <span>Google</span>
        </motion.button>
        <motion.button
          type="button"
          disabled={!configured || busy !== null}
          onClick={() => start("discord")}
          whileHover={reduceMotion ? undefined : { y: -2 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className="gm-btn !min-h-11 !rounded-[var(--gm-radius-btn)] border border-[#5865F2]/35 bg-[#5865F2]/12 text-[#aeb6ff] hover:bg-[#5865F2]/20 hover:text-white"
        >
          {busy === "discord" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gamepad2 className="h-5 w-5" />}
          <span>Discord</span>
        </motion.button>
      </div>
      <div className="flex items-center gap-3 text-xs text-[var(--gm-text-muted)]">
        <span className="h-px flex-1 bg-[var(--gm-border)]" />
        <span>{ar ? "أو بالبريد الإلكتروني" : "or continue with email"}</span>
        <span className="h-px flex-1 bg-[var(--gm-border)]" />
      </div>
      {!configured ? (
        <p className="text-center text-xs text-[var(--gm-warning)]">
          {ar
            ? "أضف إعدادات Supabase لتفعيل تسجيل الدخول"
            : "Add the Supabase environment variables to enable sign in"}
        </p>
      ) : null}
    </div>
  );
}
