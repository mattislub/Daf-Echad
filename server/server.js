import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { DATABASE_NAME, getServerTime, testConnection, pool } from './db.js';

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

function buildAuthorMap(authorRows) {
  const defaultDate = new Date().toISOString();

  return authorRows.reduce((map, row) => {
    const id = row.ID ?? row.id;
    if (!id) return map;

    map.set(String(id), {
      id: String(id),
      name: row.name ?? '',
      created_at: row.created_at ?? defaultDate,
    });

    return map;
  }, new Map());
}

function buildPublisherMap(publisherRows) {
  const defaultDate = new Date().toISOString();

  return publisherRows.reduce((map, row) => {
    const id = row.ID ?? row.id;
    if (!id) return map;

    map.set(String(id), {
      id: String(id),
      name: row.name ?? '',
      created_at: row.created_at ?? defaultDate,
    });

    return map;
  }, new Map());
}

function buildBindingMap(bindingRows) {
  return bindingRows.reduce((map, row) => {
    const id = row.ID ?? row.id;
    if (!id) return map;

    map.set(String(id), {
      id: String(id),
      name: row.name ?? '',
      type: row.type ?? '',
      material: row.material ?? '',
    });

    return map;
  }, new Map());
}

function buildCategoryMap(categoryRows) {
  const defaultDate = new Date().toISOString();

  return categoryRows.reduce((map, row) => {
    const id = row.code ?? row.ID ?? row.id;
    if (!id) return map;

    map.set(String(id), {
      id: String(id),
      name_en: row.name ?? String(id),
      name_he: row.name ?? String(id),
      cat1: row.cat1 ? String(row.cat1) : null,
      cat2: row.cat2 ? String(row.cat2) : null,
      slug: `category-${id}`,
      created_at: row.created_at ?? defaultDate,
    });

    return map;
  }, new Map());
}

function mapBindingValue(bindingId, bindingMap = new Map()) {
  if (!bindingId) return '';

  const binding = bindingMap.get(bindingId);
  if (!binding) return bindingId;

  const descriptionParts = [binding.type, binding.material].filter((part) => part && String(part).trim() !== '');
  const description = descriptionParts.join(' - ');

  return description || binding.name || bindingId;
}

function buildColorMap(colorRows = []) {
  return colorRows.reduce((map, row) => {
    const code = row.lvalue ?? row.code ?? row.ID ?? row.id;

    if (!code) return map;

    const description = row.ldesc ?? row.description ?? row.name ?? '';
    map.set(String(code), description ? String(description) : String(code));

    return map;
  }, new Map());
}

function mapColorValue(colorCode, colorMap = new Map()) {
  if (!colorCode) return '';

  const normalizedCode = String(colorCode);
  const mappedValue = colorMap.get(normalizedCode);

  return mappedValue ?? normalizedCode;
}

