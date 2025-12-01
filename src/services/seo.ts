import { Language } from '../types';
import { Book } from '../types/catalog';
import { buildProductPath } from '../utils/slug';

export type SeoPage = 'home' | 'catalog' | 'item' | 'cart' | 'account';

interface SeoOptions {
  language: Language;
  t: (key: string) => string;
  product?: Book;
}

interface SeoMetadata {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  keywords?: string;
  image?: string;
  siteName?: string;
}

const DEFAULT_BASE_URL = 'https://daf-echad.example.com';

const baseUrl = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '')
  || DEFAULT_BASE_URL;

const ensureMetaTag = (selector: string, attribute: string, value: string) => {
  if (!value) return;
  let element = document.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    const attributeName = selector.includes('name=') ? 'name' : 'property';
    element.setAttribute(attributeName, selector.split('"')[1]);
    document.head.appendChild(element);
  }
  element.setAttribute(attribute, value);
};

const ensureLinkTag = (rel: string, href: string) => {
  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
};

const setHtmlDirection = (language: Language) => {
  const html = document.documentElement;
  html.lang = language;
  html.dir = language === 'he' ? 'rtl' : 'ltr';
};

const removeMetaTags = (selectors: string[]) => {
  selectors.forEach((selector) => {
    const element = document.querySelector(selector);
    element?.remove();
  });
};

const buildCanonical = (path: string) => `${baseUrl}${path}`;

const buildKeywords = (
  ...keywordSources: (string | string[] | null | undefined)[]
): string => {
  const keywords = new Set<string>();

  const addKeyword = (keyword: string | null | undefined) => {
    keyword
      ?.split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => keywords.add(part));
  };

  keywordSources.forEach((keywordSource) => {
    if (Array.isArray(keywordSource)) {
      keywordSource.forEach(addKeyword);
    } else {
      addKeyword(keywordSource);
    }
  });

  return Array.from(keywords).join(', ');
};

const buildItemDescription = (language: Language, product: Book) => {
  if (language === 'he') {
    return product.description_he || `${product.title_he} - ספר מקור מברסלב עם כריכה איכותית.`;
  }
  return product.description_en || `${product.title_en} - authentic Breslov title with premium binding.`;
};

