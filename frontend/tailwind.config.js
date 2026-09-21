/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0c10',
          800: '#0f1115',
          700: '#181b22',
          600: '#222733',
        },
        brand: {
          gold: '#f59e0b',
          green: '#10b981',
          red: '#ef4444',
          blue: '#2563eb',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.04), 0 0 1px rgba(0, 0, 0, 0.1)',
        glow: '0 0 20px rgba(255, 255, 255, 0.15)',
      },
    },
  },
  plugins: [],
};
