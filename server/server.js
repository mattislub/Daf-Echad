import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import crypto from 'node:crypto';
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
  fetchCustomerCredits,
  fetchCarriers,
  fetchShippingAddresses,
} from './data-loaders.js';
import { mailDefaults, sendEmail } from './email.js';

function buildContentSecurityPolicy() {
  const zCreditOrigin = (() => {
    try {
      return new URL(ZCREDIT_BASE_URL).origin;
    } catch {
      return '';
    }
  })();

  const frameSources = ["'self'"];

  if (zCreditOrigin) {
    frameSources.push(zCreditOrigin);
  }

  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    `frame-src ${frameSources.join(' ')}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
  ].join('; ');
}

const ZCREDIT_BASE_URL = (process.env.ZCREDIT_BASE_URL || '').trim();
const ZCREDIT_TERMINAL = (process.env.ZCREDIT_TERMINAL || '').trim();
const ZCREDIT_PASSWORD = (process.env.ZCREDIT_PASSWORD || '').trim();
const ZCREDIT_KEY = (process.env.ZCREDIT_KEY || '').trim();
const CONTENT_SECURITY_POLICY = buildContentSecurityPolicy();
const HFD_BASE_URL = trimTrailingSlash(
  process.env.HFD_BASE_URL || 'https://test.hfd.co.il/RunCom.WebAPI/api/v1'
);
const HFD_TOKEN = (process.env.HFD_TOKEN || '').trim();
const HFD_CLIENT_NUMBER = Number(process.env.HFD_CLIENT_NUMBER || 0);
const HFD_STAGE_CODE = Number(process.env.HFD_STAGE_CODE || 5);
const HFD_SHIPMENT_TYPE = Number(process.env.HFD_SHIPMENT_TYPE || 35);
const HFD_CARGO_TYPE = Number(process.env.HFD_CARGO_TYPE || 10);
const HFD_BASE_RATE_ILS = Number(process.env.HFD_BASE_RATE_ILS || 0);
const HFD_RATE_PER_KG_ILS = Number(process.env.HFD_RATE_PER_KG_ILS || 0);
const HFD_ORDERER_NAME = (process.env.HFD_ORDERER_NAME || 'Daf Echad').trim();
const HFD_TRACKING_BASE_URL = trimTrailingSlash(
  process.env.HFD_TRACKING_BASE_URL ||
    HFD_BASE_URL.replace(/\/RunCom\.WebAPI\/api\/v1$/i, '/RunCom.Server')
);
const PRODUCT_IMAGE_DIRECTORY = path.resolve(process.env.PRODUCT_IMAGE_DIR || '/var/lib/dafe/pics/web');
const PRODUCT_IMAGE_ROUTE = normalizeRoutePath(process.env.PRODUCT_IMAGE_ROUTE || '/api/product-images');

function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['1', 'true', 'yes', 'y'].includes(normalized);
  }

  return false;
}

function trimTrailingSlash(url = '') {
  return url.replace(/\/+$/, '');
}

function normalizeRoutePath(route = '') {
  const trimmed = (route || '').trim();
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return trimTrailingSlash(withLeadingSlash) || '/api/product-images';
}

function buildZCreditCreateSessionUrl(baseUrl = '') {
  const sanitizedBase = trimTrailingSlash(baseUrl)
    .replace(/\/WebCheckout\/CreateSession$/i, '')
    .replace(/\/api\/WebCheckout\/CreateSession$/i, '');

  return sanitizedBase ? `${sanitizedBase}/api/WebCheckout/CreateSession` : '';
}

function logZCredit(message, details = {}) {
  const safeDetails = { ...details };

  if (safeDetails.payload) {
    const sanitizeValue = (value, visibleDigits = 0) => {
      if (value === undefined || value === null) return '';

      const stringValue = String(value);
      if (!visibleDigits) return '***';

      if (stringValue.length <= visibleDigits) return '*'.repeat(stringValue.length);

      return `${'*'.repeat(Math.max(stringValue.length - visibleDigits, 3))}${stringValue.slice(-visibleDigits)}`;
    };

    const payload = { ...safeDetails.payload };

    if ('Password' in payload) payload.Password = sanitizeValue(payload.Password);
    if ('Key' in payload) payload.Key = sanitizeValue(payload.Key);
    if ('TerminalNumber' in payload) payload.TerminalNumber = sanitizeValue(payload.TerminalNumber, 2);
    if ('User' in payload) payload.User = sanitizeValue(payload.User, 2);

    safeDetails.payload = payload;
  }

  console.log('[ZCredit]', message, safeDetails);
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

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildWishlistEmailContent({ customerName, items, language }) {
  const isHebrew = language === 'he';
  const direction = isHebrew ? 'rtl' : 'ltr';
  const textAlign = isHebrew ? 'right' : 'left';
  const greeting = isHebrew ? 'שלום' : 'Hello';
  const intro = isHebrew
    ? 'הפריטים הבאים נשמרו ברשימת המשאלות שלך בדף אחד.'
    : 'The following items were saved to your Daf Echad wishlist.';
  const closing = isHebrew
    ? 'נשמח לראות אותך חוזר להזמנה בכל זמן.'
    : 'We hope to see you back whenever you are ready to order.';

  const safeName = customerName ? ` ${escapeHtml(customerName)}` : '';
  const normalizedItems = Array.isArray(items) ? items : [];

  const listHtml = normalizedItems
    .map((item) => {
      const title = escapeHtml(item?.title || '');
      const price = item?.priceLabel ? `<div style="font-size:13px; color:#4a5568;">${escapeHtml(item.priceLabel)}</div>` : '';
      const imageTag = item?.imageUrl
        ? `<img src="${escapeHtml(item.imageUrl)}" alt="${title}" style="width:72px; height:auto; border-radius:8px; border:1px solid #e2e8f0;" />`
        : '';
      const titleContent = item?.productUrl
        ? `<a href="${escapeHtml(item.productUrl)}" style="color:#b7791f; text-decoration:none; font-weight:600;">${title}</a>`
        : `<span style="color:#2d3748; font-weight:600;">${title}</span>`;

      return `
        <tr>
          <td style="padding:12px 0; border-bottom:1px solid #edf2f7;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                ${imageTag ? `<td width="90" style="vertical-align:top;">${imageTag}</td>` : ''}
                <td style="vertical-align:top; padding-${isHebrew ? 'right' : 'left'}: ${imageTag ? '12px' : '0'};">
                  ${titleContent}
                  ${price}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <div style="direction:${direction}; text-align:${textAlign}; font-family:'Segoe UI', Arial, sans-serif;">
      <p style="margin:0 0 12px; font-size:16px; color:#2d3748;">${greeting}${safeName},</p>
      <p style="margin:0 0 16px; color:#4a5568;">${intro}</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        ${listHtml}
      </table>
      <p style="margin:16px 0 0; color:#4a5568;">${closing}</p>
    </div>
  `;

  const textLines = normalizedItems
    .map((item, index) => {
      const parts = [`${index + 1}. ${item?.title || ''}`];
      if (item?.priceLabel) parts.push(item.priceLabel);
      if (item?.productUrl) parts.push(item.productUrl);
      return parts.filter(Boolean).join(' - ');
    })
    .join('\n');

  const text = `${greeting}${customerName ? ` ${customerName}` : ''},\n${intro}\n\n${textLines}\n\n${closing}`;

  return { html, text };
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

function normalizePositiveNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

function buildHfdShipmentPayload({
  cityName,
  streetName,
  houseNum,
  shipmentWeight,
  productsPrice,
  nameTo,
  telFirst,
  referenceNum1,
  referenceNum2,
}) {
  return {
    clientNumber: HFD_CLIENT_NUMBER,
    mesiraIsuf: 'מסירה',
    shipmentTypeCode: HFD_SHIPMENT_TYPE,
    stageCode: HFD_STAGE_CODE,
    ordererName: HFD_ORDERER_NAME,
    cargoTypeHaloch: HFD_CARGO_TYPE,
    cargoTypeHazor: 0,
    packsHaloch: '1',
    packsHazor: 0,
    nameTo: nameTo || 'Customer',
    cityName,
    streetName,
    houseNum: houseNum || '',
    telFirst: telFirst || '',
    telSecond: '',
    addressRemarks: '',
    shipmentRemarks: 'Price check from Daf Echad cart',
    referenceNum1: referenceNum1 || '',
    referenceNum2: referenceNum2 || '',
    futureDate: '',
    futureTime: '',
    pudoCodeOrigin: 0,
    pudoCodeDestination: 0,
    autoBindPudo: 'N',
    email: '',
    productsPrice: productsPrice ?? 0,
    productPriceCurrency: 'ILS',
    shipmentWeight: shipmentWeight ?? 0,
    govina: {
      code: 0,
      sum: 0,
      date: '',
      remarks: '',
    },
  };
}

function estimateHfdPriceILS(weightGrams) {
  const base = normalizePositiveNumber(HFD_BASE_RATE_ILS, 0);
  const perKg = normalizePositiveNumber(HFD_RATE_PER_KG_ILS, 0);
  const kg = normalizePositiveNumber(weightGrams, 0) / 1000;

  if (!base && !perKg) return 0;

  const additionalWeight = Math.max(kg - 1, 0);
  const additionalCost = perKg * additionalWeight;

  return Number((base + additionalCost).toFixed(2));
}

function extractXmlValue(xml = '', tagName = '') {
  if (!xml || !tagName) return '';

  const tagPattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(tagPattern);

  if (!match) return '';

  const rawValue = match[1] ?? '';
  const cdataPattern = /<!\[CDATA\[([\\s\\S]*?)\]\]>/i;
  const cdataMatch = rawValue.match(cdataPattern);

  return (cdataMatch ? cdataMatch[1] : rawValue).trim();
}

function parseHfdStatusEntries(xml = '') {
  const statuses = [];
  const statusPattern = /<status>([\s\S]*?)<\/status>/gi;
  const matches = xml.matchAll(statusPattern);

  for (const match of matches) {
    const statusXml = match[1] ?? '';
    statuses.push({
      code: extractXmlValue(statusXml, 'status_code'),
      description: extractXmlValue(statusXml, 'status_desc'),
      date: extractXmlValue(statusXml, 'status_date'),
      time: extractXmlValue(statusXml, 'status_time'),
    });
  }

  return statuses;
}

function normalizeHfdTrackingResponse(xml = '') {
  if (!xml) return null;

  const statuses = parseHfdStatusEntries(xml);
  const deliveredFlag = extractXmlValue(xml, 'ship_delivered_yn');

  return {
    shipmentNumber: extractXmlValue(xml, 'ship_no') || extractXmlValue(xml, 'ship_num_rand') || null,
    referenceNumber1: extractXmlValue(xml, 'ref1') || null,
    referenceNumber2: extractXmlValue(xml, 'ref2') || extractXmlValue(xml, 'ref2_with_prefix') || null,
    deliveryLine: extractXmlValue(xml, 'deliveryLine') || null,
    deliveryArea: extractXmlValue(xml, 'deliveryArea') || null,
    delivered: deliveredFlag ? deliveredFlag.toLowerCase() === 'y' : false,
    statuses,
  };
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

function mapCustomerAccount(row) {
  const rawLanguage = row.lang ? String(row.lang).trim().toLowerCase() : '';
  const normalizedLanguage = rawLanguage
    ? rawLanguage === '1' || rawLanguage === 'h' || rawLanguage.startsWith('he')
      ? 'he'
      : rawLanguage === '2' || rawLanguage === 'e' || rawLanguage.startsWith('en')
        ? 'en'
        : null
    : null;

  return {
    id: row.ID ? String(row.ID) : row.id ? String(row.id) : '',
    email: row.email ?? row.username ?? '',
    firstName: row.fname ?? row.first_name ?? '',
    lastName: row.lname ?? row.last_name ?? '',
    phone: row.telno ?? row.phone ?? null,
    fax: row.fax ?? null,
    language: normalizedLanguage,
    customerType: row.ctype ?? row.customer_type ?? null,
  };
}

function generateTemporaryPassword(length = 10) {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#%*';
  const randomBytes = crypto.randomBytes(length);

  let password = '';

  for (let index = 0; index < length; index += 1) {
    const byte = randomBytes[index];
    password += charset[byte % charset.length];
  }

  return password;
}

function generateNumericPassword(length = 6) {
  const max = 10 ** length;
  const value = crypto.randomInt(0, max);

  return value.toString().padStart(length, '0');
}

const EMAIL_LOGIN_CODE_TTL_MS = 10 * 60 * 1000;
const EMAIL_LOGIN_MAX_ATTEMPTS = 5;
const emailLoginRequests = new Map();

function normalizePreferredLanguage(value = '') {
  const normalized = String(value).trim().toLowerCase();

  if (!normalized) return 'en';
  if (normalized === '1' || normalized === 'h' || normalized.startsWith('he')) return 'he';
  if (normalized === '2' || normalized === 'e' || normalized.startsWith('en')) return 'en';

  return 'en';
}

function mapPreferredLanguageToDb(language) {
  const normalized = normalizePreferredLanguage(language);

  return normalized === 'he' ? '1' : '2';
}

function generateEmailLoginCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function storeEmailLoginCode(email, code) {
  const key = email.toLowerCase();
  emailLoginRequests.set(key, {
    code,
    expiresAt: Date.now() + EMAIL_LOGIN_CODE_TTL_MS,
    attempts: 0,
  });
}

function getEmailLoginCode(email) {
  const key = email.toLowerCase();
  const entry = emailLoginRequests.get(key);

  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    emailLoginRequests.delete(key);
    return null;
  }

  return entry;
}

function clearEmailLoginCode(email) {
  emailLoginRequests.delete(email.toLowerCase());
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

function mapShippingAddressRow(row) {
  const s = (value) => (value === null || value === undefined ? null : String(value).trim());

  return {
    id: row.ID ? String(row.ID) : row.id ? String(row.id) : '',
    customerId: row.custid ? String(row.custid) : '',
    isDefault: normalizeBoolean(row.stdefault),
    street: s(row.street),
    houseNumber: row.no !== undefined && row.no !== null ? String(row.no).trim() : '',
    entrance: s(row.ent),
    apartment: s(row.apt),
    city: s(row.city),
    state: s(row.state),
    zip: s(row.zip),
    country: s(row.country),
    specialInstructions: s(row.specinst),
    callId: row.callid !== undefined && row.callid !== null ? String(row.callid).trim() : '',
    updatedAt: toIsoDateString(row.stamp),
  };
}

function normalizeShippingAddressPayload(body) {
  const normalize = (value) => (typeof value === 'string' ? value.trim() : value ?? '');

  return {
    street: normalize(body.street),
    houseNumber: normalize(body.houseNumber),
    entrance: normalize(body.entrance),
    apartment: normalize(body.apartment),
    city: normalize(body.city),
    state: normalize(body.state),
    zip: normalize(body.zip),
    country: normalize(body.country),
    specialInstructions: normalize(body.specialInstructions),
    callId: normalize(body.callId),
    isDefault: normalizeBoolean(body.isDefault),
  };
}

async function saveDefaultShippingAddress(connection, customerId, skipId = null) {
  await connection.query('UPDATE shipto SET stdefault = ? WHERE custid = ? AND (? IS NULL OR ID != ?)', [
    'N',
    customerId,
    skipId,
    skipId,
  ]);
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
app.set('trust proxy', true);

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

const REQUEST_LOG_FILE = path.resolve(process.cwd(), 'server', 'request-logs.log');
fs.mkdirSync(path.dirname(REQUEST_LOG_FILE), { recursive: true });
const requestLogStream = fs.createWriteStream(REQUEST_LOG_FILE, { flags: 'a' });
const SESSION_COOKIE_NAME = 'daf_session_id';
const SESSION_LOG_FILE = path.resolve(process.cwd(), 'server', 'session-logs.log');
fs.mkdirSync(path.dirname(SESSION_LOG_FILE), { recursive: true });
const sessionLogStream = fs.createWriteStream(SESSION_LOG_FILE, { flags: 'a' });

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, ...rest] = cookie.split('=');
    if (!name || !rest.length) return cookies;

    const trimmedName = name.trim();
    const value = rest.join('=').trim();

    if (trimmedName) {
      cookies[trimmedName] = value;
    }

    return cookies;
  }, {});
}

function generateSessionId() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

function setSessionCookie(res, sessionId) {
  const cookieParts = [`${SESSION_COOKIE_NAME}=${sessionId}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  res.append('Set-Cookie', cookieParts.join('; '));
}

