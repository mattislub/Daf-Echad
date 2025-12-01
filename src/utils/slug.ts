export function createSlugFromTitle(title: string): string {
  return title.trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

export function normalizeSlug(value: string): string {
  return createSlugFromTitle(value).toLowerCase();
}
