import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // O Vite 7 usa 'baseline-widely-available' por padrão, que corta em
    // Safari 16 — iPhones em iOS 14/15 recebem tela branca porque o bundle
    // nem chega a ser parseado. Alvo explícito para cobri-los.
    target: ['es2020', 'safari14', 'chrome87', 'firefox78', 'edge88'],
  },
})
