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
    rollupOptions: {
      output: {
        // Os assets são servidos com cache imutável (public/_headers). Num
        // chunk único, qualquer deploy invalida os ~580 KB inteiros; com os
        // vendors separados, mudar código do app só invalida o chunk do app —
        // react e firestore continuam no cache do visitante entre deploys.
        manualChunks(id) {
          const nid = id.split('\\').join('/');
          if (!nid.includes('node_modules')) return;
          // O firebase/auth (wrapper e pacote @firebase/auth) fica de fora de
          // propósito: só os chunks preguiçosos do painel o importam, e
          // colocá-lo num vendor eager o traria para o carregamento da loja.
          if (nid.includes('firebase/auth')) return;
          if (nid.includes('firebase')) return 'vendor-firestore';
          // Ícones do lucide são tree-shaken por uso; deixá-los fora evita
          // carregar na loja os ícones que só o painel usa.
          if (nid.includes('lucide')) return;
          if (nid.includes('react') || nid.includes('scheduler')) return 'vendor-react';
        },
      },
    },
  },
})
