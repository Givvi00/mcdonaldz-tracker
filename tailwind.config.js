export default {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mc-red': '#DA291C',
        'mc-red-dark': '#A8180D',
        'mc-yellow': '#FFC72C',
        // Warm greys (cream in light mode, brown-black in dark mode) replace Tailwind's cold blue-greys
        gray: {
          50: '#FFF9F0',
          100: '#F8EFE3',
          200: '#EBDFD0',
          300: '#D8C9B7',
          400: '#A99C8E',
          500: '#7B6E62',
          600: '#5D5148',
          700: '#463B35',
          800: '#2F2522',
          900: '#231A18',
          950: '#170F0D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fredoka', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
