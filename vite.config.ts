import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Base "/" agar build prod bisa dilayani dari backend/public langsung
  base: '/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/storage': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Prod: hasil build langsung ke backend/public (aaPanel document root)
    // Dev/standalone: ke dist/ seperti biasa
    outDir: mode === 'production'
      ? path.resolve(__dirname, 'backend/public')
      : 'dist',
    // Jangan kosongkan backend/public (isi Laravel: index.php, .htaccess, storage link)
    emptyOutDir: mode !== 'production',
    assetsDir: 'assets',
    // Manifest tidak diperlukan untuk Laravel fallback plain file serving
  },
}))
