"use client";

import { FormEvent, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await register(name, email, password);
      router.push(user.role === "ADMIN" ? "/admin" : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل إنشاء الحساب");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 h-64 w-64 rounded-full bg-[#581c87]/40 blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 h-48 w-48 rounded-full bg-[#7c3aed]/25 blur-[80px]" />
      </div>

      <form
        onSubmit={onSubmit}
        className="gm-gcard w-full max-w-md space-y-5 p-7 md:p-8"
      >
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#581c87] to-[#7c3aed] text-lg font-extrabold text-white shadow-[0_0_24px_rgba(88,28,135,0.55)]">
            M
          </div>
          <h1 className="text-2xl font-extrabold text-white">إنشاء حساب</h1>
          <p className="text-sm text-[var(--gm-muted)]">
            انضم إلى متجر Gamers Matrix الرقمي
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm text-[var(--gm-muted)]" htmlFor="reg-name">
            الاسم
          </label>
          <input
            id="reg-name"
            className="gm-input"
            placeholder="اسمك"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm text-[var(--gm-muted)]" htmlFor="reg-email">
            البريد الإلكتروني
          </label>
          <input
            id="reg-email"
            className="gm-input"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm text-[var(--gm-muted)]" htmlFor="reg-password">
            كلمة المرور
          </label>
          <input
            id="reg-password"
            className="gm-input"
            type="password"
            placeholder="6 أحرف على الأقل"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            autoComplete="new-password"
            required
          />
        </div>

        {error ? (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400 ring-1 ring-rose-500/30">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={busy} className="gm-btn gm-btn-primary w-full !py-3">
          {busy ? "جاري الإنشاء..." : "إنشاء حساب"}
        </button>

        <p className="text-center text-sm text-[var(--gm-muted)]">
          لديك حساب؟{" "}
          <Link href="/login" className="font-semibold text-[var(--gm-accent-bright)] hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </form>
    </div>
  );
}
