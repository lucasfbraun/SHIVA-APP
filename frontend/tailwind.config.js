/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta SHIVA
        background: {
          primary: '#0D0D0D',
          secondary: '#1C1C1C',
        },
        purple: {
          primary: '#6C2BD9',
          highlight: '#9D4EDD',
          dark: '#4C1D95',
        },
        red: {
          action: '#E10600',
        },
        text: {
          primary: '#F5F5F5',
          secondary: '#B3B3B3',
        }
      },
      boxShadow: {
        'glow-purple': '0 0 15px rgba(157, 78, 221, 0.6)',
        'glow-purple-sm': '0 0 10px rgba(157, 78, 221, 0.4)',
      },
      fontFamily: {
        sans: ['Inter', 'Montserrat', 'sans-serif'],
        title: ['Orbitron', 'Montserrat', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
