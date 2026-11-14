import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// El backend no configura CORS, por eso en desarrollo se proxya al backend.
// Los logins viven en la raíz (/student/auth, /instructor/auth, /administrator/auth):
// se configuran por ruta exacta para no interceptar las rutas de React
// (/student/catalog, /instructor/courses, etc.).
const backend = 'http://localhost:8080'

const proxy = {
  '/api': {
    target: backend,
    changeOrigin: true,
  },
  '/student/auth': {
    target: backend,
    changeOrigin: true,
  },
  '/instructor/auth': {
    target: backend,
    changeOrigin: true,
  },
  '/administrator/auth': {
    target: backend,
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
})
