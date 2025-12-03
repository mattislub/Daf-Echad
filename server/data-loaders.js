import { pool } from './db.js';

async function runQuery(description, sql, params = []) {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    console.error(`Database query failed while ${description}:`, error);
    throw error;
  }
}

export async function fetchItems() {
  return runQuery(
    'fetching items',
    'SELECT ID, name, name2, name3, namef, publishid, vol, chailik, size, binding, authorid, lang, color, length, width, depth, cubcm, weight, instock, typeid, identical, inset, grp, pri FROM items'
  );
}

export async function fetchItemOriginalMap() {
  const rows = await runQuery('fetching item original references', 'SELECT itemid, origsfrid FROM itemorigsfr');

  return rows.reduce((map, row) => {
    const itemId = row.itemid ?? row.itemId ?? row.ID;
    const originalId = row.origsfrid ?? row.originalId ?? row.originalid;

    if (!itemId || !originalId) return map;

    map.set(String(itemId), String(originalId));
    return map;
  }, new Map());
}

export async function fetchOriginalDescriptions() {
  const rows = await runQuery('fetching original descriptions', 'SELECT ID, osdescw FROM origsfr');

  return rows.reduce((map, row) => {
    const id = row.ID ?? row.id;
    const description = row.osdescw ?? '';

    if (!id || !description) return map;

    map.set(String(id), String(description));
    return map;
  }, new Map());
}

export async function fetchItemDescriptions() {
  const rows = await runQuery('fetching item descriptions', 'SELECT itemid, idescw, icapt FROM itemdesc');

  return rows.reduce((map, row) => {
    const itemId = row.itemid ?? row.itemId ?? row.ID;
    const description = row.idescw ?? row.description;
    const caption = row.icapt ?? row.caption;

    if (!itemId || (!description && !caption)) return map;

    map.set(String(itemId), {
      description: description ? String(description) : '',
      caption: caption ? String(caption) : '',
    });

    return map;
  }, new Map());
}

export async function fetchCategories() {
  return runQuery('fetching categories', 'SELECT code, cat1, cat2, name FROM cate');
}

export async function fetchItemCategoryMap() {
  const rows = await runQuery('fetching item categories', 'SELECT itemid, catid FROM itemcat');

  return rows.reduce((map, row) => {
    const itemId = row.itemid ?? row.itemId ?? row.ID;
    const categoryId = row.catid ?? row.categoryid ?? row.categoryId;

    if (!itemId || !categoryId) return map;

    const normalizedItemId = String(itemId);
    const normalizedCategoryId = String(categoryId);
    const existingCategories = map.get(normalizedItemId) ?? [];

    if (existingCategories.includes(normalizedCategoryId)) return map;

    map.set(normalizedItemId, [...existingCategories, normalizedCategoryId]);

    return map;
  }, new Map());
}

export async function fetchItemKeywords() {
  const rows = await runQuery('fetching item keywords', 'SELECT hkeyword, itemid FROM itemkeyword');

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
}

export async function fetchItemPrices() {
  const rows = await runQuery('fetching item prices', 'SELECT * FROM sellprice');

  return rows.reduce((map, row) => {
    const itemId = row.itemid ?? row.itemId ?? row.ID ?? row.id;

    if (!itemId) return map;

    const priceValue =
      row.price ??
      row.pri ??
      row.sellprice ??
      row.sellPrice ??
      row.price_ils ??
      row.priceIls ??
      row.price_usd ??
      row.priceUsd;

    if (priceValue === undefined || priceValue === null) return map;

    const numericPrice = Number(priceValue);

    if (Number.isNaN(numericPrice)) return map;

    map.set(String(itemId), numericPrice);

    return map;
  }, new Map());
}

export async function fetchColors() {
  const rows = await runQuery('fetching colors', "SELECT lvalue, ldesc FROM lists WHERE ltype = 'color'");

  return rows.map((row) => ({
    lvalue: row.lvalue ?? row.code ?? row.ID ?? row.id ?? '',
    ldesc: row.ldesc ?? row.description ?? row.name ?? '',
  }));
}

export async function fetchSizes() {
  const rows = await runQuery('fetching sizes', "SELECT lvalue, ldesc FROM lists WHERE ltype = 'size'");

  return rows.map((row) => ({
    lvalue: row.lvalue ?? row.code ?? row.ID ?? row.id ?? '',
    ldesc: row.ldesc ?? row.description ?? row.name ?? '',
  }));
}

export async function fetchLanguages() {
  const rows = await runQuery('fetching languages', "SELECT lvalue, ldesc FROM lists WHERE ltype = 'lang'");

  return rows.map((row) => ({
    lvalue: row.lvalue ?? row.code ?? row.ID ?? row.id ?? '',
    ldesc: row.ldesc ?? row.description ?? row.name ?? '',
  }));
}

export async function fetchCustomers() {
  return runQuery(
    'fetching customers',
    'SELECT ID, telno, fname, lname, email, fax, lang, setup, comdflt, ctype, username, pass, stamp FROM custe'
  );
}

export async function fetchBindings() {
  const rows = await runQuery('fetching bindings', 'SELECT ID, name, type, material FROM binding');

  return rows.map((row) => ({
    id: String(row.ID ?? row.id ?? ''),
    name: row.name ?? '',
    type: row.type ?? '',
    material: row.material ?? '',
  }));
}

export async function fetchAuthors() {
  const rows = await runQuery('fetching authors', 'SELECT ID, name FROM authore');
  const defaultDate = new Date().toISOString();

  return rows.map((row) => ({
    id: String(row.ID),
    name: row.name ?? '',
    created_at: defaultDate,
  }));
}

export async function fetchPublishers() {
  const rows = await runQuery('fetching publishers', 'SELECT ID, name FROM publish');
  const defaultDate = new Date().toISOString();

  return rows
    .filter((row) => row.ID || row.id)
    .map((row) => ({
      id: String(row.ID ?? row.id ?? ''),
      name: row.name ?? '',
      created_at: defaultDate,
    }));
}

export async function loadBookReferenceData() {
  const [
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
  ] = await Promise.all([
    fetchAuthors(),
    fetchBindings(),
    fetchCategories(),
    fetchPublishers(),
    fetchItemCategoryMap(),
    fetchItemPrices(),
    fetchItemKeywords(),
    fetchSizes(),
    fetchColors(),
    fetchLanguages(),
    fetchItemDescriptions(),
    fetchItemOriginalMap(),
    fetchOriginalDescriptions(),
  ]);

  return {
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
  };
}
