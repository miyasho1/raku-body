import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/raku-body/',
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  }
})
