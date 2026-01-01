import { Author, Book, Category, Publisher } from '../types/catalog';
import { DatabaseSchemaTable } from '../types/database';
import { CustomerAccount } from '../types';

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

export interface CustomerShippingAddress {
  id: string;
  customerId: string;
  isDefault: boolean;
  street: string;
  houseNumber?: string;
  entrance?: string;
  apartment?: string;
  city: string;
  state?: string;
  zip?: string;
  country?: string;
  specialInstructions?: string;
  callId?: string;
  updatedAt?: string | null;
}

export type CustomerShippingAddressInput = Partial<
  Pick<
    CustomerShippingAddress,
    | 'street'
    | 'houseNumber'
    | 'entrance'
    | 'apartment'
    | 'city'
    | 'state'
    | 'zip'
    | 'country'
    | 'specialInstructions'
    | 'callId'
    | 'isDefault'
  >
> & { street: string; city: string };

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

export async function getCustomerShippingAddresses(customerId: string): Promise<CustomerShippingAddress[]> {
  return fetchJson<CustomerShippingAddress[]>(`/customers/${customerId}/shipping-addresses`);
}

async function mutateShippingAddress(
  path: string,
  payload: CustomerShippingAddressInput,
  method: 'POST' | 'PUT',
): Promise<CustomerShippingAddress> {
  const response = await fetch(buildApiUrl(path), {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = `API request failed: ${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return response.json() as Promise<CustomerShippingAddress>;
}

export async function createCustomerShippingAddress(
  customerId: string,
  payload: CustomerShippingAddressInput,
): Promise<CustomerShippingAddress> {
  return mutateShippingAddress(`/customers/${customerId}/shipping-addresses`, payload, 'POST');
}

export async function updateCustomerShippingAddress(
  customerId: string,
  addressId: string,
  payload: CustomerShippingAddressInput,
): Promise<CustomerShippingAddress> {
  return mutateShippingAddress(`/customers/${customerId}/shipping-addresses/${addressId}`, payload, 'PUT');
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

export async function getDatabaseSchema(): Promise<DatabaseSchemaTable[]> {
  return fetchJson<DatabaseSchemaTable[]>('/db-schema');
}

export async function getTableData(tableName: string, limit = 10): Promise<Record<string, unknown>[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  return fetchJson<Record<string, unknown>[]>(`/db-tables/${encodeURIComponent(tableName)}/data?${params.toString()}`);
}

export interface HfdRateRequest {
  cityName: string;
  streetName: string;
  houseNum?: string;
  shipmentWeight: number;
  productsPrice?: number;
  nameTo?: string;
  telFirst?: string;
  referenceNum1?: string;
  referenceNum2?: string;
}

export interface HfdRateResponse {
  status: 'ok' | 'error';
  estimatedPriceILS?: number;
  weightGrams?: number;
  currency?: string;
  message?: string;
  hfdStatus?: number;
  hfdResponse?: {
    shipmentNumber?: number | null;
    randNumber?: string | null;
    referenceNumber1?: string | null;
    referenceNumber2?: string | null;
    deliveryLine?: number | null;
    deliveryArea?: number | null;
    sortingCode?: number | null;
    pickUpCode?: number | null;
    existingShipmentNumber?: number | null;
    errorCode?: string | null;
    errorMessage?: string | null;
  };
}

export async function requestHfdRate(payload: HfdRateRequest): Promise<HfdRateResponse> {
  const response = await fetch(buildApiUrl('/shipping/hfd/rate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as HfdRateResponse;

  if (!response.ok) {
    return {
      status: 'error',
      message: data?.message || `HFD rate request failed: ${response.statusText}`,
      ...data,
      hfdStatus: response.status,
    };
  }

  return data;
}

export interface TrackingStatusEntry {
  code?: string;
  description?: string;
  date?: string;
  time?: string;
}

export interface TrackingResponse {
  status: 'ok' | 'error';
  carrier?: string;
  shipmentNumber?: string | null;
  referenceNumber1?: string | null;
  referenceNumber2?: string | null;
  delivered?: boolean;
  deliveryLine?: string | number | null;
  deliveryArea?: string | number | null;
  statuses?: TrackingStatusEntry[];
  message?: string;
}

export async function trackHfdShipment({
  shipmentNumber,
  reference,
}: {
  shipmentNumber?: string;
  reference?: string;
}): Promise<TrackingResponse> {
  const response = await fetch(buildApiUrl('/shipping/hfd/track'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shipmentNumber, reference }),
  });

  const data = (await response.json().catch(() => ({}))) as TrackingResponse;

  if (!response.ok) {
    return {
      status: 'error',
      message: data?.message || `HFD tracking request failed: ${response.statusText}`,
      ...data,
    };
  }

  return data;
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

export interface CustomerLoginPayload {
  email: string;
  password: string;
}

export interface CustomerProfileUpdatePayload {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  fax?: string;
  language?: 'he' | 'en' | null;
}

export async function loginCustomer(payload: CustomerLoginPayload): Promise<CustomerAccount> {
  const response = await fetch(buildApiUrl('/customers/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || `Login failed: ${response.statusText}`;
    throw new Error(message);
  }

  if (!data?.customer) {
    throw new Error('Login failed: invalid server response');
  }

  return data.customer as CustomerAccount;
}

export async function updateCustomerProfile(
  customerId: string,
  payload: CustomerProfileUpdatePayload,
): Promise<CustomerAccount> {
  const response = await fetch(buildApiUrl(`/customers/${customerId}/profile`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || `Update failed: ${response.statusText}`;
    throw new Error(message);
  }

  if (!data?.customer) {
    throw new Error('Update failed: invalid server response');
  }

  return data.customer as CustomerAccount;
}
