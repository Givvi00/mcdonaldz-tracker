import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'

const pkg = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, 'package.json'), 'utf-8'))

// Identifies this build: the git commit, or BUILD_ID when set (used to test updates locally)
function readBuildId(): string {
  if (process.env.BUILD_ID) return process.env.BUILD_ID
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'dev'
  }
}

const buildId = readBuildId()
const builtAt = new Date().toISOString()

// The restaurant list is bundled into the app (offline fallback) AND published as data/mcdonalds.json, so installed
// copies can pick up a newer list on their own. The version is a hash of the content: it only changes when the data does.
const catalogList = JSON.parse(
  fs.readFileSync(path.resolve(import.meta.dirname, 'shared/data/mcdonalds.json'), 'utf-8').replace(/^﻿/, '')
)
const catalogVersion = createHash('sha1').update(JSON.stringify(catalogList)).digest('hex').slice(0, 12)

// Emits /version.json next to the app so an installed copy can tell that a newer build has been published
const versionFile: Plugin = {
  name: 'version-json',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ buildId, builtAt }) })
  },
}

// Emits /data/mcdonalds.json: the current restaurant list, with a content version and the time it was published
const catalogFile: Plugin = {
  name: 'catalog-json',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'data/mcdonalds.json',
      source: JSON.stringify({ version: catalogVersion, generatedAt: builtAt, restaurants: catalogList }),
    })
  },
}

export default defineConfig({
  // GitHub Pages serves the site from /<repo>/; the Android app and local dev use '/'
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), versionFile, catalogFile],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_ID__: JSON.stringify(buildId),
    __BUILD_DATE__: JSON.stringify(builtAt),
    __CATALOG_VERSION__: JSON.stringify(catalogVersion),
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@shared': path.resolve(import.meta.dirname, './shared'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})
