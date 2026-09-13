/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        studio: {
          950: '#090a0f',
          900: '#0f1118',
          850: '#151822',
          800: '#1b202e',
          750: '#23293b',
          700: '#2b3349',
          600: '#3e4866',
          500: '#5a668c',
          400: '#8b96b5',
          300: '#b8c0d6',
          200: '#e1e5f2',
          100: '#f1f3f9',
          50: '#fafbfe',
        },
        accent: {
          primary: '#6366f1', // Indigo
          hover: '#4f46e5',
          secondary: '#ec4899', // Pink
          emerald: '#10b981', // Emerald
          amber: '#f59e0b', // Warm amber
          cyan: '#06b6d4', // Cyan
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'piano-white': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3), inset 0 -4px 0 0 rgba(0, 0, 0, 0.15)',
        'piano-white-active': '0 1px 2px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(0, 0, 0, 0.2)',
        'piano-black': '0 6px 10px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
        'piano-black-active': '0 2px 4px rgba(0, 0, 0, 0.8), inset 0 1px 2px rgba(0, 0, 0, 0.6)',
        'glow-primary': '0 0 15px rgba(99, 102, 241, 0.35)',
        'glow-emerald': '0 0 15px rgba(16, 185, 129, 0.35)',
        'glow-amber': '0 0 15px rgba(245, 158, 11, 0.35)',
      },
      gridTemplateColumns: {
        '16': 'repeat(16, minmax(0, 1fr))',
      }
    },
  },
  plugins: [],
}
