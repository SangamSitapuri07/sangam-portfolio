import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const previewHosts = ['.e2b.app']

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: previewHosts,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts: previewHosts,
  },
  build: {
    target: 'es2022',
    rolldownOptions: {
      output: {
        codeSplitting: {
          includeDependenciesRecursively: false,
          groups: [
            { name: 'three-core', test: /node_modules\/three\/build\/three\.core\.js/ },
            { name: 'three-webgl', test: /node_modules\/three\/build\/three\.module\.js/ },
          ],
        },
      },
    },
  },
})
