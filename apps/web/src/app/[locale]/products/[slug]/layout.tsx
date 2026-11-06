import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/catalog/repository";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const { product } = await getProductBySlug(slug, locale);
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ).replace(/\/$/, "");

  if (!product) {
    return {
      title: "Product | Gamers Matrix",
      robots: { index: false },
    };
  }

  const title = product.seoTitle || `${product.title} | Gamers Matrix`;
  const description =
    product.seoDescription ||
    product.description?.slice(0, 160) ||
    "Digital game products and top-ups from Gamers Matrix.";
  const canonical = `${siteUrl}/${locale}/products/${product.slug}`;
  const ogImage = product.ogImageUrl || product.imageUrl;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ar: `${siteUrl}/ar/products/${product.slug}`,
        en: `${siteUrl}/en/products/${product.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Gamers Matrix",
      locale: locale === "ar" ? "ar_EG" : "en_US",
      type: "website",
      images: ogImage ? [{ url: ogImage, alt: product.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default function ProductSlugLayout({ children }: Props) {
  return children;
}
