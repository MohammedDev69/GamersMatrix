export type PageQuery = {
  page?: string | number;
  pageSize?: string | number;
};

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

export function parsePage(
  query: PageQuery,
  defaults = { page: 1, pageSize: 20 },
) {
  const pageRaw = Number(query.page ?? defaults.page);
  const sizeRaw = Number(query.pageSize ?? defaults.pageSize);
  const page =
    Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const pageSize =
    Number.isFinite(sizeRaw) && sizeRaw > 0
      ? Math.min(Math.floor(sizeRaw), 100)
      : defaults.pageSize;
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip, take: pageSize };
}

export function pageMeta(
  total: number,
  page: number,
  pageSize: number,
): PageMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasMore: page * pageSize < total,
  };
}
