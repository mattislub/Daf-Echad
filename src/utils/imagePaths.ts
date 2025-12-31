import { Book } from '../types/catalog';

const PRODUCT_IMAGE_BASE_PATH = (import.meta.env.VITE_PRODUCT_IMAGE_BASE || '/api/product-images').replace(
  /\/+$/,
  '',
);

const IMAGE_SUFFIXES = ['A', 'B', 'C', 'D'];

function normalizeItemNumber(itemNumber?: string | null): string | null {
  if (!itemNumber) return null;

  const compacted = itemNumber.replace(/\s+/g, '').trim();
  if (!compacted) return null;

  const withoutSuffix = compacted.replace(/[A-D]$/i, '');
  return withoutSuffix || compacted;
}

function buildImageUrl(itemNumber: string, suffix: string): string {
  const sanitizedBase = PRODUCT_IMAGE_BASE_PATH || '';
  const normalizedBasePath = sanitizedBase.startsWith('/') ? sanitizedBase : `/${sanitizedBase}`;

  return `${normalizedBasePath}/${itemNumber}${suffix}.jpg`;
}

export function buildItemNumberImageUrls(itemNumber?: string | null): string[] {
  const normalizedItemNumber = normalizeItemNumber(itemNumber);
  if (!normalizedItemNumber) return [];

  return IMAGE_SUFFIXES.map((suffix) => buildImageUrl(normalizedItemNumber, suffix));
}

export function resolveBookImages(book: Book): string[] {
  const dynamicImages = buildItemNumberImageUrls(book.item_number);
  const galleryImages =
    book.images
      ?.slice()
      .sort((a, b) => a.position - b.position)
      .map((image) => image.image_url)
      .filter(Boolean) ?? [];
  const fallbackImages = book.image_url ? [book.image_url] : [];

  return Array.from(new Set([...dynamicImages, ...galleryImages, ...fallbackImages]));
}

export function resolvePrimaryImage(book: Book): string {
  const [primaryImage] = resolveBookImages(book);
  return primaryImage || '';
}
