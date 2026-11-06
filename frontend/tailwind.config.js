/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ctf: {
          dark: '#080D18',
          card: '#111827',
          cardHover: '#1F2937',
          cyan: '#00D4FF',
          blue: '#2563EB',
          red: '#EF4444',
          orange: '#F59E0B',
          green: '#22C55E',
          text: '#F8FAFC',
          muted: '#94A3B8',
          border: '#1E293B',
        }
      },
      fontFamily: {
        mono: ['Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

