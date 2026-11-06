export function toNumber(
  value: { toString(): string } | number | string | null | undefined,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return Number(value);
}

export type Lang = 'ar' | 'en';

export function resolveLang(lang?: string | null): Lang {
  return lang?.toLowerCase() === 'en' ? 'en' : 'ar';
}

export function localizeProduct<T extends Record<string, unknown>>(
  product: T,
  lang: Lang = 'ar',
) {
  const titleEn = product.titleEn as string | null | undefined;
  const descriptionEn = product.descriptionEn as string | null | undefined;
  const deliveryNoteEn = product.deliveryNoteEn as string | null | undefined;

  const title =
    lang === 'en' && titleEn
      ? titleEn
      : ((product.title as string) ?? titleEn ?? '');
  const description =
    lang === 'en' && descriptionEn
      ? descriptionEn
      : ((product.description as string) ?? descriptionEn ?? '');
  const deliveryNote =
    lang === 'en' && deliveryNoteEn
      ? deliveryNoteEn
      : ((product.deliveryNote as string | null | undefined) ??
        deliveryNoteEn ??
        null);

  let category = product.category as Record<string, unknown> | undefined;
  if (category) {
    category = localizeCategory(category, lang);
  }

  return {
    ...product,
    title,
    description,
    deliveryNote,
    category,
  };
}

export function localizeCategory<T extends Record<string, unknown>>(
  category: T,
  lang: Lang = 'ar',
) {
  const nameEn = category.nameEn as string | null | undefined;
  const descriptionEn = category.descriptionEn as string | null | undefined;
  const name =
    lang === 'en' && nameEn
      ? nameEn
      : ((category.name as string) ?? nameEn ?? '');
  const description =
    lang === 'en' && descriptionEn
      ? descriptionEn
      : ((category.description as string | null | undefined) ??
        descriptionEn ??
        null);

  return {
    ...category,
    name,
    description,
  };
}

export type PublicProductDto = Record<string, unknown> & {
  id?: string;
  title?: string;
  slug?: string;
  priceEGP: number;
  priceAmount: number;
  originalPrice: number | null;
  compareAtAmount: number | null;
  currencyCode: string;
  region: string | null;
  publicationStatus: unknown;
};

/** Public product DTO — strips private inventory/admin fields. */
export function serializePublicProduct<T extends Record<string, unknown>>(
  product: T,
  lang: Lang = 'ar',
): PublicProductDto {
  const localized = localizeProduct(product, lang);
  const priceEGP = toNumber(
    localized.priceEGP as { toString(): string } | number | string,
  );
  const originalPrice = toNumber(
    localized.originalPrice as
      { toString(): string } | number | string | null | undefined,
  );

  const safe = { ...(localized as Record<string, unknown>) };
  delete safe.internalNotes;
  delete safe.keys;
  delete safe.passwordHash;

  return {
    ...safe,
    priceEGP: priceEGP ?? 0,
    /** Forward-compatible alias of store-base amount */
    priceAmount: priceEGP ?? 0,
    originalPrice,
    compareAtAmount: originalPrice,
    currencyCode: (localized.currencyCode as string) || 'EGP',
    region: (localized.region as string | null | undefined) ?? null,
    publicationStatus: localized.publicationStatus,
  };
}

/** @deprecated Prefer serializePublicProduct for storefront responses */
export function serializeProduct<T extends Record<string, unknown>>(
  product: T,
  lang: Lang = 'ar',
) {
  return serializePublicProduct(product, lang);
}

export function serializeAdminProduct<T extends Record<string, unknown>>(
  product: T,
  lang: Lang = 'ar',
) {
  const base = serializePublicProduct(product, lang);
  return {
    ...base,
    internalNotes: (product.internalNotes as string | null | undefined) ?? null,
    scheduleError: (product.scheduleError as string | null | undefined) ?? null,
    scheduledAt: product.scheduledAt ?? null,
    seoTitle: (product.seoTitle as string | null | undefined) ?? null,
    seoDescription:
      (product.seoDescription as string | null | undefined) ?? null,
    ogImageUrl: (product.ogImageUrl as string | null | undefined) ?? null,
  };
}
