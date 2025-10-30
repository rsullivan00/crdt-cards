import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vite automatically handles SPA routing in dev mode
  // For production, you'll need to configure your hosting provider
  // to redirect all routes to index.html
})
