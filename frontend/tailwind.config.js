/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // League of Legends dark fantasy palette
        gold: {
          50:  '#fdf8e8',
          100: '#faefc4',
          200: '#f5dd89',
          300: '#f0c84d',
          400: '#e8b319',
          500: '#c89b3c', // primary gold
          600: '#a07830',
          700: '#7d5c20',
          800: '#5c4118',
          900: '#3d2b0f',
        },
        navy: {
          50:  '#e8edf5',
          100: '#c5d0e6',
          200: '#8fa4cc',
          300: '#5a78b2',
          400: '#2a4f9b',
          500: '#1a3a7a',
          600: '#132d63',
          700: '#0d1f47',
          800: '#091430',
          900: '#060c1e', // darkest bg
          950: '#030810',
        },
        rift: {
          dark:   '#010a13', // almost black
          panel:  '#0a1428', // panel bg
          border: '#1e2d3d', // subtle border
          accent: '#0bc4e3', // teal accent
          purple: '#7b2be2', // magic purple
          red:    '#c8281e', // danger red
        },
      },
      fontFamily: {
        display: ['"Cinzel"', 'serif'],
        body:    ['"Inter"', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial':    'radial-gradient(var(--tw-gradient-stops))',
        'gold-shimmer':       'linear-gradient(135deg, #c89b3c 0%, #f0c84d 50%, #c89b3c 100%)',
        'dark-vignette':      'radial-gradient(ellipse at center, transparent 40%, rgba(1,10,19,0.8) 100%)',
      },
      boxShadow: {
        'gold':   '0 0 20px rgba(200, 155, 60, 0.3)',
        'glow':   '0 0 30px rgba(11, 196, 227, 0.2)',
        'panel':  '0 4px 24px rgba(0, 0, 0, 0.6)',
      },
      animation: {
        'shimmer':     'shimmer 2s linear infinite',
        'fade-in':     'fadeIn 0.3s ease-in-out',
        'slide-up':    'slideUp 0.3s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
