import { Book } from '../types/catalog';

export function slugifyTitle(title: string) {
  return title.trim().replace(/\s+/g, '-');
}

export function getBookSlug(book: Book) {
  const baseTitle = book.title_he?.trim() || book.title_en?.trim() || book.id;
  return slugifyTitle(baseTitle);
}

export function findBookBySlug(books: Book[], slug: string) {
  return books.find((book) => getBookSlug(book) === slug);
}
