import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { DATABASE_NAME, getServerTime, testConnection, pool } from './db.js';
import {
  fetchAuthors,
  fetchBindings,
  fetchCategories,
  fetchCountries,
  fetchColors,
  fetchCustomers,
  fetchDiscounts,
  fetchItemCategoryMap,
  fetchItemKeywords,
  fetchItemPrices,
  fetchItems,
  fetchLanguages,
  fetchPublishers,
  fetchSizes,
  loadBookReferenceData,
} from './data-loaders.js';
import { mailDefaults, sendEmail } from './email.js';

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
].join('; ');

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

    const fallbackName = row.name ?? row.name_he ?? row.name_en ?? String(id);
    const nameEn = row.name_en ?? fallbackName;
    const nameHe = row.name_he ?? fallbackName;

    map.set(String(id), {
      id: String(id),
      name_en: nameEn,
      name_he: nameHe,
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

function buildLanguageMap(languageRows = []) {
  return languageRows.reduce((map, row) => {
    const code = row.lvalue ?? row.code ?? row.ID ?? row.id;

    if (!code) return map;

    const description = row.ldesc ?? row.description ?? row.name ?? '';
    map.set(String(code), description ? String(description) : String(code));

    return map;
  }, new Map());
}

function mapLanguageValue(languageCode, languageMap = new Map()) {
  if (!languageCode) return '';

  const normalizedCode = String(languageCode);
  const mappedValue = languageMap.get(normalizedCode);

  return mappedValue ?? normalizedCode;
}

function mapCustomerRow(row, languageMap = new Map()) {
  const defaultDate = new Date().toISOString();

  return {
    id: row.ID ? String(row.ID) : '',
    phone: row.telno ?? '',
    first_name: row.fname ?? '',
    last_name: row.lname ?? '',
    email: row.email ?? '',
    fax: row.fax ?? '',
    language: mapLanguageValue(row.lang, languageMap),
    setup: row.setup ?? '',
    default_communication: row.comdflt ?? '',
    customer_type: row.ctype ?? '',
    username: row.username ?? '',
    password: row.pass ?? '',
    stamp: row.stamp ?? row.setup ?? defaultDate,
  };
}

function buildSizeMap(sizeRows = []) {
  return sizeRows.reduce((map, row) => {
    const code = row.lvalue ?? row.code ?? row.ID ?? row.id;

    if (!code) return map;

    const description = row.ldesc ?? row.description ?? row.name ?? '';
    map.set(String(code), description ? String(description) : String(code));

    return map;
  }, new Map());
}

function mapSizeValue(sizeCode, sizeMap = new Map()) {
  if (!sizeCode) return '';

  const normalizedCode = String(sizeCode);
  const mappedValue = sizeMap.get(normalizedCode);

  return mappedValue ?? normalizedCode;
}

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function toIsoDateString(value) {
  if (!value) return null;

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
}

function mapDiscountRow(row) {
  return {
    id: row.ID ? String(row.ID) : '',
    code: row.code ?? '',
    name: row.name ?? '',
    valid_from: toIsoDateString(row.dfrom),
    valid_to: toIsoDateString(row.dto),
    max_count: toNumberOrNull(row.maxcnt),
    max_value: toNumberOrNull(row.maxval),
    item_id: row.itemid ? String(row.itemid) : null,
    publisher_id: row.publishid ? String(row.publishid) : null,
    category_id: row.catid ? String(row.catid) : null,
    author_id: row.authorid ? String(row.authorid) : null,
    customer_id: row.custid ? String(row.custid) : null,
    order_priority: toNumberOrNull(row.order1),
    minimum_order: toNumberOrNull(row.minord),
    shipping_charge: toNumberOrNull(row.shipchg),
    discount_percent: toNumberOrNull(row.discpct),
    discount_value: toNumberOrNull(row.discval),
    multiple: normalizeBoolean(row.multple),
    sponsor_id: row.sponsorid ? String(row.sponsorid) : null,
    active: normalizeBoolean(row.active),
    public: normalizeBoolean(row.public),
    filename: row.filename ?? '',
  };
}

function mapItemRowToBook(
  row,
  authorMap = new Map(),
  bindingMap = new Map(),
  categoryMap = new Map(),
  publisherMap = new Map(),
  itemCategoryMap = new Map(),
  itemPriceMap = new Map(),
  keywordMap = new Map(),
  sizeMap = new Map(),
  colorMap = new Map(),
  languageMap = new Map(),
  itemDescriptionMap = new Map(),
  itemOriginalMap = new Map(),
  originalDescriptionMap = new Map()
) {
  const volumes = Number(row.vol) || 1;
  const defaultDate = new Date().toISOString();

  const itemId = String(row.ID);
  const price = Number(itemPriceMap.get(itemId) ?? row.pri) || 0;
  const categoryCodesFromMap = itemCategoryMap.get(itemId) || [];
  const fallbackCategoryCode = row.typeid ? String(row.typeid) : null;
  const normalizedCategoryCodes =
    categoryCodesFromMap.length > 0
      ? categoryCodesFromMap
      : fallbackCategoryCode
        ? [fallbackCategoryCode]
        : [];

  const categories = normalizedCategoryCodes.map((code) => {
    const mappedCategory = categoryMap.get(code);

    if (mappedCategory) return mappedCategory;

    return {
      id: code,
      name_en: String(code),
      name_he: String(code),
      cat1: null,
      cat2: null,
      slug: `category-${code}`,
      created_at: defaultDate,
    };
  });

  const categoryFromMap = categories[0];

  const title_he = row.name || row.name2 || row.name3 || row.namef || '';
  const title_en = row.namef || row.name3 || row.name2 || row.name || '';

  const categoryId = categoryFromMap?.id ?? (normalizedCategoryCodes[0] ? String(normalizedCategoryCodes[0]) : null);
  const publisherId = row.publishid ? String(row.publishid) : null;
  const authorId = row.authorid ? String(row.authorid) : null;

  const category = categoryFromMap;

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

  const parsedWeight =
    row.weight === '' || row.weight === null || row.weight === undefined
      ? NaN
      : Number(row.weight);

  const descriptionEntry = itemDescriptionMap.get(itemId);
  const shortDescription =
    typeof descriptionEntry === 'string' ? descriptionEntry : descriptionEntry?.description ?? '';
  const descriptionTitle =
    typeof descriptionEntry === 'object' && descriptionEntry !== null
      ? descriptionEntry.caption ?? ''
      : '';
  const originalId = itemOriginalMap.get(itemId);
  const originalDescription = originalId ? originalDescriptionMap.get(originalId) ?? '' : '';

  return {
    id: String(row.ID),
    title_en,
    title_he,
    description_en: shortDescription,
    description_he: shortDescription,
    short_description: shortDescription,
    description_title: descriptionTitle,
    original_description: originalDescription,
    author_id: authorId,
    publisher_id: publisherId,
    category_id: categoryId,
    price_usd: price,
    price_ils: price,
    image_url: '',
    size: mapSizeValue(row.size, sizeMap),
    color: mapColorValue(row.color, colorMap),
    volumes,
    binding: mapBindingValue(row.binding ? String(row.binding) : '', bindingMap),
    language: mapLanguageValue(row.lang, languageMap),
    original_text: normalizeBoolean(row.inset),
    in_stock: normalizeBoolean(row.instock),
    featured: Boolean(row.grp),
    item_number: row.identical ? String(row.identical) : String(row.ID),
    dimensions: buildDimensions(row),
    weight: Number.isFinite(parsedWeight) ? parsedWeight : null,
    created_at: defaultDate,
    updated_at: defaultDate,
    author,
    publisher,
    category,
    categories,
    category_ids: categories.map((cat) => cat.id),
    keywords: keywordMap.get(itemId) ?? [],
  };
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

app.use((_, res, next) => {
  res.setHeader('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  next();
});

app.use(cors());

app.use((err, req, res, next) => {
  const message = err?.message?.toLowerCase() ?? '';

  if (err?.name === 'CorsError' || message.includes('cors')) {
    console.error(`CORS error for origin ${req.headers.origin || 'unknown origin'}:`, err);
  }

  next(err);
});
app.use(express.json());

app.post('/api/email/send', async (req, res) => {
  const { to, subject, text, html, bcc } = req.body ?? {};

  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required email fields',
    });
  }

  try {
    await sendEmail({ to, subject, text, html, bcc });
    res.json({
      status: 'ok',
      message: 'Email sent',
      defaults: {
        charset: mailDefaults.charset,
        from: mailDefaults.from,
        bcc: mailDefaults.bcc,
      },
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get(['/api', '/api/'], (_req, res) => {
  res.json({ status: 'ok' });
});

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

app.get('/api/customers', async (_req, res) => {
  try {
    const [customers, languages] = await Promise.all([fetchCustomers(), fetchLanguages()]);
    const languageMap = buildLanguageMap(languages);

    const normalizedCustomers = customers.map((row) => mapCustomerRow(row, languageMap));

    res.json(normalizedCustomers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/discounts', async (_req, res) => {
  try {
    const discounts = await fetchDiscounts();
    const normalizedDiscounts = discounts.map((row) => mapDiscountRow(row));

    res.json(normalizedDiscounts);
  } catch (error) {
    console.error('Error fetching discounts:', error);
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
    const [rows, referenceData] = await Promise.all([fetchItems(), loadBookReferenceData()]);

    const {
      authors,
      bindings,
      categories,
      publishers,
      itemCategoryMap,
      itemPriceMap,
      keywordMap,
      sizes,
      colors,
      languages,
      itemDescriptionMap,
      itemOriginalMap,
      originalDescriptionMap,
    } = referenceData;

    const authorMap = buildAuthorMap(authors);
    const bindingMap = buildBindingMap(bindings);
    const categoryMap = buildCategoryMap(categories);
    const publisherMap = buildPublisherMap(publishers);
    const priceMap = itemPriceMap instanceof Map ? itemPriceMap : new Map();
    const sizeMap = buildSizeMap(sizes);
    const colorMap = buildColorMap(colors);
    const languageMap = buildLanguageMap(languages);

    let books = rows.map((row) =>
      mapItemRowToBook(
        row,
        authorMap,
        bindingMap,
        categoryMap,
        publisherMap,
        itemCategoryMap,
        priceMap,
        keywordMap,
        sizeMap,
        colorMap,
        languageMap,
        itemDescriptionMap,
        itemOriginalMap,
        originalDescriptionMap
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
    const [rows, referenceData] = await Promise.all([fetchItems(), loadBookReferenceData()]);

    const {
      authors,
      bindings,
      categories,
      publishers,
      itemCategoryMap,
      itemPriceMap,
      keywordMap,
      sizes,
      colors,
      languages,
      itemDescriptionMap,
      itemOriginalMap,
      originalDescriptionMap,
    } = referenceData;

    const authorMap = buildAuthorMap(authors);
    const bindingMap = buildBindingMap(bindings);
    const categoryMap = buildCategoryMap(categories);
    const publisherMap = buildPublisherMap(publishers);
    const priceMap = itemPriceMap instanceof Map ? itemPriceMap : new Map();
    const sizeMap = buildSizeMap(sizes);
    const colorMap = buildColorMap(colors);
    const languageMap = buildLanguageMap(languages);

    const books = rows.map((row) =>
      mapItemRowToBook(
        row,
        authorMap,
        bindingMap,
        categoryMap,
        publisherMap,
        itemCategoryMap,
        priceMap,
        keywordMap,
        sizeMap,
        colorMap,
        languageMap,
        itemDescriptionMap,
        itemOriginalMap,
        originalDescriptionMap
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
    const categoryMap = buildCategoryMap(categories);

    res.json(Array.from(categoryMap.values()));
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

app.get('/api/countries', async (_req, res) => {
  try {
    const countries = await fetchCountries();

    const normalizedCountries = countries
      .map((country) => ({ id: country.id ? String(country.id) : '', name: country.name?.trim() ?? '' }))
      .filter((country) => country.id && country.name);

    res.json(normalizedCountries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

const port = Number(process.env.PORT) || 3501;

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