function getClientIp(req) {
  const forwardedFor = req.get('x-forwarded-for');
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(',');
    if (firstIp?.trim()) return firstIp.trim();
  }

  return req.ip || req.socket?.remoteAddress || '';
}

function logSessionEvent(req, type, details = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    sessionId: req.sessionId,
    ip: getClientIp(req),
    userAgent: req.get('user-agent') || '',
    referer: req.get('referer') || '',
    type,
    details,
  };

  sessionLogStream.write(`${JSON.stringify(logEntry)}\n`);
}

async function upsertSessionRecord(sessionId) {
  if (!sessionId) return;

  try {
    await pool.query(
      'INSERT INTO sessione (sessionid) VALUES (?) ON DUPLICATE KEY UPDATE sessionid = VALUES(sessionid)',
      [sessionId]
    );
  } catch (error) {
    console.error('Failed to update sessione table with session id:', error);
  }
}

app.use((_, res, next) => {
  res.setHeader('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  next();
});

app.use(cors());

const productImageStaticOptions = {
  fallthrough: false,
  maxAge: '1d',
  setHeaders(res) {
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
  },
};

if (fs.existsSync(PRODUCT_IMAGE_DIRECTORY)) {
  app.use(PRODUCT_IMAGE_ROUTE, express.static(PRODUCT_IMAGE_DIRECTORY, productImageStaticOptions));
} else {
  console.warn(`[Product Images] Directory not found: ${PRODUCT_IMAGE_DIRECTORY}`);
}

app.use((err, req, res, next) => {
  const message = err?.message?.toLowerCase() ?? '';

  if (err?.name === 'CorsError' || message.includes('cors')) {
    console.error(`CORS error for origin ${req.headers.origin || 'unknown origin'}:`, err);
  }

  next(err);
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(async (req, res, next) => {
  const cookies = parseCookies(req.headers.cookie || '');
  let sessionId = cookies[SESSION_COOKIE_NAME];
  const isNewSession = !sessionId;

  if (!sessionId) {
    sessionId = generateSessionId();
  }

  req.sessionId = sessionId;

  if (isNewSession) {
    await upsertSessionRecord(sessionId);
    logSessionEvent(req, 'session-start', {
      path: req.path,
      query: req.query,
    });
  }

  setSessionCookie(res, sessionId);

  next();
});

app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;

    const logEntry = {
      timestamp: new Date().toISOString(),
      sessionId: req.sessionId,
      ip: getClientIp(req),
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      query: req.query,
      body: req.body,
      userAgent: req.get('user-agent') || '',
      referer: req.get('referer') || '',
      status: res.statusCode,
      durationMs,
    };

    requestLogStream.write(`${JSON.stringify(logEntry)}\n`);
  });

  next();
});

