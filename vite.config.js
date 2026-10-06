import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

/**
 * Vite configuration.
 *
 * Notes
 * - `allowedHosts: true` + `host: true` keep the sandboxed live-preview proxy working
 *   (the preview is served from a proxied host, not localhost).
 * - Manual chunks split the heavy 3D stack from the app shell so the first paint is fast
 *   and long-term caching is effective.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./public', import.meta.url)),
    },
  },

  server: {
    host: true,
    port: 5173,
    strictPort: false,
    allowedHosts: true,
  },

  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
  },

  build: {
    target: 'es2022',
    sourcemap: false,
    /* three.js is one unavoidable 1.1 MB chunk; it is already split away from the
       app and the framework, so the 900 kB default warning is just noise. */
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('three') || id.includes('@react-three') || id.includes('postprocessing')) {
            return 'three'
          }
          if (id.includes('gsap')) return 'gsap'
          if (id.includes('lenis')) return 'lenis'
          if (id.includes('react')) return 'react'
          return 'vendor'
        },
      },
    },
  },

  // GLB/PDF are served from /public as-is; no asset inlining so the model streams separately.
  assetsInclude: ['**/*.glb'],
})
