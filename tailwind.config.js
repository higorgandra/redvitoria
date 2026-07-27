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
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      keyframes: {
        slide: {
          'from': { transform: 'translateX(0)' },
          'to': { transform: 'translateX(-100%)' },
        }
      },
      animation: {
        'slide': 'slide 40s linear infinite',
      }
    },
  },
  plugins: [],
}
