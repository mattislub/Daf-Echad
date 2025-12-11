import { Author, Book, Category, Publisher } from '../types/catalog';

export interface CustomerCreditEntry {
  id: string;
  customerId: string;
  date: string;
  code: string;
  description: string;
  amount: number;
  orderId: string;
  stamp?: string;
  runningBalance: number;
}

export interface CustomerCreditResponse {
  totalCredit: number;
  count: number;
  updatedAt?: string | null;
  transactions: CustomerCreditEntry[];
}

function normalizeApiBaseUrl(baseUrl?: string): string {
  if (!baseUrl) return '/api';

  const trimmed = baseUrl.trim().replace(/\/+$/, '');

  return trimmed || '/api';
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

if (!import.meta.env.VITE_API_BASE_URL) {
  console.info('VITE_API_BASE_URL is not defined. Defaulting to /api.');
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(buildApiUrl(path));

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

export async function getCustomerCredit(customerId: string): Promise<CustomerCreditResponse> {
  return fetchJson<CustomerCreditResponse>(`/customers/${customerId}/credit`);
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

export interface EmailRequest {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  bcc?: string | string[];
}

export async function sendEmailRequest(payload: EmailRequest): Promise<void> {
  const response = await fetch(buildApiUrl('/email/send'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.message || `Email request failed: ${response.statusText}`;
    throw new Error(message);
  }
}

export async function sendAccountAccessEmail({
  email,
  language,
}: {
  email: string;
  language: 'he' | 'en';
}): Promise<void> {
  const isHebrew = language === 'he';

  const subject = isHebrew
    ? 'קישור ליצירת או שחזור חשבון דף אחד'
    : 'Create or recover your Daf Echad account';

  const bodyText = isHebrew
    ? `שלום,
קיבלתם בקשה ליצירת או שחזור חשבון בדף אחד עבור ${email}.
השיבו למייל זה עם שם מלא ומספר לקוח (אם יש) ונייצר עבורכם גישה חדשה.
אם לא אתם ביקשתם - ניתן להתעלם.`
    : `Hi,
We received a request to create or recover a Daf Echad account for ${email}.
Reply to this email with your full name and customer number (if available) and we will set up access.
If you did not request this, you can ignore this message.`;

  const bodyHtml = isHebrew
    ? `<p>שלום,</p>
<p>קיבלנו בקשה ליצירת או שחזור חשבון בדף אחד עבור <strong>${email}</strong>.</p>
<p>השיבו למייל זה עם שם מלא ומספר לקוח (אם יש) ונייצר עבורכם גישה חדשה.</p>
<p>אם לא אתם ביקשתם - ניתן להתעלם.</p>`
    : `<p>Hi,</p>
<p>We received a request to create or recover a Daf Echad account for <strong>${email}</strong>.</p>
<p>Please reply to this email with your full name and customer number (if you have one) and we will set up access.</p>
<p>If you did not request this, you can ignore this message.</p>`;

  await sendEmailRequest({
    to: email,
    subject,
    text: bodyText,
    html: bodyHtml,
  });
}
