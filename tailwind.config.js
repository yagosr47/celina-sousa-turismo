/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefcfd',
          100: '#d4f7f9',
          200: '#aeeef3',
          300: '#76e0ea',
          400: '#37c9d9',
          500: '#16b3c4',
          600: '#128fa0',
          700: '#147282',
          800: '#185d6b',
          900: '#184e5b',
          950: '#0b333d',
        },
        sand: {
          50: '#fdfbf7',
          100: '#f8f3e8',
          200: '#efe4cd',
          300: '#e4cfa8',
          400: '#d5b27a',
          500: '#c89855',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
