import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// El backend no configura CORS, por eso en desarrollo se proxya /api hacia Spring.
const proxy = {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
})
