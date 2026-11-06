import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductsRedirectPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const raw = await searchParams;
  const qs = new URLSearchParams();
  Object.entries(raw).forEach(([key, value]) => {
    if (typeof value === "string") qs.set(key, value);
    else if (Array.isArray(value) && value[0]) qs.set(key, value[0]);
  });
  const query = qs.toString();
  redirect(query ? `/${locale}/shop?${query}` : `/${locale}/shop`);
}
