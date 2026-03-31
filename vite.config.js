import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/vidzee-core': {
        target: 'https://core.vidzee.wtf',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/vidzee-core/, '')
      },
      '/vidzee-api': {
        target: 'https://player.vidzee.wtf',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/vidzee-api/, '')
      }
    }
  }
})
