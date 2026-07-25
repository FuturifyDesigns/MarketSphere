import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { ROUTE_SEO, canonicalUrl, type RouteSeo } from './src/lib/seoRoutes.ts'

const NOINDEX = 'noindex, nofollow'
const INDEX_ROBOTS =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'

function replaceTag(html: string, pattern: RegExp, replacement: string) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function applyRouteSeo(template: string, route: RouteSeo) {
  const href = canonicalUrl(route.path)
  const title = escapeHtml(route.title)
  const description = escapeHtml(route.description)
  let html = template

  html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
  html = replaceTag(
    html,
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${description}" />`,
  )
  html = replaceTag(
    html,
    /<meta\s+property="og:title"[\s\S]*?\/>/,
    `<meta property="og:title" content="${title}" />`,
  )
  html = replaceTag(
    html,
    /<meta\s+property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${description}" />`,
  )
  html = replaceTag(
    html,
    /<meta\s+property="og:url"[\s\S]*?\/>/,
    `<meta property="og:url" content="${href}" />`,
  )
  html = replaceTag(
    html,
    /<meta\s+name="twitter:title"[\s\S]*?\/>/,
    `<meta name="twitter:title" content="${route.title}" />`,
  )
  html = replaceTag(
    html,
    /<meta\s+name="twitter:description"[\s\S]*?\/>/,
    `<meta name="twitter:description" content="${route.description}" />`,
  )
  html = replaceTag(
    html,
    /<link rel="canonical"[^>]*\/>/,
    `<link rel="canonical" href="${href}" />`,
  )
  html = replaceTag(
    html,
    /<meta\s+name="robots"[\s\S]*?\/>/,
    `<meta name="robots" content="${route.indexable ? INDEX_ROBOTS : NOINDEX}" />`,
  )
  html = replaceTag(
    html,
    /<meta\s+name="googlebot"[\s\S]*?\/>/,
    `<meta name="googlebot" content="${route.indexable ? 'index, follow' : NOINDEX}" />`,
  )

  return html
}

/**
 * GitHub Pages has no SPA rewrite, so every route ships as a real HTML file.
 * Each file carries its own title/description/canonical, and unknown paths fall
 * back to 404.html which still boots the app.
 */
function prerenderRoutes() {
  return {
    name: 'prerender-routes',
    closeBundle() {
      const outDir = resolve(__dirname, 'dist')
      const template = readFileSync(resolve(outDir, 'index.html'), 'utf-8')

      writeFileSync(resolve(outDir, '404.html'), template)

      for (const route of ROUTE_SEO) {
        if (route.path === '/') continue

        const html = applyRouteSeo(template, route)
        const relative = route.path.replace(/^\/+/, '')

        const flatFile = resolve(outDir, `${relative}.html`)
        mkdirSync(dirname(flatFile), { recursive: true })
        writeFileSync(flatFile, html)

        const directoryFile = resolve(outDir, relative, 'index.html')
        mkdirSync(dirname(directoryFile), { recursive: true })
        writeFileSync(directoryFile, html)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), prerenderRoutes()],
  base: '/',
  build: {
    sourcemap: false,
    minify: true,
    target: 'es2022',
    cssCodeSplit: true,
    reportCompressedSize: false,
  },
})
