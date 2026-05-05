/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'Tajawal', 'sans-serif'],
      },
      colors: {
        gold: {
          50: '#fdf8ed',
          100: '#faedc8',
          200: '#f5d98c',
          300: '#efbf4f',
          400: '#e9a826',
          500: '#d18a14',
          600: '#b46810',
          700: '#8f4d11',
          800: '#763e15',
          900: '#653415',
        },
        rose: {
          50: '#fff1f5',
          100: '#ffe4ec',
          200: '#fecdd9',
          300: '#fda4bb',
          400: '#fb7099',
          500: '#f43f78',
        },
        violet: {
          50: '#f6f3ff',
          100: '#ede8ff',
          200: '#dbd3ff',
          300: '#c0b0ff',
          400: '#a283ff',
          500: '#8557fa',
        },
      },
      boxShadow: {
        soft: '0 8px 30px rgba(0,0,0,0.06)',
      }
    },
  },
  plugins: [],
};
