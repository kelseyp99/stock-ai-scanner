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
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
      },
      '/scan': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
      },
    },
  },
})
