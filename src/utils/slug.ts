export function createSlugFromTitle(title: string): string {
  return title.trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

export function normalizeSlug(value: string): string {
  return createSlugFromTitle(value).toLowerCase();
}

export function buildProductSlug({
  id,
  title_he,
  title_en,
  item_number,
}: {
  id: string;
  title_he?: string;
  title_en?: string;
  item_number?: string | null;
}): string {
  const title = title_he || title_en || id;
  const sku = item_number ?? id;

  const titleSlug = createSlugFromTitle(String(title));
  const skuSlug = createSlugFromTitle(String(sku));

  return `${titleSlug}-sku-${skuSlug}`;
}

export function buildProductPath(book: {
  id: string;
  title_he?: string;
  title_en?: string;
  item_number?: string | null;
}): string {
  const slug = buildProductSlug(book);
  return `/item/${encodeURIComponent(slug)}`;
}

export function extractSkuFromSlug(slug: string): string | null {
  const match = normalizeSlug(slug).match(/-sku-(.+)$/);
  return match ? match[1] : null;
}
