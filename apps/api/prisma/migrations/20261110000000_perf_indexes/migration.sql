-- Performance indexes for the storefront catalog.
--
-- Every public listing filters on (active, publicationStatus) and then sorts by
-- one of the columns below. Without a composite index Postgres has to sort the
-- whole matching set on each cold request.
CREATE INDEX IF NOT EXISTS "Product_active_publicationStatus_createdAt_idx" ON "Product"("active", "publicationStatus", "createdAt");
CREATE INDEX IF NOT EXISTS "Product_active_publicationStatus_soldCount_idx" ON "Product"("active", "publicationStatus", "soldCount");
CREATE INDEX IF NOT EXISTS "Product_active_publicationStatus_priceEGP_idx" ON "Product"("active", "publicationStatus", "priceEGP");
CREATE INDEX IF NOT EXISTS "Product_active_publicationStatus_featured_idx" ON "Product"("active", "publicationStatus", "featured");
CREATE INDEX IF NOT EXISTS "Product_active_publicationStatus_weeklyDeal_idx" ON "Product"("active", "publicationStatus", "weeklyDeal");
CREATE INDEX IF NOT EXISTS "Product_active_publicationStatus_hot_idx" ON "Product"("active", "publicationStatus", "hot");
CREATE INDEX IF NOT EXISTS "Product_active_publicationStatus_isNew_idx" ON "Product"("active", "publicationStatus", "isNew");
CREATE INDEX IF NOT EXISTS "Product_active_publicationStatus_kind_idx" ON "Product"("active", "publicationStatus", "kind");
CREATE INDEX IF NOT EXISTS "Product_active_publicationStatus_categoryId_idx" ON "Product"("active", "publicationStatus", "categoryId");

-- Rating aggregation (groupBy productId) and product review lists.
CREATE INDEX IF NOT EXISTS "Review_productId_createdAt_idx" ON "Review"("productId", "createdAt");

-- Admin order tables sort by newest first, optionally filtered by status.
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- Trigram search (optional): `contains` compiles to LIKE '%term%', which a
-- btree index cannot serve. Create the extension if the role allows it; skip
-- silently on managed databases where it must be enabled from the dashboard.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'pg_trgm unavailable, skipping trigram indexes';
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE INDEX IF NOT EXISTS "Product_title_trgm_idx" ON "Product" USING gin ("title" gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS "Product_titleEn_trgm_idx" ON "Product" USING gin ("titleEn" gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS "Product_platform_trgm_idx" ON "Product" USING gin ("platform" gin_trgm_ops);
  END IF;
END $$;
