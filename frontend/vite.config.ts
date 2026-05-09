import { defineConfig } from 'vite'

export default defineConfig({
  // Avoid automatic React injection; source files already import React.
  server: {
    port: 5176,
    host: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5176,
    },
  },
})
