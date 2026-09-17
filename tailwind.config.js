export default {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mc-red': '#DA291C',
        'mc-yellow': '#FFC72C',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fredoka', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
