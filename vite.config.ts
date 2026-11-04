import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Sticker thumbnails stay separate files instead of being packed into the page's script.
  build: { assetsInlineLimit: 0 },
})
