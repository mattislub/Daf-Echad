import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getServerTime, testConnection, pool } from './db.js';

function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['1', 'true', 'yes', 'y'].includes(normalized);
  }

  return false;
}

function buildDimensions({ length, width, depth, size }) {
  const dimensionParts = [length, width, depth]
    .map((value) => (value ? Number(value) : null))
    .filter((value) => value !== null);

  if (dimensionParts.length === 3) {
    return `${dimensionParts[0]} × ${dimensionParts[1]} × ${dimensionParts[2]} cm`;
  }

  return size ? String(size) : '';
}

function mapItemRowToBook(row) {
  const price = Number(row.pri) || 0;
  const volumes = Number(row.vol) || 1;
  const defaultDate = new Date().toISOString();

  const title_he = row.name || row.name2 || row.name3 || row.namef || '';
  const title_en = row.namef || row.name3 || row.name2 || row.name || '';

  const categoryId = row.typeid ? String(row.typeid) : null;
  const publisherId = row.publishid ? String(row.publishid) : null;
  const authorId = row.authorid ? String(row.authorid) : null;

  const category = categoryId
    ? {
        id: categoryId,
        name_en: String(row.typeid ?? ''),
        name_he: String(row.typeid ?? ''),
        slug: `category-${categoryId}`,
        created_at: defaultDate,
      }
    : undefined;

  const publisher = publisherId
    ? {
        id: publisherId,
        name: String(row.publishid ?? ''),
        created_at: defaultDate,
      }
    : undefined;

  const author = authorId
    ? {
        id: authorId,
        name: String(row.authorid ?? ''),
        created_at: defaultDate,
      }
    : undefined;

  return {
    id: String(row.ID),
    title_en,
    title_he,
    description_en: '',
    description_he: '',
    author_id: authorId,
    publisher_id: publisherId,
    category_id: categoryId,
    price_usd: price,
    price_ils: price,
    image_url: '',
    size: row.size ? String(row.size) : '',
    color: row.color ? String(row.color) : '',
    volumes,
    binding: row.binding ? String(row.binding) : '',
    language: row.lang ? String(row.lang) : '',
    original_text: normalizeBoolean(row.inset),
    in_stock: normalizeBoolean(row.instock),
    featured: Boolean(row.grp),
    item_number: row.identical ? String(row.identical) : String(row.ID),
    dimensions: buildDimensions(row),
    created_at: defaultDate,
    updated_at: defaultDate,
    author,
    publisher,
    category,
  };
}

async function fetchItems() {
  try {
    const [rows] = await pool.query(
      'SELECT ID, name, name2, name3, namef, publishid, vol, chailik, size, binding, authorid, lang, color, length, width, depth, cubcm, weight, instock, typeid, identical, inset, grp, pri FROM items'
    );

    return rows;
  } catch (error) {
    console.error('Database query failed while fetching items:', error);
    throw error;
  }
}

function deriveUniqueOptions(rows, key) {
  const seen = new Set();

  return rows
    .map((row) => row[key])
    .filter((value) => value !== null && value !== undefined && String(value).trim() !== '')
    .filter((value) => {
      const stringValue = String(value);
      if (seen.has(stringValue)) return false;
      seen.add(stringValue);
      return true;
    })
    .map((value) => ({
      id: String(value),
      name_en: String(value),
      name_he: String(value),
      slug: `${key}-${value}`,
      created_at: new Date().toISOString(),
    }));
}

const app = express();

app.use(cors());

app.use((err, req, res, next) => {
  const message = err?.message?.toLowerCase() ?? '';

  if (err?.name === 'CorsError' || message.includes('cors')) {
    console.error(`CORS error for origin ${req.headers.origin || 'unknown origin'}:`, err);
  }

  next(err);
});
app.use(express.json());

app.get('/api/db-health', async (_req, res) => {
  try {
    await testConnection();
    const serverTime = await getServerTime();

    res.json({ status: 'ok', serverTime });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/books', async (req, res) => {
  try {
    const rows = await fetchItems();
    let books = rows.map(mapItemRowToBook);

    const { category_id, exclude, limit, featured } = req.query;

    if (category_id) {
      books = books.filter((book) => book.category_id === String(category_id));
    }

    if (exclude) {
      books = books.filter((book) => book.id !== String(exclude));
    }

    if (featured === 'true') {
      books = books.filter((book) => book.featured);
    }

    if (limit) {
      const limitNumber = Number(limit);
      if (!Number.isNaN(limitNumber) && limitNumber > 0) {
        books = books.slice(0, limitNumber);
      }
    }

    res.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/books/:id', async (req, res) => {
  try {
    const rows = await fetchItems();
    const books = rows.map(mapItemRowToBook);
    const book = books.find((item) => item.id === req.params.id);

    if (!book) {
      return res.status(404).json({ status: 'error', message: 'Book not found' });
    }

    res.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/categories', async (_req, res) => {
  try {
    const rows = await fetchItems();
    const categories = deriveUniqueOptions(rows, 'typeid');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/publishers', async (_req, res) => {
  try {
    const rows = await fetchItems();
    const publishers = deriveUniqueOptions(rows, 'publishid').map((publisher) => ({
      id: publisher.id,
      name: publisher.name_en,
      created_at: publisher.created_at,
    }));

    res.json(publishers);
  } catch (error) {
    console.error('Error fetching publishers:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/authors', async (_req, res) => {
  try {
    const rows = await fetchItems();
    const authors = deriveUniqueOptions(rows, 'authorid').map((author) => ({
      id: author.id,
      name: author.name_en,
      created_at: author.created_at,
    }));

    res.json(authors);
  } catch (error) {
    console.error('Error fetching authors:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

const port = Number(process.env.PORT) || 5174;

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
