/**
 * Regenerates public/sitemap.xml from the shared SEO route map.
 * Run with: npm run sitemap
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const source = readFileSync(resolve(root, 'src/lib/seoRoutes.ts'), 'utf-8')

const routeBlocks = [...source.matchAll(/path:\s*'([^']+)'[\s\S]*?indexable:\s*(true|false)/g)]
const indexable = routeBlocks
  .filter(([, , flag]) => flag === 'true')
  .map(([, path]) => path)

const showcaseSlugs = [...source.matchAll(/slug:\s*'([^']+)'/g)].map(([, slug]) => slug)
const paths = [...new Set([...indexable, ...showcaseSlugs.map((slug) => `/showcase/${slug}`)])]

const priority = (path) => {
  if (path === '/') return '1.0'
  if (path === '/showcase' || path === '/services' || path === '/browse') return '0.9'
  if (path.startsWith('/showcase/')) return '0.8'
  if (path === '/about') return '0.8'
  if (path === '/contact') return '0.7'
  if (path === '/faq') return '0.6'
  return '0.3'
}

const changefreq = (path) => {
  if (path === '/' || path.startsWith('/showcase') || path === '/browse') return 'daily'
  if (path === '/privacy' || path === '/terms') return 'yearly'
  return 'monthly'
}

const lastmod = new Date().toISOString().slice(0, 10)
const body = paths
  .map(
    (path) => `  <url>
    <loc>https://marketspheregroup.com${path === '/' ? '/' : path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq(path)}</changefreq>
    <priority>${priority(path)}</priority>
  </url>`,
  )
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`

writeFileSync(resolve(root, 'public/sitemap.xml'), xml)
console.log(`sitemap.xml written with ${paths.length} URLs`)