app.post('/api/session/events', (req, res) => {
  const { type, itemId, itemTitle, quantity, customer, details } = req.body || {};

  if (!type) {
    return res.status(400).json({ status: 'error', message: 'Event type is required' });
  }

  logSessionEvent(req, type, {
    itemId: itemId ?? null,
    itemTitle: itemTitle ?? null,
    quantity: quantity ?? null,
    customer: customer ?? null,
    details: details ?? {},
  });

  return res.status(204).send();
});

app.post('/api/zcredit/callback', (req, res) => {
  const orderId =
    req.query.orderId || req.body?.UniqueId || req.body?.uniqueId || req.body?.OrderId || req.body?.orderId || null;

  logZCredit('Received ZCredit callback', {
    orderId,
    status: req.body?.Status || req.body?.status || req.body?.ResponseStatus || null,
    receivedKeys: Object.keys(req.body || {}),
  });

  return res.json({ status: 'ok', orderId: orderId || undefined });
});

app.post('/api/zcredit/create-checkout', async (req, res) => {
  const {
    amount,
    description,
    customerName,
    customerEmail,
    customerPhone,
    orderId,
    successUrl,
    cancelUrl,
    callbackUrl,
    installments,
  } = req.body ?? {};

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    logZCredit('Rejected request: invalid amount', { rawAmount: amount });
    return res.status(400).json({ status: 'error', message: 'Amount is required and must be greater than zero' });
  }

  const endpoint = buildZCreditCreateSessionUrl(ZCREDIT_BASE_URL);
  const missingConfig = [];

  if (!endpoint) missingConfig.push('ZCREDIT_BASE_URL');
  if (!ZCREDIT_KEY) missingConfig.push('ZCREDIT_KEY');
  if (!ZCREDIT_TERMINAL) missingConfig.push('ZCREDIT_TERMINAL');
  if (!ZCREDIT_PASSWORD) missingConfig.push('ZCREDIT_PASSWORD');

  if (missingConfig.length) {
    logZCredit('Rejected request: missing configuration', { missingConfig });
    return res.status(500).json({
      status: 'error',
      message: `Missing ZCredit configuration: ${missingConfig.join(', ')}`,
    });
  }

  const uniqueOrderId = orderId || `ORD-${Date.now()}`;
  const installmentsCount = Math.max(1, Number.isFinite(Number(installments)) ? Number(installments) : 1);

  logSessionEvent(req, 'checkout-start', {
    amount: numericAmount,
    description,
    orderId: uniqueOrderId,
    installments: installmentsCount,
    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
    },
  });

  const payload = {
    Key: ZCREDIT_KEY,
    TerminalNumber: ZCREDIT_TERMINAL,
    User: ZCREDIT_TERMINAL,
    Password: ZCREDIT_PASSWORD,
    Local: 'He',
    UniqueId: uniqueOrderId,
    SuccessUrl: successUrl || '',
    CancelUrl: cancelUrl || '',
    CallbackUrl: callbackUrl || '',
    PaymentType: 'authorize',
    ShowCart: 'false',
    Installments: {
      Type: 'regular',
      MinQuantity: String(installmentsCount),
      MaxQuantity: String(installmentsCount),
    },
    Customer: {
      Email: customerEmail || '',
      Name: customerName || '',
      PhoneNumber: customerPhone || '',
    },
    CartItems: [
      {
        Amount: numericAmount.toFixed(2),
        Currency: 'ILS',
        Name: description || `Order ${uniqueOrderId}`,
        Description: description || `Order ${uniqueOrderId}`,
        Quantity: 1,
        IsTaxFree: 'false',
        AdjustAmount: 'false',
        Image: '',
      },
    ],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    logZCredit('Creating checkout session', {
      endpoint,
      payload: {
        ...payload,
        CartItemsCount: payload.CartItems.length,
      },
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const rawText = await response.text();
    let data;

    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch (error) {
      logZCredit('Failed to parse ZCredit response as JSON', { raw: rawText?.slice(0, 1000) ?? '', error: error instanceof Error ? error.message : 'Unknown error' });
      data = null;
    }

    logZCredit('Received response from ZCredit', {
      status: response.status,
      ok: response.ok,
      rawSnippet: rawText?.slice(0, 500) ?? '',
    });

    if (!response.ok) {
      return res.status(502).json({
        status: 'error',
        message: 'ZCredit rejected the request',
        httpStatus: response.status,
        raw: rawText?.slice(0, 1000) ?? '',
      });
    }

    const sessionUrl = data?.Data?.SessionUrl || data?.SessionUrl || '';

    if (!sessionUrl) {
      logZCredit('Missing SessionUrl in ZCredit response', { raw: rawText?.slice(0, 1000) ?? '' });
      return res.status(502).json({
        status: 'error',
        message: 'ZCredit did not return a checkout URL',
        raw: rawText?.slice(0, 1000) ?? '',
      });
    }

    logZCredit('Created ZCredit checkout session', { sessionUrl, orderId: uniqueOrderId });
    return res.json({ status: 'ok', checkoutUrl: sessionUrl, orderId: uniqueOrderId });
  } catch (error) {
    const isAbortError = error instanceof Error && error.name === 'AbortError';
    const message = isAbortError ? 'ZCredit request timed out' : 'Failed to create ZCredit checkout session';

    logZCredit(message, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return res.status(500).json({
      status: 'error',
      message,
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    clearTimeout(timeout);
  }
});

app.post('/api/wishlist', async (req, res) => {
  const { customerId, itemId, customerEmail, customerName, language, items } = req.body ?? {};

  if (!customerId || !itemId) {
    return res.status(400).json({ status: 'error', message: 'Customer ID and item ID are required' });
  }

  const sessionId = req.sessionId || null;

  try {
    await pool.query(
      `INSERT INTO wishlist (custid, itemid, callid, updcallid, source)
       VALUES (?, ?, ?, ?, ?)`,
      [customerId, itemId, sessionId, sessionId, 'web'],
    );
  } catch (error) {
    console.error('Failed to update wishlist table', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update wishlist' });
  }

  let emailSent = false;
  if (customerEmail && Array.isArray(items) && items.length > 0) {
    try {
      const subject =
        language === 'en' ? 'Your Daf Echad wishlist' : 'רשימת המשאלות שלך בדף אחד';
      const { html, text } = buildWishlistEmailContent({
        customerName,
        items,
        language,
      });

      await sendEmail({
        to: customerEmail,
        subject,
        text,
        html,
      });
      emailSent = true;
    } catch (error) {
      console.error('Error sending wishlist email:', error);
    }
  }

  return res.json({ status: 'ok', emailSent });
});

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

app.get('/api/db-schema', async (_req, res) => {
  if (!DATABASE_NAME) {
    return res.status(500).json({ status: 'error', message: 'Database name is not configured' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT
        t.TABLE_NAME AS tableName,
        t.TABLE_TYPE AS tableType,
        c.COLUMN_NAME AS columnName,
        c.COLUMN_TYPE AS columnType,
        c.IS_NULLABLE AS isNullable,
        c.COLUMN_KEY AS columnKey,
        c.EXTRA AS extra,
        c.COLUMN_DEFAULT AS columnDefault,
        c.ORDINAL_POSITION AS ordinal
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c
        ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME
      WHERE t.TABLE_SCHEMA = ?
      ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION`,
      [DATABASE_NAME]
    );

    const schemaMap = new Map();

    for (const row of rows) {
      const tableName = row.tableName || row.TABLE_NAME;
      if (!tableName) continue;

      const table = schemaMap.get(tableName) || {
        name: tableName,
        type: row.tableType || row.TABLE_TYPE || 'BASE TABLE',
        columns: [],
      };

      if (row.columnName || row.COLUMN_NAME) {
        table.columns.push({
          name: row.columnName || row.COLUMN_NAME,
          type: row.columnType || row.COLUMN_TYPE || '',
          nullable: String(row.isNullable || row.IS_NULLABLE || '').toLowerCase() === 'yes',
          key: row.columnKey || row.COLUMN_KEY || '',
          extra: row.extra || row.EXTRA || '',
          default: row.columnDefault ?? row.COLUMN_DEFAULT ?? null,
          ordinal: Number(row.ordinal || row.ORDINAL_POSITION || 0),
        });
      }

      schemaMap.set(tableName, table);
    }

    const schema = Array.from(schemaMap.values()).map((table) => ({
      ...table,
      columns: table.columns.sort((a, b) => a.ordinal - b.ordinal),
    }));

    res.json(schema);
  } catch (error) {
    console.error('Error fetching database schema:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/db-tables/:tableName/data', async (req, res) => {
  const { tableName } = req.params;
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

  if (!tableName || !/^[a-zA-Z0-9_]+$/.test(tableName)) {
    return res.status(400).json({ status: 'error', message: 'Invalid table name provided' });
  }

  try {
    const [rows] = await pool.query(`SELECT * FROM ${mysql.escapeId(tableName)} LIMIT ?`, [limit]);
    res.json(rows ?? []);
  } catch (error) {
    console.error(`Error fetching data for table ${tableName}:`, error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/customers/login', async (req, res) => {
  const email = (req.body?.email || '').toString().trim();
  const password = (req.body?.password || '').toString();

  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: 'Email and password are required' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT ID, email, fname, lname, telno, fax, lang, ctype, username, pass
       FROM custe
       WHERE LOWER(email) = LOWER(?)
       LIMIT 1`,
      [email],
    );

    const customer = rows?.[0];

    if (!customer || String(customer.pass ?? '') !== password) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    const normalizedCustomer = mapCustomerAccount(customer);

    return res.json({ status: 'ok', customer: normalizedCustomer });
  } catch (error) {
    console.error('Error during customer login:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Unable to sign in at this time',
    });
  }
});

app.get('/api/customers/exists', async (req, res) => {
  const email = (req.query?.email || '').toString().trim();

  if (!email) {
    return res.status(400).json({ status: 'error', message: 'Email is required' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT ID
       FROM custe
       WHERE LOWER(email) = LOWER(?)
       LIMIT 1`,
      [email],
    );

    return res.json({ status: 'ok', exists: Boolean(rows?.[0]) });
  } catch (error) {
    console.error('Error checking customer email:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Unable to verify email at this time',
    });
  }
});

app.post('/api/customers/login/email/request', async (req, res) => {
  const email = (req.body?.email || '').toString().trim();
  const language = normalizePreferredLanguage(req.body?.language || 'he');

  if (!email) {
    return res.status(400).json({ status: 'error', message: 'Email is required' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT ID, email, fname, lname, lang
       FROM custe
       WHERE LOWER(email) = LOWER(?)
       LIMIT 1`,
      [email],
    );

    const customer = rows?.[0];

    if (!customer) {
      const temporaryPassword = generateNumericPassword(6);
      const fallbackFirstName = language === 'he' ? 'לקוח' : 'Customer';
      const fallbackLastName = language === 'he' ? 'חדש' : 'New';
      const username = email || `${fallbackFirstName}.${fallbackLastName}`.replace(/\s+/g, '.').toLowerCase();

      const [autoRows] = await pool.query(
        `SELECT AUTO_INCREMENT AS nextId
         FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'custe'`,
      );
      const nextCustomerId = autoRows?.[0]?.nextId;
      const provisionalPhoneNumber = nextCustomerId ? `9900${nextCustomerId}` : '0';

      const [insertResult] = await pool.query(
        `INSERT INTO custe (fname, lname, email, setup, stamp, username, pass, ctype, telno)
         VALUES (?, ?, ?, NULL, NOW(), ?, ?, ?, ?)`,
        [fallbackFirstName, fallbackLastName, email, username, temporaryPassword, 0, provisionalPhoneNumber],
      );

      const customerId = insertResult.insertId;
      const phoneNumber = `9900${customerId}`;   
      
      await pool.query(`UPDATE custe SET telno = ?, email = ?, pass = ? WHERE ID = ?`, [
        phoneNumber,
        email,
        temporaryPassword,
        customerId,
      ]);

      const subject =
        language === 'he' ? 'דף אחד - החשבון החדש שלכם וסיסמה זמנית' : 'Your Daf Echad account & temporary password';
      const greeting = language === 'he' ? 'שלום' : 'Hello';
      const instructions =
        language === 'he'
          ? 'יצרנו עבורכם חשבון חדש. הנה סיסמה זמנית כדי להיכנס מיד.'
          : 'We created a new account for you. Use the temporary password below to sign in right away.';
      const passwordLabel = language === 'he' ? 'סיסמה זמנית' : 'Temporary password';

      await sendEmail({
        to: email,
        subject,
        text: `${greeting},\n\n${instructions}\n\n${passwordLabel}: ${temporaryPassword}`,
        html: `<p>${greeting},</p><p>${instructions}</p><p>${passwordLabel}:</p><div style="font-size:24px; font-weight:700; letter-spacing:1px; direction:ltr;">${temporaryPassword}</div>`,
      });

      console.info('Created customer account for email login request', { customerId, email });

      return res.json({ status: 'ok', mode: 'temporary_password' });
    }

    const code = generateEmailLoginCode();
    storeEmailLoginCode(customer.email, code);

    const subject = language === 'he' ? 'קוד כניסה לחשבון דף אחד' : 'Your Daf Echad login code';
    const greeting = language === 'he' ? 'שלום' : 'Hello';
    const instructions =
      language === 'he'
        ? 'השתמשו בקוד החד פעמי הבא כדי להיכנס לחשבון שלכם. הקוד תקף ל-10 דקות.'
        : 'Use the following one-time code to sign in to your account. The code is valid for 10 minutes.';
    const codeLabel = language === 'he' ? 'קוד כניסה' : 'Login code';

    await sendEmail({
      to: customer.email,
      subject,
      text: `${greeting},\n\n${instructions}\n\n${codeLabel}: ${code}`,
      html: `<p>${greeting},</p><p>${instructions}</p><p>${codeLabel}:</p><div style="font-size:26px; font-weight:700; letter-spacing:2px; direction:ltr;">${code}</div>` ,
    });

    return res.json({ status: 'ok', mode: 'code', message: 'Code sent' });
  } catch (error) {
    console.error('Error generating email login code:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to send login code' });
  }
});

app.post('/api/customers/login/email/verify', async (req, res) => {
  const email = (req.body?.email || '').toString().trim();
  const code = (req.body?.code || '').toString().trim();

  if (!email || !code) {
    return res.status(400).json({ status: 'error', message: 'Email and code are required' });
  }

  const stored = getEmailLoginCode(email);

  if (!stored) {
    return res.status(400).json({ status: 'error', message: 'Code expired or missing' });
  }

  if (stored.attempts >= EMAIL_LOGIN_MAX_ATTEMPTS) {
    clearEmailLoginCode(email);
    return res.status(429).json({ status: 'error', message: 'Too many attempts. Request a new code.' });
  }

  if (stored.code !== code) {
    stored.attempts += 1;
    return res.status(401).json({ status: 'error', message: 'Invalid code' });
  }

  clearEmailLoginCode(email);

  try {
    const [rows] = await pool.query(
      `SELECT ID, email, fname, lname, telno, fax, lang, ctype
       FROM custe
       WHERE LOWER(email) = LOWER(?)
       LIMIT 1`,
      [email],
    );

    const customer = rows?.[0];

    if (!customer) {
      return res.status(404).json({ status: 'error', message: 'Account not found' });
    }

    const normalizedCustomer = mapCustomerAccount(customer);
    return res.json({ status: 'ok', customer: normalizedCustomer });
  } catch (error) {
    console.error('Error verifying email login code:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to verify code' });
  }
});

app.post('/api/customers/password-reset', async (req, res) => {
  const email = (req.body?.email || '').toString().trim();
  const language = (req.body?.language || '').toString().toLowerCase().startsWith('he') ? 'he' : 'en';

  if (!email) {
    return res.status(400).json({ status: 'error', message: 'Email is required' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT ID, email, fname, lname, lang
       FROM custe
       WHERE LOWER(email) = LOWER(?)
       LIMIT 1`,
      [email],
    );

    const customer = rows?.[0];

    if (!customer) {
      // Avoid leaking which emails exist.
      return res.json({
        status: 'ok',
        message:
          language === 'he'
            ? 'אם החשבון קיים שלחנו סיסמה זמנית למייל'
            : 'If the account exists, we sent a temporary password to the email address',
      });
    }

    const temporaryPassword = generateTemporaryPassword();
    const customerId = customer.ID;

    await pool.query(`UPDATE custe SET pass = ? WHERE ID = ?`, [temporaryPassword, customerId]);

    const subject =
      language === 'he'
        ? 'שחזור גישה לדף אחד - סיסמה זמנית'
        : 'Daf Echad access recovery - temporary password';

    const greetingName = customer.fname || customer.lname ? `${customer.fname ?? ''} ${customer.lname ?? ''}`.trim() : '';
    const displayName = greetingName || (language === 'he' ? 'לקוח יקר/ה' : 'Dear customer');

    const bodyText =
      language === 'he'
        ? `שלום ${displayName},
קיבלתם סיסמה זמנית עבור החשבון שלכם בדף אחד.

סיסמה זמנית: ${temporaryPassword}

הסיסמה תקפה לזמן מוגבל. אנו ממליצים להיכנס למערכת ולעדכן סיסמה קבועה באזור הפרופיל שלכם.
אם לא ביקשתם שחזור - ניתן להתעלם מהמייל והסיסמה תישאר ללא שינוי.`
        : `Hello ${displayName},
We generated a temporary password for your Daf Echad account.

Temporary password: ${temporaryPassword}

The password is valid for a limited time. Please sign in and change it to a permanent password in your profile.
If you did not request a reset, you can ignore this email and your password will remain unchanged.`;

    const bodyHtml =
      language === 'he'
        ? `<p>שלום ${displayName},</p>
<p>יצרנו עבורכם סיסמה זמנית לחשבון בדף אחד.</p>
<p>סיסמה זמנית:</p>
<div style="font-size:24px; font-weight:700; letter-spacing:1px; direction:ltr;">${temporaryPassword}</div>
<p>הסיסמה תקפה לזמן מוגבל. מומלץ להתחבר ולעדכן סיסמה קבועה באזור הפרופיל.</p>
<p>אם לא ביקשתם שחזור, ניתן להתעלם מהמייל והסיסמה תישאר ללא שינוי.</p>`
        : `<p>Hello ${displayName},</p>
<p>We generated a temporary password for your Daf Echad account.</p>
<p>Temporary password:</p>
<div style="font-size:24px; font-weight:700; letter-spacing:1px; direction:ltr;">${temporaryPassword}</div>
<p>The password is valid for a limited time. Please sign in and change it to a permanent password in your profile.</p>
<p>If you did not request a reset, you can ignore this email and your password will remain unchanged.</p>`;

    await sendEmail({
      to: email,
      subject,
      text: bodyText,
      html: bodyHtml,
    });

    console.info('Temporary password email sent', {
      customerId,
      email,
      language,
    });

    return res.json({
      status: 'ok',
      message:
        language === 'he'
          ? 'שלחנו סיסמה זמנית למייל שלכם'
          : 'We sent a temporary password to your email address',
    });
  } catch (error) {
    console.error('Error sending temporary password:', error);
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to send temporary password',
    });
  }
});

app.put('/api/customers/:id/profile', async (req, res) => {
  const customerId = req.params.id;
  const firstName = (req.body?.firstName ?? '').toString().trim();
  const lastName = (req.body?.lastName ?? '').toString().trim();
  const email = (req.body?.email ?? '').toString().trim();
  const fax = (req.body?.fax ?? '').toString().trim();

  if (!customerId) {
    return res.status(400).json({ status: 'error', message: 'Customer ID is required' });
  }

  if (!firstName || !lastName) {
    return res.status(400).json({ status: 'error', message: 'First and last name are required' });
  }

  const updates = [
    { column: 'fname', value: firstName },
    { column: 'lname', value: lastName },
  ];

  if (phone) updates.push({ column: 'telno', value: phone });
  if (email) updates.push({ column: 'email', value: email });
  if (fax) updates.push({ column: 'fax', value: fax });

  if (!updates.length) {
    return res.status(400).json({ status: 'error', message: 'No profile fields to update' });
  }

  const setClauses = updates.map((entry) => `${entry.column} = ?`).join(', ');
  const values = updates.map((entry) => entry.value);

  try {
    const [result] = await pool.query(`UPDATE custe SET ${setClauses} WHERE ID = ?`, [...values, customerId]);

    if (!result.affectedRows) {
      return res.status(404).json({ status: 'error', message: 'Customer not found' });
    }

    const [rows] = await pool.query(
      `SELECT ID, email, fname, lname, telno, fax, lang, ctype, username, pass
       FROM custe
       WHERE ID = ?
       LIMIT 1`,
      [customerId],
    );

    const updatedCustomer = mapCustomerAccount(rows?.[0] || {});
    return res.json({ status: 'ok', customer: updatedCustomer });
  } catch (error) {
    console.error('Error updating customer profile:', error);
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to update profile',
    });
  }
});

app.post('/api/customers', async (req, res) => {
  const firstName = (req.body?.firstName ?? '').toString().trim();
  const lastName = (req.body?.lastName ?? '').toString().trim();
  const email = (req.body?.email ?? '').toString().trim();

  if (!firstName || !lastName) {
    return res.status(400).json({ status: 'error', message: 'First and last name are required' });
  }

  const temporaryPassword = generateNumericPassword(6);
  const username = email || `${firstName}.${lastName}`.replace(/\s+/g, '.').toLowerCase();

  try {
    const [result] = await pool.query(
      `INSERT INTO custe (fname, lname, telno, email, lang, setup, stamp, username, pass, ctype)
       VALUES (?, ?, NULL, ?, NULL, NULL, NOW(), ?, ?, ?)`,
      [firstName, lastName, email || null, username, temporaryPassword, 0],
    );

    const insertId = result.insertId;
    if (!insertId) {
      return res.status(500).json({ status: 'error', message: 'Unable to create customer' });
    }
 
    const phoneNumber = `9900${insertId}`;
    await pool.query(`UPDATE custe SET telno = ?, email = ?, pass = ? WHERE ID = ?`, [
      phoneNumber,
      email || null,
      temporaryPassword,
      insertId,
    ]);

    const [rows] = await pool.query(
      `SELECT ID, telno, fname, lname, email, fax, lang, setup, comdflt, ctype, username, pass, stamp
       FROM custe
       WHERE ID = ?
       LIMIT 1`,
      [insertId],
    );

    const languages = await fetchLanguages();
    const languageMap = buildLanguageMap(languages);
    const createdCustomer = mapCustomerRow(rows?.[0] || {}, languageMap);

    return res.status(201).json(createdCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to create customer',
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

app.get('/api/customers/:id/credit', async (req, res) => {
  const customerId = req.params.id;

  if (!customerId) {
    return res.status(400).json({ status: 'error', message: 'Customer ID is required' });
  }

  try {
    const rows = await fetchCustomerCredits(customerId);
    const normalizedRows = rows
      .map((row) => ({
        id: row.ID ? String(row.ID) : row.id ? String(row.id) : '',
        customerId: row.custid ? String(row.custid) : '',
        date: row.date ? String(row.date) : '',
        code: row.ccode ? String(row.ccode) : '',
        description: row.cdesc ? String(row.cdesc) : '',
        amount: row.amt !== undefined && row.amt !== null ? Number(row.amt) : 0,
        orderId: row.usedordid ? String(row.usedordid) : '',
        stamp: row.stamp ? String(row.stamp) : '',
      }))
      .filter((entry) => entry.id !== '' || entry.customerId !== '');

    const chronological = [...normalizedRows].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      const idA = Number.parseInt(a.id, 10) || 0;
      const idB = Number.parseInt(b.id, 10) || 0;

      if (dateA !== dateB) return dateA - dateB;
      return idA - idB;
    });

    let runningBalance = 0;
    const withRunningBalance = chronological.map((entry) => {
      runningBalance += entry.amount;
      return { ...entry, runningBalance };
    });

    const transactions = [...withRunningBalance].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      const idA = Number.parseInt(a.id, 10) || 0;
      const idB = Number.parseInt(b.id, 10) || 0;

      if (dateA !== dateB) return dateB - dateA;
      return idB - idA;
    });

    const totalCredit = withRunningBalance.length
      ? withRunningBalance[withRunningBalance.length - 1].runningBalance
      : 0;

    res.json({
      totalCredit,
      count: transactions.length,
      updatedAt: transactions[0]?.stamp ?? transactions[0]?.date ?? null,
      transactions,
    });
  } catch (error) {
    console.error('Error fetching customer credit history:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/customers/:id/shipping-addresses', async (req, res) => {
  const customerId = req.params.id;

  if (!customerId) {
    return res.status(400).json({ status: 'error', message: 'Customer ID is required' });
  }

  try {
    const rows = await fetchShippingAddresses(customerId);
    const addresses = rows.map((row) => mapShippingAddressRow(row)).filter((address) => address.id);

    res.json(addresses);
  } catch (error) {
    console.error('Error fetching shipping addresses:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/customers/:id/shipping-addresses', async (req, res) => {
  const customerId = req.params.id;
  const payload = normalizeShippingAddressPayload(req.body ?? {});

  if (!customerId) {
    return res.status(400).json({ status: 'error', message: 'Customer ID is required' });
  }

  if (!payload.street || !payload.city) {
    return res.status(400).json({ status: 'error', message: 'Street and city are required' });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    if (payload.isDefault) {
      await saveDefaultShippingAddress(connection, customerId);
    }

    const [insertResult] = await connection.query(
      `INSERT INTO shipto (custid, stdefault, street, no, ent, apt, city, state, zip, country, specinst, callid)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customerId,
        payload.isDefault ? 'Y' : 'N',
        payload.street,
        payload.houseNumber || null,
        payload.entrance || null,
        payload.apartment || null,
        payload.city,
        payload.state || null,
        payload.zip || null,
        payload.country || null,
        payload.specialInstructions || null,
        payload.callId || null,
      ],
    );

    const insertedId = insertResult.insertId;

    const [rows] = await connection.query(
      `SELECT ID, custid, stdefault, street, no, ent, apt, city, state, zip, country, specinst, callid, stamp
       FROM shipto WHERE ID = ?`,
      [insertedId],
    );

    await connection.commit();

    const createdAddress = mapShippingAddressRow(rows[0] || {});
    return res.status(201).json(createdAddress);
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error('Error creating shipping address:', error);
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

app.put('/api/customers/:id/shipping-addresses/:addressId', async (req, res) => {
  const customerId = req.params.id;
  const addressId = req.params.addressId;
  const payload = normalizeShippingAddressPayload(req.body ?? {});

  if (!customerId || !addressId) {
    return res.status(400).json({ status: 'error', message: 'Customer and address IDs are required' });
  }

  if (!payload.street || !payload.city) {
    return res.status(400).json({ status: 'error', message: 'Street and city are required' });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existingRows] = await connection.query('SELECT ID FROM shipto WHERE ID = ? AND custid = ?', [
      addressId,
      customerId,
    ]);

    if (!existingRows.length) {
      await connection.rollback();
      return res.status(404).json({ status: 'error', message: 'Address not found for customer' });
    }

    if (payload.isDefault) {
      await saveDefaultShippingAddress(connection, customerId, addressId);
    }

    await connection.query(
      `UPDATE shipto
       SET stdefault = ?, street = ?, no = ?, ent = ?, apt = ?, city = ?, state = ?, zip = ?, country = ?, specinst = ?, callid = ?
       WHERE ID = ? AND custid = ?`,
      [
        payload.isDefault ? 'Y' : 'N',
        payload.street,
        payload.houseNumber || null,
        payload.entrance || null,
        payload.apartment || null,
        payload.city,
        payload.state || null,
        payload.zip || null,
        payload.country || null,
        payload.specialInstructions || null,
        payload.callId || null,
        addressId,
        customerId,
      ],
    );

    const [rows] = await connection.query(
      `SELECT ID, custid, stdefault, street, no, ent, apt, city, state, zip, country, specinst, callid, stamp
       FROM shipto WHERE ID = ?`,
      [addressId],
    );

    await connection.commit();

    const updatedAddress = mapShippingAddressRow(rows[0] || {});
    return res.json(updatedAddress);
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error('Error updating shipping address:', error);
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    if (connection) {
      connection.release();
    }
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

    logSessionEvent(req, 'view-item', {
      itemId: book.id,
      itemTitle: book.title_he || book.title_en,
      categoryId: book.category_id,
    });

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

app.get('/api/carriers', async (_req, res) => {
  try {
    const carriers = await fetchCarriers();

    const normalizedCarriers = carriers
      .map((carrier) => ({
        id: carrier.id,
        name: carrier.name.trim(),
        contact: carrier.contact?.trim() ?? '',
        telno: carrier.telno?.trim() ?? '',
        email: carrier.email?.trim() ?? '',
        notes: carrier.notes?.trim() ?? '',
      }))
      .filter((carrier) => carrier.id && carrier.name);

    res.json(normalizedCarriers);
  } catch (error) {
    console.error('Error fetching carriers:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/shipping/hfd/rate', async (req, res) => {
  const {
    cityName,
    streetName,
    houseNum,
    shipmentWeight,
    productsPrice,
    nameTo,
    telFirst,
    referenceNum1,
    referenceNum2,
  } = req.body || {};

  const weightGrams = normalizePositiveNumber(shipmentWeight, 0);
  const estimatedPriceILS = estimateHfdPriceILS(weightGrams);

  if (!cityName || !streetName || !weightGrams) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: cityName, streetName, and shipmentWeight are mandatory.',
    });
  }

  if (!HFD_BASE_URL || !HFD_TOKEN || !HFD_CLIENT_NUMBER) {
    return res.status(503).json({
      status: 'error',
      message: 'HFD API is not configured. Please provide HFD_BASE_URL, HFD_TOKEN, and HFD_CLIENT_NUMBER.',
      estimatedPriceILS,
    });
  }

  try {
    const payload = buildHfdShipmentPayload({
      cityName,
      streetName,
      houseNum,
      shipmentWeight: weightGrams,
      productsPrice: Number(productsPrice) || 0,
      nameTo,
      telFirst,
      referenceNum1,
      referenceNum2,
    });

    const url = `${HFD_BASE_URL}/shipments/create`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${HFD_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        status: 'error',
        message: responseBody?.errorMessage || 'HFD request failed',
        hfdStatus: response.status,
        hfdResponse: responseBody,
        estimatedPriceILS,
      });
    }

    const normalizedResponse = {
      shipmentNumber: responseBody?.shipmentNumber ?? null,
      randNumber: responseBody?.randNumber ?? null,
      referenceNumber1: responseBody?.referenceNumber1 ?? null,
      referenceNumber2: responseBody?.referenceNumber2 ?? null,
      deliveryLine: responseBody?.deliveryLine ?? null,
      deliveryArea: responseBody?.deliveryArea ?? null,
      sortingCode: responseBody?.sortingCode ?? null,
      pickUpCode: responseBody?.pickUpCode ?? null,
      existingShipmentNumber: responseBody?.existingShipmentNumber ?? null,
      errorCode: responseBody?.errorCode ?? null,
      errorMessage: responseBody?.errorMessage ?? null,
    };

    res.json({
      status: 'ok',
      estimatedPriceILS,
      weightGrams,
      currency: 'ILS',
      hfdResponse: normalizedResponse,
    });
  } catch (error) {
    console.error('Error while contacting HFD:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown HFD error',
      estimatedPriceILS,
    });
  }
});

app.post('/api/shipping/hfd/track', async (req, res) => {
  const { shipmentNumber, reference } = req.body || {};

  if (!shipmentNumber && !reference) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required identifier: send shipmentNumber or reference.',
    });
  }

  if (!HFD_TRACKING_BASE_URL || !HFD_TOKEN) {
    return res.status(503).json({
      status: 'error',
      message: 'HFD tracking is not configured. Provide HFD_TRACKING_BASE_URL/HFD_BASE_URL and HFD_TOKEN.',
    });
  }

  try {
    const encodedShipment = shipmentNumber ? encodeURIComponent(shipmentNumber) : '';
    const encodedReference = reference ? encodeURIComponent(reference) : '';
    const args = shipmentNumber ? `-N${encodedShipment}` : `-N,-A${encodedReference}`;
    const url = `${HFD_TRACKING_BASE_URL}/Request.aspx?APPNAME=run&PRGNAME=ship_status_xml&ARGUMENTS=${args}`;

    const headers = { Accept: 'application/xml' };
    if (HFD_TOKEN) {
      headers.Authorization = `Bearer ${HFD_TOKEN}`;
    }

    const response = await fetch(url, { headers });
    const xml = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        status: 'error',
        message: extractXmlValue(xml, 'message') || 'HFD tracking request failed',
      });
    }

    const normalized = normalizeHfdTrackingResponse(xml);

    res.json({
      status: 'ok',
      carrier: 'HFD',
      shipmentNumber: normalized?.shipmentNumber || shipmentNumber || null,
      referenceNumber1: normalized?.referenceNumber1 || null,
      referenceNumber2: normalized?.referenceNumber2 || reference || null,
      delivered: normalized?.delivered ?? false,
      deliveryLine: normalized?.deliveryLine || null,
      deliveryArea: normalized?.deliveryArea || null,
      statuses: normalized?.statuses || [],
    });
  } catch (error) {
    console.error('Error while fetching HFD tracking:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown HFD tracking error',
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
