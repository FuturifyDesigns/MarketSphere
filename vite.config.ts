import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** Copy index.html → 404.html so unknown paths still load the SPA shell. */
function spaFallback404() {
  return {
    name: 'spa-fallback-404',
    closeBundle() {
      const outDir = resolve(__dirname, 'dist')
      const indexHtml = readFileSync(resolve(outDir, 'index.html'), 'utf-8')
      writeFileSync(resolve(outDir, '404.html'), indexHtml)
    },
  }
}

export default defineConfig({
  plugins: [react(), spaFallback404()],
  base: '/',
  build: {
    sourcemap: false,
    minify: true,
    target: 'es2022',
    cssCodeSplit: true,
    reportCompressedSize: false,
  },
})
