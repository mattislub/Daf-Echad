import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import products from '../src/data/mockProducts.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const siteUrl = (process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://daf-echad.example.com')
  .replace(/\/$/, '');

const urls = [
  { path: '/', changefreq: 'daily', priority: 1.0 },
  { path: '/catalog', changefreq: 'weekly', priority: 0.8 },
  ...products.map((product) => ({
    path: `/item/${product.id}`,
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
