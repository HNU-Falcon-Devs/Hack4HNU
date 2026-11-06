/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hnu: {
          dark: '#121722',         // Deep slate-navy canvas from reference UI
          card: '#1a2234',         // Elevated matte dark card
          cardHover: '#232d42',    // Hover elevated state
          cardActive: '#202b40',   // Active category state
          border: '#26334a',       // Soft card borders
          borderLight: '#334463',  // Highlighted borders
          green: '#059669',        // HNU Official Emerald
          forest: '#008751',       // HNU Seal Dark Green
          emerald: '#10B981',      // Vibrant highlight green
          mint: '#34D399',         // Light green accent
          gold: '#F59E0B',         // HNU Seal Golden Ribbon
          yellow: '#EAB308',       // Active tab highlight
          text: '#F1F5F9',         // Crisp clean text
          muted: '#8A99B5',        // Low-contrast subtext
        },
        ctf: {
          dark: '#121722',
          card: '#1a2234',
          cardHover: '#232d42',
          cyan: '#10B981',         // Replaced AI cyan with HNU emerald
          blue: '#2563EB',
          red: '#EF4444',
          orange: '#F59E0B',
          green: '#10B981',
          text: '#F1F5F9',
          muted: '#8A99B5',
          border: '#26334a',
        }
      },
      fontFamily: {
        mono: ['Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'hnu-card': '0 10px 25px -5px rgba(0, 0, 0, 0.45), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
        'hnu-glow': '0 0 20px -3px rgba(16, 185, 129, 0.35)',
        'hnu-gold-glow': '0 0 20px -3px rgba(245, 158, 11, 0.35)',
      }
    },
  },
  plugins: [],
}
