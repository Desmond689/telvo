/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E6FBEF',
          100: '#C2F5D9',
          200: '#8FEBB8',
          300: '#5CE096',
          400: '#29D675',
          500: '#00C853', // TELVO primary green
          600: '#00A845',
          700: '#008738',
          800: '#00662A',
          900: '#00451C'
        },
        ink: {
          50: '#F7F8F9',
          100: '#EEF0F2',
          200: '#DDE1E6',
          300: '#B9C0C9',
          400: '#8A94A0',
          500: '#5C6773',
          600: '#3F4750',
          700: '#2A2F36',
          800: '#1B1F24',
          900: '#101317'
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,19,23,0.04), 0 4px 12px rgba(16,19,23,0.06)',
        'card-hover': '0 2px 4px rgba(16,19,23,0.06), 0 8px 24px rgba(16,19,23,0.10)',
        soft: '0 2px 8px rgba(16,19,23,0.04)'
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px'
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(0.97)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } }
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
        shimmer: 'shimmer 1.4s linear infinite'
      }
    }
  },
  plugins: []
}
