import { StoreShell } from "@/components/layout/StoreShell";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ProductSection } from "@/components/home/ProductSection";
import { CategoryStrip } from "@/components/home/CategoryStrip";
import { TrustBar } from "@/components/home/TrustBar";

export default function HomePage() {
  return (
    <StoreShell>
      <HeroCarousel />
      <CategoryStrip />
      <ProductSection titleKey="offers" countdown query={{ weeklyDeal: true, sort: "popular" }} viewAllHref="/offers" />
      <ProductSection titleKey="featured" query={{ featured: true, sort: "popular" }} viewAllHref="/shop?sort=popular" />
      <ProductSection titleKey="newReleases" query={{ isNew: true, sort: "newest" }} viewAllHref="/shop?filter=new&sort=newest" />
      <ProductSection titleKey="directTopUp" query={{ kind: "TOP_UP", sort: "popular" }} viewAllHref="/top-ups" />
      <TrustBar />
    </StoreShell>
  );
}
