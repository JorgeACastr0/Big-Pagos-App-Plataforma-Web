/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bigpagos': {
          gray: '#556fa3',
          blue: '#1f279c',
          green: '#178a25',
        }
      }
    },
  },
  plugins: [],
}