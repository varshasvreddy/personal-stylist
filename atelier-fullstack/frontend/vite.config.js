import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API = process.env.VITE_API_TARGET || 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The browser talks to one origin; Vite forwards API calls and uploaded photos to Django.
    proxy: { '/api': API, '/media': API },
  },
})
