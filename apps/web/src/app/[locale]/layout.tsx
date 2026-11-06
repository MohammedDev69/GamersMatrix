import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { CurrencyProvider } from "@/lib/currency";
import { SetLocaleAttributes } from "@/components/layout/SetLocaleAttributes";
import { ToastProvider } from "@/components/ui/Toast";
import { WishlistProvider } from "@/lib/wishlist";
import { routing } from "@/i18n/routing";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <>
      <SetLocaleAttributes locale={locale} dir={dir} />
      <NextIntlClientProvider messages={messages}>
        <CurrencyProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <ToastProvider>{children}</ToastProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </CurrencyProvider>
      </NextIntlClientProvider>
    </>
  );
}
