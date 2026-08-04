import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// TELVO web client - Vite + React + TypeScript
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'TELVO - Trusted workers. Real solutions.',
        short_name: 'TELVO',
        description: 'Find trusted professionals and businesses near you for the services you need.',
        theme_color: '#00C853',
        background_color: '#FFFFFF',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: '/offline.html',
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      }
    })
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: { port: 5173 }
})
