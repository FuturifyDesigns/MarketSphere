import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

function githubPages404() {
  return {
    name: 'github-pages-404',
    closeBundle() {
      const outDir = resolve(__dirname, 'dist')
      const indexHtml = readFileSync(resolve(outDir, 'index.html'), 'utf-8')
      writeFileSync(resolve(outDir, '404.html'), indexHtml)
    },
  }
}

export default defineConfig({
  plugins: [react(), githubPages404()],
  // Custom domain (marketspheregroup.com) serves from site root.
  base: '/',
})
