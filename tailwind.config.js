/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vyugam: {
          50: '#f0f4ff',
          100: '#e0e9fe',
          200: '#c7d6fe',
          300: '#a4bbfd',
          400: '#7a96fc',
          500: '#586ef7',
          600: '#3a4aed',
          700: '#2b36d6',
          800: '#262eb0',
          900: '#1d236b',
          950: '#0f1238',
        }
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-beam': 'scanBeam 2s ease-in-out infinite alternate',
      },
      keyframes: {
        scanBeam: {
          '0%': { transform: 'translateY(0%)', opacity: '0.8' },
          '100%': { transform: 'translateY(100%)', opacity: '0.4' },
        }
      }
    },
  },
  plugins: [],
}