function mapItemRowToBook(
  row,
  authorMap = new Map(),
  bindingMap = new Map(),
  categoryMap = new Map(),
  publisherMap = new Map(),
  itemCategoryMap = new Map(),
  keywordMap = new Map(),
  colorMap = new Map()
) {
  const price = Number(row.pri) || 0;
  const volumes = Number(row.vol) || 1;
  const defaultDate = new Date().toISOString();

  const itemId = String(row.ID);
  const categoryCode = itemCategoryMap.get(itemId) || (row.typeid ? String(row.typeid) : null);
  const categoryFromMap = categoryCode ? categoryMap.get(categoryCode) : undefined;

  const title_he = row.name || row.name2 || row.name3 || row.namef || '';
  const title_en = row.namef || row.name3 || row.name2 || row.name || '';

  const categoryId = categoryFromMap?.id ?? (categoryCode ? String(categoryCode) : null);
  const publisherId = row.publishid ? String(row.publishid) : null;
  const authorId = row.authorid ? String(row.authorid) : null;

  const category = categoryFromMap
    ? categoryFromMap
    : categoryId
      ? {
          id: categoryId,
          name_en: String(categoryId ?? ''),
          name_he: String(categoryId ?? ''),
          cat1: null,
          cat2: null,
          slug: `category-${categoryId}`,
          created_at: defaultDate,
        }
      : undefined;

  const publisherDetails = publisherId ? publisherMap.get(publisherId) : undefined;

  const publisher = publisherId
    ? {
        id: publisherId,
        name: publisherDetails?.name ?? String(row.publishid ?? ''),
        created_at: publisherDetails?.created_at ?? defaultDate,
      }
    : undefined;

  const author = authorId
    ? {
        id: authorId,
        name: authorMap.get(authorId)?.name ?? String(row.authorid ?? ''),
        created_at: authorMap.get(authorId)?.created_at ?? defaultDate,
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
    color: mapColorValue(row.color, colorMap),
    volumes,
    binding: mapBindingValue(row.binding ? String(row.binding) : '', bindingMap),
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
    keywords: keywordMap.get(itemId) ?? [],
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

async function fetchCategories() {
  try {
    const [rows] = await pool.query('SELECT code, cat1, cat2, name FROM cate');
    const categoryMap = buildCategoryMap(rows);

    return Array.from(categoryMap.values());
  } catch (error) {
    console.error('Database query failed while fetching categories:', error);
    throw error;
  }
}

async function fetchItemCategoryMap() {
  try {
    const [rows] = await pool.query('SELECT itemid, catid FROM itemcat');

    return rows.reduce((map, row) => {
      const itemId = row.itemid ?? row.itemId ?? row.ID;
      const categoryId = row.catid ?? row.categoryid ?? row.categoryId;

      if (!itemId || !categoryId || map.has(String(itemId))) return map;

      map.set(String(itemId), String(categoryId));

      return map;
    }, new Map());
  } catch (error) {
    console.error('Database query failed while fetching item categories:', error);
    throw error;
  }
}

async function fetchItemKeywords() {
  try {
    const [rows] = await pool.query('SELECT hkeyword, itemid FROM itemkeyword');

    return rows.reduce((map, row) => {
      const itemId = row.itemid ?? row.itemId ?? row.ID;
      const keyword = row.hkeyword ?? row.keyword;

      if (!itemId || !keyword) return map;

      const normalizedItemId = String(itemId);
      const currentKeywords = map.get(normalizedItemId) ?? [];

      currentKeywords.push(String(keyword));
      map.set(normalizedItemId, currentKeywords);

      return map;
    }, new Map());
  } catch (error) {
    console.error('Database query failed while fetching item keywords:', error);
    throw error;
  }
}

async function fetchColors() {
  try {
    const [rows] = await pool.query("SELECT lvalue, ldesc FROM lists WHERE ltype = 'color'");

    return rows.map((row) => ({
      lvalue: row.lvalue ?? row.code ?? row.ID ?? row.id ?? '',
      ldesc: row.ldesc ?? row.description ?? row.name ?? '',
    }));
  } catch (error) {
    console.error('Database query failed while fetching colors:', error);
    throw error;
  }
}

async function fetchBindings() {
  try {
    const [rows] = await pool.query('SELECT ID, name, type, material FROM binding');

    return rows.map((row) => ({
      id: String(row.ID ?? row.id ?? ''),
      name: row.name ?? '',
      type: row.type ?? '',
      material: row.material ?? '',
    }));
  } catch (error) {
    console.error('Database query failed while fetching bindings:', error);
    throw error;
  }
}

async function fetchAuthors() {
  try {
    const [rows] = await pool.query('SELECT ID, name FROM authore');
    const defaultDate = new Date().toISOString();

    return rows.map((row) => ({
      id: String(row.ID),
      name: row.name ?? '',
      created_at: defaultDate,
    }));
  } catch (error) {
    console.error('Database query failed while fetching authors:', error);
    throw error;
  }
}

async function fetchPublishers() {
  try {
    const [rows] = await pool.query('SELECT ID, name FROM publish');
    const defaultDate = new Date().toISOString();

    return rows
      .filter((row) => row.ID || row.id)
      .map((row) => ({
        id: String(row.ID ?? row.id ?? ''),
        name: row.name ?? '',
        created_at: defaultDate,
      }));
  } catch (error) {
    console.error('Database query failed while fetching publishers:', error);
    throw error;
  }
}

const app = express();

const RELATED_ITEM_TABLES = [
  'authore',
  'binding',
  'cate',
  'grpitms',
  'itemcat',
  'itemkeyword',
  'itemorigsfr',
  'items',
  'itemtype',
  'lists',
  'newpop',
  'origsfr',
  'publish',
  'qtylimit',
  'rcmlst',
  'recomend',
  'sellprice',
  'temppri',
];

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

async function describeTableColumns(tableName) {
  const [columns] = await pool.query(
    `SELECT COLUMN_NAME as field, DATA_TYPE as data_type, IS_NULLABLE as is_nullable, COLUMN_KEY as column_key, COLUMN_DEFAULT as column_default, COLUMN_COMMENT as comment
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
     ORDER BY ORDINAL_POSITION`,
    [DATABASE_NAME, tableName]
  );

  return columns;
}

async function fetchTableRows(tableName, limit) {
  const [rows] = await pool.query('SELECT * FROM ?? LIMIT ?', [tableName, limit]);
  return rows;
}

async function buildItemDataSnapshot(limit) {
  if (!DATABASE_NAME) {
    throw new Error('DATABASE_NAME is not configured. Set MYSQL_DATABASE in the environment.');
  }

  const results = [];

  for (const tableName of RELATED_ITEM_TABLES) {
    try {
      const [columns, rows] = await Promise.all([
        describeTableColumns(tableName),
        fetchTableRows(tableName, limit),
      ]);

      results.push({ table: tableName, columns, rows });
    } catch (error) {
      results.push({
        table: tableName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

app.get('/api/item-data-snapshot', async (req, res) => {
  try {
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 200;
    const tables = await buildItemDataSnapshot(limit);

    res.json({ database: DATABASE_NAME, limit, tables });
  } catch (error) {
    console.error('Failed to build item data snapshot:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/books', async (req, res) => {
  try {
    const [rows, authors, bindings, categories, publishers, itemCategoryMap, keywordMap, colors] =
      await Promise.all([
        fetchItems(),
        fetchAuthors(),
        fetchBindings(),
        fetchCategories(),
        fetchPublishers(),
        fetchItemCategoryMap(),
        fetchItemKeywords(),
        fetchColors(),
      ]);
    const authorMap = buildAuthorMap(authors);
    const bindingMap = buildBindingMap(bindings);
    const categoryMap = buildCategoryMap(categories);
    const publisherMap = buildPublisherMap(publishers);
    const colorMap = buildColorMap(colors);
    let books = rows.map((row) =>
      mapItemRowToBook(
        row,
        authorMap,
        bindingMap,
        categoryMap,
        publisherMap,
        itemCategoryMap,
        keywordMap,
        colorMap
      )
    );

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
    const [rows, authors, bindings, categories, publishers, itemCategoryMap, keywordMap, colors] =
      await Promise.all([
        fetchItems(),
        fetchAuthors(),
        fetchBindings(),
        fetchCategories(),
        fetchPublishers(),
        fetchItemCategoryMap(),
        fetchItemKeywords(),
        fetchColors(),
      ]);
    const authorMap = buildAuthorMap(authors);
    const bindingMap = buildBindingMap(bindings);
    const categoryMap = buildCategoryMap(categories);
    const publisherMap = buildPublisherMap(publishers);
    const colorMap = buildColorMap(colors);
    const books = rows.map((row) =>
      mapItemRowToBook(
        row,
        authorMap,
        bindingMap,
        categoryMap,
        publisherMap,
        itemCategoryMap,
        keywordMap,
        colorMap
      )
    );
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
    const categories = await fetchCategories();
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
    const publishers = await fetchPublishers();

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
    const authors = await fetchAuthors();

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
