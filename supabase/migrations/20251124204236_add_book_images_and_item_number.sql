/*
  # Add Multiple Images Support and Item Number

  1. Changes to Books Table
    - Add `item_number` column - Unique identifier for each book
    - Add `dimensions` column - Physical dimensions (e.g., "8.5 x 11 x 1.2 inches")
    
  2. New Tables
    - `book_images`
      - `id` (uuid, primary key)
      - `book_id` (uuid, foreign key to books)
      - `image_url` (text) - Image URL
      - `position` (integer) - Display order (1-4)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on book_images table
    - Add policies for public read access
    - Add policies for authenticated users to manage images

  4. Notes
    - Each book can have up to 4 images
    - Images are ordered by position field
    - Item numbers are unique across all books
*/

-- Add new columns to books table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'item_number'
  ) THEN
    ALTER TABLE books ADD COLUMN item_number text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'dimensions'
  ) THEN
    ALTER TABLE books ADD COLUMN dimensions text DEFAULT '';
  END IF;
END $$;

-- Create book_images table
CREATE TABLE IF NOT EXISTS book_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  position integer NOT NULL CHECK (position >= 1 AND position <= 4),
  created_at timestamptz DEFAULT now(),
  UNIQUE(book_id, position)
);

-- Enable RLS
ALTER TABLE book_images ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Anyone can view book images"
  ON book_images FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin policies
CREATE POLICY "Authenticated users can insert book images"
  ON book_images FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update book images"
  ON book_images FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete book images"
  ON book_images FOR DELETE
  TO authenticated
  USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_book_images_book_id ON book_images(book_id);
CREATE INDEX IF NOT EXISTS idx_book_images_position ON book_images(book_id, position);