import { defineConfig } from 'vite'
// @ts-ignore
import path from "path"
// @ts-ignore
import { fileURLToPath } from "url"
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // @ts-ignore
      "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./src"),
    },
  },
})
