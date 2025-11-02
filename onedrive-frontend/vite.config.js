import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/a': {
        target: 'https://localhost:8081',
        changeOrigin: true,
        secure: false
      },
      '/auth': {
        target: 'https://localhost:8081',
        changeOrigin: true,
        secure: false
      },
      '/io': {
        target: 'https://localhost:8081',
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: 'https://localhost:8081',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
})
