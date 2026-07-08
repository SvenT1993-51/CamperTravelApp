import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Camp Explorer',
        short_name: 'Camp Explorer',
        description: 'Onze zomerreis door Europa!',
        lang: 'nl',
        theme_color: '#f97316',
        background_color: '#fef3c7',
        display: 'fullscreen',
        orientation: 'landscape',
        start_url: '/',
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png',     purpose: 'any maskable' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png',     purpose: 'any maskable' },
          { src: 'icons/icon.svg',    sizes: 'any',     type: 'image/svg+xml', purpose: 'any' }
        ]
      },
      workbox: {
        // Photo formats (jpg/jpeg/webp/avif) MUST be here or bundled quiz
        // images won't be precached → blank quizzes when offline.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2,jpg,jpeg,webp,avif}'],
        // Workbox silently skips files above this; photos can exceed the 2 MiB default.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: []
      }
    })
  ]
})
