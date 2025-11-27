import { Author, Book, Category, Publisher } from '../types/catalog';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5174/api';

if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn(
    `VITE_API_BASE_URL is not defined. Falling back to default: ${API_BASE_URL}`,
  );
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function getBooks(): Promise<Book[]> {
  return fetchJson<Book[]>('/books');
}

export async function getCategories(): Promise<Category[]> {
  return fetchJson<Category[]>('/categories');
}

export async function getPublishers(): Promise<Publisher[]> {
  return fetchJson<Publisher[]>('/publishers');
}

export async function getAuthors(): Promise<Author[]> {
  return fetchJson<Author[]>('/authors');
}

export async function getBookById(bookId: string): Promise<Book | null> {
  return fetchJson<Book | null>(`/books/${bookId}`);
}

export async function getRelatedBooks(categoryId: string | null, bookId: string): Promise<Book[]> {
  if (!categoryId) return [];
  return fetchJson<Book[]>(`/books?category_id=${categoryId}&exclude=${bookId}&limit=4`);
}

export async function getPopularBooks(bookId: string): Promise<Book[]> {
  return fetchJson<Book[]>(`/books?featured=true&exclude=${bookId}&limit=4`);
}
