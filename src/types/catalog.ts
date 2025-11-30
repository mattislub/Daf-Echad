export interface Category {
  id: string;
  name_en: string;
  name_he: string;
  cat1?: string | null;
  cat2?: string | null;
  slug: string;
  created_at: string;
}

export interface Publisher {
  id: string;
  name: string;
  created_at: string;
}

export interface Author {
  id: string;
  name: string;
  created_at: string;
}

export interface BookImage {
  id: string;
  book_id: string;
  image_url: string;
  position: number;
  created_at: string;
}

export interface Book {
  id: string;
  title_en: string;
  title_he: string;
  description_en: string;
  description_he: string;
  author_id: string | null;
  publisher_id: string | null;
  category_id: string | null;
  price_usd: number;
  price_ils: number;
  image_url: string;
  size: string;
  color: string;
  volumes: number;
  binding: string;
  language: string;
  original_text: boolean;
  in_stock: boolean;
  featured: boolean;
  item_number: string | null;
  dimensions: string;
  created_at: string;
  updated_at: string;
  author?: Author;
  publisher?: Publisher;
  category?: Category;
  images?: BookImage[];
}

export interface FilterOptions {
  categories: string[];
  publishers: string[];
  authors: string[];
  sizes: string[];
  colors: string[];
  volumes: number[];
  bindings: string[];
  languages: string[];
  originalText: boolean | null;
  priceRange: {
    min: number;
    max: number;
  };
  inStockOnly: boolean;
}
