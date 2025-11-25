export interface Product {
  id: string;
  title_he: string;
  title_en: string;
  description_he?: string;
  description_en?: string;
  price_ils: number;
  price_usd: number;
  image_url?: string;
  category: string;
  is_featured: boolean;
  is_new: boolean;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export type Language = 'he' | 'en';
export type Currency = 'ILS' | 'USD';
