"use client";

import { FormEvent, useState } from "react";
import {
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { AuthShell } from "@/components/auth/AuthShell";

export default function RegisterPage() {
  const ar = useLocale() === "ar";
  const { register, configured } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await register(name, email, password);
      if (result.needsEmailConfirmation) {
        setNotice(
          ar
            ? "تم إنشاء الحساب. افتح رسالة التأكيد في بريدك ثم سجل الدخول."
            : "Account created. Confirm the email we sent you, then sign in.",
        );
        return;
      }
      if (result.user) {
        router.push(result.user.role === "ADMIN" ? "/admin" : "/");
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : ar
            ? "فشل إنشاء الحساب"
            : "Could not create account",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      ar={ar}
      eyebrow={ar ? "ابدأ حسابك" : "CREATE YOUR ACCOUNT"}
      title={ar ? "إنشاء حساب" : "Create account"}
      description={
        ar
          ? "أنشئ حسابك للوصول إلى الطلبات والمفضلة والتسليم الرقمي."
          : "Create an account for orders, saved products, and digital delivery."
      }
    >
      <SocialAuthButtons onError={setError} />

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block space-y-2" htmlFor="reg-name">
          <span className="text-sm font-bold text-[var(--gm-text-secondary)]">
            {ar ? "الاسم" : "Display name"}
          </span>
          <span className="relative block">
            <UserRound className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gm-text-muted)]" aria-hidden />
            <input
              id="reg-name"
              className="gm-input !min-h-12 ps-10"
              placeholder={ar ? "اسمك داخل المتجر" : "Your name in the store"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              minLength={2}
              required
            />
          </span>
        </label>

        <label className="block space-y-2" htmlFor="reg-email">
          <span className="text-sm font-bold text-[var(--gm-text-secondary)]">
            {ar ? "البريد الإلكتروني" : "Email address"}
          </span>
          <span className="relative block">
            <Mail className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gm-text-muted)]" aria-hidden />
            <input
              id="reg-email"
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

        <label className="block space-y-2" htmlFor="reg-password">
          <span className="flex items-center justify-between gap-3 text-sm font-bold text-[var(--gm-text-secondary)]">
            <span>{ar ? "كلمة المرور" : "Password"}</span>
            <span className="text-[11px] font-medium text-[var(--gm-text-muted)]">
              {ar ? "8 أحرف على الأقل" : "At least 8 characters"}
            </span>
          </span>
          <span className="relative block">
            <LockKeyhole className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gm-text-muted)]" aria-hidden />
            <input
              id="reg-password"
              className="gm-input !min-h-12 ps-10 pe-11"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
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

        {notice ? (
          <p className="flex items-start gap-2 rounded-[10px] border border-emerald-500/25 bg-emerald-500/8 px-3 py-2.5 text-sm leading-6 text-emerald-300" role="status">
            <CircleCheck className="mt-1 h-4 w-4 shrink-0" aria-hidden />
            <span>{notice}</span>
          </p>
        ) : null}

        <p className="text-xs leading-6 text-[var(--gm-text-muted)]">
          {ar ? "بإنشاء الحساب أنت توافق على" : "By creating an account, you agree to the"}{" "}
          <Link href="/terms" className="font-bold text-[var(--gm-text-secondary)] hover:text-[var(--gm-violet-400)]">
            {ar ? "الشروط" : "Terms"}
          </Link>{" "}
          {ar ? "و" : "and"}{" "}
          <Link href="/privacy" className="font-bold text-[var(--gm-text-secondary)] hover:text-[var(--gm-violet-400)]">
            {ar ? "الخصوصية" : "Privacy Policy"}
          </Link>
          .
        </p>

        <button
          type="submit"
          disabled={busy || !configured}
          className="gm-btn gm-btn-primary w-full !min-h-12 !rounded-[11px]"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {busy
            ? ar
              ? "جاري إنشاء الحساب…"
              : "Creating account…"
            : ar
              ? "إنشاء الحساب"
              : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--gm-text-muted)]">
        {ar ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
        <Link href="/login" className="font-extrabold text-[var(--gm-violet-400)] transition hover:text-[var(--gm-violet-300)]">
          {ar ? "تسجيل الدخول" : "Sign in"}
        </Link>
      </p>
    </AuthShell>
  );
}
