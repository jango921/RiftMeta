/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#fdf8e8',
          100: '#faefc4',
          200: '#f5dd89',
          300: '#f0c84d',
          400: '#e8b319',
          500: '#C89B3C',
          600: '#a07830',
          700: '#7d5c20',
          800: '#5c4118',
          900: '#3d2b0f',
        },
        teal: {
          400: '#0AC8B9',
          500: '#09b3a5',
        },
        surface: {
          0:   '#080C14',  // true dark bg
          1:   '#0D1117',  // page bg
          2:   '#111827',  // card bg
          3:   '#1a2233',  // elevated card
          4:   '#1e2d3d',  // border/divider
        },
        accent: {
          gold:   '#C89B3C',
          teal:   '#0AC8B9',
          purple: '#7B2BE2',
          red:    '#E84057',
          blue:   '#1e7bcd',
        },
      },
      fontFamily: {
        display: ['"Cinzel"', 'serif'],
        body:    ['"Plus Jakarta Sans"', '"Inter"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'aurora':         'radial-gradient(ellipse 80% 50% at 20% -10%, rgba(123,43,226,0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 110%, rgba(10,200,185,0.1) 0%, transparent 60%), radial-gradient(ellipse 50% 30% at 50% 50%, rgba(200,155,60,0.04) 0%, transparent 70%)',
        'card-shine':     'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%, rgba(255,255,255,0.01) 100%)',
        'gold-shimmer':   'linear-gradient(90deg, transparent, rgba(200,155,60,0.15), transparent)',
        'glass-border':   'linear-gradient(135deg, rgba(200,155,60,0.3), rgba(10,200,185,0.1), rgba(123,43,226,0.2))',
        'hero-radial':    'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(123,43,226,0.12) 0%, transparent 70%)',
        'splash-overlay': 'linear-gradient(to top, #080C14 0%, #080C14 10%, rgba(8,12,20,0.7) 50%, rgba(8,12,20,0.2) 100%)',
      },
      boxShadow: {
        'gold':     '0 0 24px rgba(200,155,60,0.25), 0 0 48px rgba(200,155,60,0.1)',
        'gold-sm':  '0 0 12px rgba(200,155,60,0.2)',
        'teal':     '0 0 24px rgba(10,200,185,0.2)',
        'purple':   '0 0 24px rgba(123,43,226,0.25)',
        'card':     '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.4)',
        'card-hover':'0 1px 0 rgba(255,255,255,0.06) inset, 0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(200,155,60,0.15)',
        'panel':    '0 2px 0 rgba(255,255,255,0.03) inset, 0 4px 24px rgba(0,0,0,0.5)',
      },
      animation: {
        'shimmer':      'shimmer 2.5s linear infinite',
        'fade-in':      'fadeIn 0.4s ease-out',
        'slide-up':     'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'slide-down':   'slideDown 0.35s cubic-bezier(0.16,1,0.3,1)',
        'glow-pulse':   'glowPulse 3s ease-in-out infinite',
        'float':        'float 6s ease-in-out infinite',
        'aurora-shift': 'auroraShift 8s ease-in-out infinite alternate',
      },
      keyframes: {
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        slideDown: {
          '0%':   { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%':      { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        auroraShift: {
          '0%':   { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
