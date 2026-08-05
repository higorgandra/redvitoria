/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // Header.jsx fica na raiz do projeto (fora de src/), por isso precisa
    // deste glob — sem ele o Tailwind não gera as classes usadas só nele.
    "./*.{js,jsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        slide: {
          // Desloca exatamente a largura de um conjunto de logos (a trilha tem
          // dois conjuntos e w-max), fazendo o reinício coincidir com o início.
          'from': { transform: 'translateX(0)' },
          'to': { transform: 'translateX(-50%)' },
        }
      },
      animation: {
        'slide': 'slide 40s linear infinite',
      }
    },
  },
  plugins: [],
}
