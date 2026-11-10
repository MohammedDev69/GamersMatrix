"use client";

import { FormEvent, useState } from "react";
import { CircleAlert, Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { AuthShell } from "@/components/auth/AuthShell";

export default function LoginPage() {
  const ar = useLocale() === "ar";
  const { login, configured } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await login(email, password);
      router.push(user.role === "ADMIN" ? "/admin" : "/");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : ar
            ? "فشل تسجيل الدخول"
            : "Sign in failed",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      ar={ar}
      eyebrow={ar ? "مرحبًا بعودتك" : "WELCOME BACK"}
      title={ar ? "تسجيل الدخول" : "Sign in"}
      description={
        ar
          ? "ادخل إلى طلباتك ومشترياتك الرقمية بأمان."
          : "Securely access your digital purchases and orders."
      }
    >
      <SocialAuthButtons onError={setError} />

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block space-y-2" htmlFor="login-email">
          <span className="text-sm font-bold text-[var(--gm-text-secondary)]">
            {ar ? "البريد الإلكتروني" : "Email address"}
          </span>
          <span className="relative block">
            <Mail className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gm-text-muted)]" aria-hidden />
            <input
              id="login-email"
              className="gm-input !min-h-12 ps-10"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              required
            />
          </span>
        </label>

        <label className="block space-y-2" htmlFor="login-password">
          <span className="text-sm font-bold text-[var(--gm-text-secondary)]">
            {ar ? "كلمة المرور" : "Password"}
          </span>
          <span className="relative block">
            <LockKeyhole className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gm-text-muted)]" aria-hidden />
            <input
              id="login-password"
              className="gm-input !min-h-12 ps-10 pe-11"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute end-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[8px] text-[var(--gm-text-muted)] transition hover:bg-[var(--gm-surface-hover)] hover:text-[var(--gm-text)]"
              aria-label={ar ? "إظهار أو إخفاء كلمة المرور" : "Show or hide password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>

        {error ? (
          <p className="flex items-start gap-2 rounded-[10px] border border-red-500/25 bg-red-500/8 px-3 py-2.5 text-sm leading-6 text-red-300" role="alert">
            <CircleAlert className="mt-1 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy || !configured}
          className="gm-btn gm-btn-primary w-full !min-h-12 !rounded-[11px]"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {busy
            ? ar
              ? "جاري الدخول…"
              : "Signing in…"
            : ar
              ? "دخول آمن"
              : "Secure sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--gm-text-muted)]">
        {ar ? "ليس لديك حساب؟" : "New to Gamers Matrix?"}{" "}
        <Link href="/register" className="font-extrabold text-[var(--gm-violet-400)] transition hover:text-[var(--gm-violet-300)]">
          {ar ? "إنشاء حساب" : "Create account"}
        </Link>
      </p>
    </AuthShell>
  );
}
