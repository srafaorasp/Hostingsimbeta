import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // The CSS configuration has been removed from this file.
  // It will now be handled by postcss.config.js
})
