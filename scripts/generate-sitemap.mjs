import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import products from '../src/data/mockProducts.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const siteUrl = (process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://daf-echad.example.com')
  .replace(/\/$/, '');

const createSlugFromTitle = (title) => title.trim().replace(/\s+/g, '-').replace(/-+/g, '-');
const buildProductSlug = (product) => {
  const title = product.title_he || product.title_en || product.id;
  const sku = product.item_number ?? product.id;

  const titleSlug = createSlugFromTitle(String(title));
  const skuSlug = createSlugFromTitle(String(sku));

  return `${titleSlug}-sku-${skuSlug}`;
};

const buildProductPath = (product) => `/item/${encodeURIComponent(buildProductSlug(product))}`;

const urls = [
  { path: '/', changefreq: 'daily', priority: 1.0 },
  { path: '/catalog', changefreq: 'weekly', priority: 0.8 },
  ...products.map((product) => ({
    path: buildProductPath(product),
    changefreq: 'weekly',
    priority: 0.7,
  })),
];

const buildUrlXml = (entry) => `  <url>
    <loc>${siteUrl}${entry.path}</loc>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(buildUrlXml).join('\n')}
</urlset>
`;

const outputPath = path.resolve(__dirname, '../public/sitemap.xml');
fs.writeFileSync(outputPath, sitemap, 'utf-8');

console.log(`Sitemap updated at ${outputPath} with ${urls.length} URLs using base ${siteUrl}`);
