/*
  # Create Books Catalog Schema

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name_en` (text) - Category name in English
      - `name_he` (text) - Category name in Hebrew
      - `slug` (text, unique) - URL-friendly identifier
      - `created_at` (timestamptz)
    
    - `publishers`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamptz)
    
    - `authors`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamptz)
    
    - `books`
      - `id` (uuid, primary key)
      - `title_en` (text) - Book title in English
      - `title_he` (text) - Book title in Hebrew
      - `description_en` (text) - Description in English
      - `description_he` (text) - Description in Hebrew
      - `author_id` (uuid, foreign key to authors)
      - `publisher_id` (uuid, foreign key to publishers)
      - `category_id` (uuid, foreign key to categories)
      - `price_usd` (decimal) - Price in USD
      - `price_ils` (decimal) - Price in ILS
      - `image_url` (text) - Book cover image URL
      - `size` (text) - Book dimensions (e.g., "6x9", "8.5x11")
      - `color` (text) - Cover color
      - `volumes` (integer) - Number of volumes
      - `binding` (text) - Binding type (hardcover, paperback, etc.)
      - `language` (text) - Primary language
      - `original_text` (boolean) - Whether it contains original text
      - `in_stock` (boolean) - Availability status
      - `featured` (boolean) - Whether to feature on homepage
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access (catalog is publicly viewable)
    - Add policies for authenticated admin users to manage content

  3. Indexes
    - Add indexes on frequently queried columns for performance
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_he text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create publishers table
CREATE TABLE IF NOT EXISTS publishers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create authors table
CREATE TABLE IF NOT EXISTS authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL,
  title_he text NOT NULL,
  description_en text DEFAULT '',
  description_he text DEFAULT '',
  author_id uuid REFERENCES authors(id) ON DELETE SET NULL,
  publisher_id uuid REFERENCES publishers(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  price_usd decimal(10,2) NOT NULL,
  price_ils decimal(10,2) NOT NULL,
  image_url text DEFAULT '',
  size text DEFAULT '',
  color text DEFAULT '',
  volumes integer DEFAULT 1,
  binding text DEFAULT '',
  language text DEFAULT 'Hebrew',
  original_text boolean DEFAULT true,
  in_stock boolean DEFAULT true,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Public read policies (anyone can view the catalog)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view publishers"
  ON publishers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view authors"
  ON authors FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view books"
  ON books FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin policies (authenticated users can manage - in production, restrict to admin role)
CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert publishers"
  ON publishers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update publishers"
  ON publishers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete publishers"
  ON publishers FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert authors"
  ON authors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update authors"
  ON authors FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete authors"
  ON authors FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert books"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update books"
  ON books FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete books"
  ON books FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_publisher ON books(publisher_id);
CREATE INDEX IF NOT EXISTS idx_books_featured ON books(featured);
CREATE INDEX IF NOT EXISTS idx_books_in_stock ON books(in_stock);
CREATE INDEX IF NOT EXISTS idx_books_price_usd ON books(price_usd);
CREATE INDEX IF NOT EXISTS idx_books_price_ils ON books(price_ils);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();