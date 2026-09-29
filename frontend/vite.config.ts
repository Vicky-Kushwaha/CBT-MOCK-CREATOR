import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const target = process.env.VITE_API_PROXY ?? 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // polling makes hot reload reliable for bind mounts on Windows/macOS Docker
    watch: { usePolling: true, interval: 300 },
    proxy: {
      '/api': { target, changeOrigin: true },
      '/media': { target, changeOrigin: true },
    },
  },
})
