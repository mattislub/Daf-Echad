import { Book } from './catalog';

export interface CartItem {
  id: Book['id'];
  title_he: Book['title_he'];
  title_en: Book['title_en'];
  price_ils: Book['price_ils'];
  price_usd: Book['price_usd'];
  image_url?: Book['image_url'];
  quantity: number;
}

export type Language = 'he' | 'en';
export type Currency = 'ILS' | 'USD';
