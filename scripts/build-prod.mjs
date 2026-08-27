#!/usr/bin/env node
// Prod build: React frontend -> backend/public (aaPanel single domain smkn11kabtang.sch.id)
import { rmSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const publicDir = path.join(root, 'backend', 'public')

// Bersihkan artefak build lama di backend/public tanpa menghapus file Laravel
const toClean = [
  path.join(publicDir, 'assets'),
  path.join(publicDir, 'index.html'),
]

console.log('[build:prod] Membersihkan build lama...')
for (const p of toClean) {
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true })
    console.log(`  - hapus ${path.relative(root, p)}`)
  }
}

console.log('[build:prod] Menjalankan tsc + vite build...')
const result = spawnSync('npx', ['tsc', '-b'], { stdio: 'inherit', cwd: root })
if (result.status !== 0) process.exit(result.status ?? 1)

const viteResult = spawnSync('npx', ['vite', 'build'], { stdio: 'inherit', cwd: root })
if (viteResult.status !== 0) process.exit(viteResult.status ?? 1)

console.log('\n[build:prod] Selesai.')
console.log(`  Frontend -> ${path.relative(root, publicDir)}/`)
console.log('  Pastikan backend/public/.htaccess memiliki DirectoryIndex index.php index.html')
console.log('  dan backend/routes/web.php fallback melayani index.html untuk SPA routes.')