export const applySeoForPage = (page: string, options: SeoOptions) => {
  const { language, product, t } = options;
  setHtmlDirection(language);

  const siteTitle = t('site.title');
  const homeDescription = language === 'he'
    ? 'כל ספרי ברסלב המקוריים עם משלוח מהיר ושירות אישי.'
    : 'Authentic Breslov holy books with fast delivery and personal service.';

  let metadata: SeoMetadata = {
    title: siteTitle,
    description: homeDescription,
    path: '/',
    type: 'website',
    siteName: siteTitle,
    keywords: buildKeywords(
      language === 'he'
        ? 'ספרי ברסלב, רבי נחמן, חנות ספרים, חסידות'
        : 'Breslov books, Rabbi Nachman, sefer store, chassidut',
    ),
    image: '/logo.png',
  };

  if (page === 'catalog') {
    metadata = {
      title: language === 'he' ? 'קטלוג ספרי ברסלב' : 'Breslov Books Catalog',
      description: language === 'he'
        ? 'דפדפו בקטלוג ספרי ברסלב המקיף לפי קטגוריות ומבצעים.'
        : 'Browse the complete Breslov catalog by category, pricing, and new arrivals.',
      path: '/catalog',
      type: 'website',
      siteName: siteTitle,
      keywords: buildKeywords(
        language === 'he'
          ? 'קטלוג ברסלב, ספרים חסידיים, קניות אונליין'
          : 'Breslov catalog, chassidic books, buy jewish books online',
      ),
      image: '/logo.png',
    };
  }

  if (page === 'item' && product) {
    const categoryName = product.category
      ? language === 'he'
        ? product.category.name_he
        : product.category.name_en
      : '';

    metadata = {
      title: language === 'he' ? product.title_he : product.title_en,
      description: buildItemDescription(language, product),
      path: buildProductPath(product),
      type: 'article',
      siteName: siteTitle,
      keywords: buildKeywords(
        product.keywords,
        categoryName,
        language === 'he' ? product.title_he : product.title_en,
        language === 'he' ? 'ספר ברסלב' : 'Breslov sefer',
        language === 'he' ? 'רבי נחמן' : 'Rabbi Nachman',
      ),
      image: product.image_url,
    };
  }

  if (page === 'cart') {
    metadata = {
      title: language === 'he' ? 'עגלה והזמנה' : 'Cart & Checkout',
      description: language === 'he'
        ? 'סקירת פריטים, משלוח ואמצעי תשלום לפני השלמת הזמנה.'
        : 'Review your cart, choose worldwide delivery, and select payment before confirming.',
      path: '/cart',
      type: 'website',
      siteName: siteTitle,
      keywords: buildKeywords(
        language === 'he'
          ? 'עגלה, תשלום, משלוח בינלאומי, ברסלב'
          : 'cart, checkout, worldwide shipping, breslov books',
      ),
      image: '/logo.png',
    };
  }

  if (page === 'account') {
    metadata = {
      title: language === 'he' ? 'חשבון לקוח' : 'Customer account',
      description: language === 'he'
        ? 'איזור אישי לניהול הזמנות, משלוחים, כתובות והעדפות קנייה.'
        : 'Private area for managing orders, delivery addresses, and shopping preferences.',
      path: '/account',
      type: 'website',
      siteName: siteTitle,
      keywords: buildKeywords(
        language === 'he'
          ? 'חשבון לקוח, הזמנות, משלוחים, ספרי ברסלב'
          : 'customer account, orders, shipping, breslov books',
      ),
      image: '/logo.png',
    };
  }

  const pageTitle = `${metadata.title} | ${siteTitle}`;
  const canonicalUrl = buildCanonical(metadata.path);

  document.title = pageTitle;

  ensureMetaTag('meta[name="description"]', 'content', metadata.description);
  ensureMetaTag('meta[name="keywords"]', 'content', metadata.keywords || '');
  ensureMetaTag('meta[property="og:title"]', 'content', pageTitle);
  ensureMetaTag('meta[property="og:site_name"]', 'content', metadata.siteName || siteTitle);
  ensureMetaTag('meta[property="og:description"]', 'content', metadata.description);
  ensureMetaTag('meta[property="og:type"]', 'content', metadata.type || 'website');
  ensureMetaTag('meta[property="og:url"]', 'content', canonicalUrl);
  ensureMetaTag('meta[property="og:image"]', 'content', metadata.image || `${baseUrl}/logo.png`);
  ensureMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
  ensureMetaTag('meta[name="twitter:title"]', 'content', pageTitle);
  ensureMetaTag('meta[name="twitter:description"]', 'content', metadata.description);
  ensureMetaTag('meta[name="twitter:image"]', 'content', metadata.image || `${baseUrl}/logo.png`);

  const productMetaSelectors = [
    'meta[property="product:price:amount"]',
    'meta[property="product:price:currency"]',
    'meta[property="product:availability"]',
    'meta[name="product:item_number"]',
    'meta[name="product:binding"]',
    'meta[name="product:dimensions"]',
    'meta[name="product:language"]',
  ];

  if (page === 'item' && product) {
    const priceAmount = language === 'he' ? product.price_ils : product.price_usd;
    const priceCurrency = language === 'he' ? 'ILS' : 'USD';
    const availability = product.in_stock ? 'in stock' : 'out of stock';

    ensureMetaTag('meta[property="product:price:amount"]', 'content', String(priceAmount));
    ensureMetaTag('meta[property="product:price:currency"]', 'content', priceCurrency);
    ensureMetaTag('meta[property="product:availability"]', 'content', availability);
    ensureMetaTag('meta[name="product:item_number"]', 'content', product.item_number || product.id);
    ensureMetaTag('meta[name="product:binding"]', 'content', product.binding);
    ensureMetaTag('meta[name="product:dimensions"]', 'content', product.dimensions);
    ensureMetaTag('meta[name="product:language"]', 'content', product.language);
  } else {
    removeMetaTags(productMetaSelectors);
  }

  ensureLinkTag('canonical', canonicalUrl);
};
