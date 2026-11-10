/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  /** Endpoint opcional de login si el backend incorpora autenticación real. */
  readonly VITE_AUTH_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
