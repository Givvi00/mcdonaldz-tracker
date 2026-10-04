export default {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Redesign tokens (DESIGN.md): CSS variables in App.css, one set for dark (the reference) and one for light
        mz: {
          bg: 'rgb(var(--mz-bg) / <alpha-value>)',
          surface: 'rgb(var(--mz-surface) / <alpha-value>)',
          nav: 'rgb(var(--mz-nav) / <alpha-value>)',
          'surface-2': 'rgb(var(--mz-surface-2) / <alpha-value>)',
          active: 'rgb(var(--mz-active) / <alpha-value>)',
          line: 'rgb(var(--mz-line) / <alpha-value>)',
          text: 'rgb(var(--mz-text) / <alpha-value>)',
          muted: 'rgb(var(--mz-muted) / <alpha-value>)',
          red: 'rgb(var(--mz-red) / <alpha-value>)',
          'red-deep': 'rgb(var(--mz-red-deep) / <alpha-value>)',
          'red-light': 'rgb(var(--mz-red-light) / <alpha-value>)',
          yellow: 'rgb(var(--mz-yellow) / <alpha-value>)',
          'on-yellow': 'rgb(var(--mz-on-yellow) / <alpha-value>)',
          green: 'rgb(var(--mz-green) / <alpha-value>)',
          blue: 'rgb(var(--mz-blue) / <alpha-value>)',
          chosen: 'rgb(var(--mz-chosen) / <alpha-value>)',
        },
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
      borderRadius: {
        hero: '26px',
        card: '22px',
        btn: '16px',
      },
      boxShadow: {
        // The yellow button stands on a solid darker edge and sinks into it when pressed
        press: '0 6px 0 #B8860B',
        'press-down': '0 2px 0 #B8860B',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
        display: ['Fredoka', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
