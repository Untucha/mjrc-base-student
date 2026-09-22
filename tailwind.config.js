/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          500: '#10b981',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          400: '#34d399',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'soft-card': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'soft-hover': '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'drift-car': 'driftCar 12s linear infinite',
        'smoke-particle': 'smokeParticle 2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite',
      },
      keyframes: {
        driftCar: {
          '0%': { transform: 'translateX(-120px) scaleX(1)' },
          '48%': { transform: 'translateX(calc(100vw - 40px)) scaleX(1)' },
          '50%': { transform: 'translateX(calc(100vw - 40px)) scaleX(-1)' },
          '98%': { transform: 'translateX(-120px) scaleX(-1)' },
          '100%': { transform: 'translateX(-120px) scaleX(1)' }
        },
        smokeParticle: {
          '0%': { opacity: '0.6', transform: 'translate(0, 0) scale(0.6)' },
          '100%': { opacity: '0', transform: 'translate(-20px, -25px) scale(2.2)' }
        }
      }
    },
  },
  plugins: [],
};
