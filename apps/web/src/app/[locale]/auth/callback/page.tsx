"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const locale = useLocale();
  const router = useRouter();
  const { refresh } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function finishSignIn() {
      try {
        const supabase = getSupabaseBrowserClient();
        const searchParams = new URLSearchParams(window.location.search);
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const code = searchParams.get("code");

        if (!session && code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        await refresh();
        if (!active) return;
        const next = searchParams.get("next") || "/";
        router.replace(next.startsWith("/") ? next : "/");
      } catch (cause) {
        if (!active) return;
        setError(
          cause instanceof Error
            ? cause.message
            : locale === "ar"
              ? "تعذر إكمال تسجيل الدخول"
              : "Could not complete sign in",
        );
      }
    }

    void finishSignIn();
    return () => {
      active = false;
    };
  }, [locale, refresh, router]);

  return (
    <main className="gm-container flex min-h-[60vh] items-center justify-center py-16">
      <div className="gm-card w-full max-w-md p-8 text-center">
        {error ? (
          <>
            <h1 className="text-xl font-extrabold">
              {locale === "ar" ? "تعذر تسجيل الدخول" : "Sign-in failed"}
            </h1>
            <p className="mt-3 text-sm text-[var(--gm-danger)]">{error}</p>
            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="gm-btn gm-btn-primary mt-6"
            >
              {locale === "ar" ? "العودة لتسجيل الدخول" : "Back to sign in"}
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-7 w-7 animate-spin text-[var(--gm-violet-400)]" />
            <p className="font-bold">
              {locale === "ar" ? "جاري تأمين حسابك…" : "Securing your account…"}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
