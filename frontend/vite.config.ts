import { defineConfig } from 'vite'

export default defineConfig({
  // Avoid automatic React injection; source files already import React.
  server: {
    port: 5178,
    host: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5178,
    },
    proxy: {
      // Forward all /options/* and /scan* API calls to the FastAPI backend
      '/options': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/scan': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
