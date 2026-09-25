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

// VITE_API_URL di-embed saat build. Default '/' (same-origin) agar prod tidak
// ke-build dengan fallback localhost di src/lib/api.ts.
const buildEnv = { ...process.env, VITE_API_URL: process.env.VITE_API_URL ?? '/' }
console.log(`[build:prod] VITE_API_URL=${buildEnv.VITE_API_URL}`)

function run(command) {
  // Windows: npx = npx.cmd, harus lewat shell. Tanpa shell:true -> ENOENT
  // dengan status null, script exit(1) diam-diam persis seperti laporan.
  const result = spawnSync(command, { stdio: 'inherit', cwd: root, shell: true, env: buildEnv })
  if (result.error) {
    console.error(`[build:prod] Gagal menjalankan "${command}": ${result.error.message}`)
    process.exit(1)
  }
  if (result.status !== 0) process.exit(result.status ?? 1)
  return result
}

run('npx tsc -b')
run('npx vite build --mode production')

console.log('\n[build:prod] Selesai.')
console.log(`  Frontend -> ${path.relative(root, publicDir)}/`)
console.log('  Pastikan backend/public/.htaccess memiliki DirectoryIndex index.php index.html')
console.log('  dan backend/routes/web.php fallback melayani index.html untuk SPA routes.')
