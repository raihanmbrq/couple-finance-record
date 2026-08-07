/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary': 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-hover': 'rgb(var(--color-primary-hover) / <alpha-value>)',
        'secondary': 'rgb(var(--color-secondary) / <alpha-value>)',
        'background': 'rgb(var(--color-background) / <alpha-value>)',
        'surface': 'rgb(var(--color-surface) / <alpha-value>)',
        'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'stone': {
          50: 'rgb(var(--color-stone-50) / <alpha-value>)',
          100: 'rgb(var(--color-stone-100) / <alpha-value>)',
          200: 'rgb(var(--color-stone-200) / <alpha-value>)',
          300: 'rgb(var(--color-stone-300) / <alpha-value>)',
          400: 'rgb(var(--color-stone-400) / <alpha-value>)',
          500: 'rgb(var(--color-stone-500) / <alpha-value>)',
          600: 'rgb(var(--color-stone-600) / <alpha-value>)',
          700: 'rgb(var(--color-stone-700) / <alpha-value>)',
          800: 'rgb(var(--color-stone-800) / <alpha-value>)',
          900: 'rgb(var(--color-stone-900) / <alpha-value>)',
        },
        'teal': {
          50: 'rgb(var(--color-teal-50) / <alpha-value>)',
          100: 'rgb(var(--color-teal-100) / <alpha-value>)',
          600: 'rgb(var(--color-teal-600) / <alpha-value>)',
          700: 'rgb(var(--color-teal-700) / <alpha-value>)',
        },
        'amber': {
          50: 'rgb(var(--color-amber-50) / <alpha-value>)',
          100: 'rgb(var(--color-amber-100) / <alpha-value>)',
          200: 'rgb(var(--color-amber-200) / <alpha-value>)',
          600: 'rgb(var(--color-amber-600) / <alpha-value>)',
          700: 'rgb(var(--color-amber-700) / <alpha-value>)',
        },
        'cream': {
          100: 'rgb(var(--color-cream-100) / <alpha-value>)',
        },
        'income': '#86EFAC',
        'expense': '#FCA5A5',
        'warning': '#FDE68A',
        'total-balance': 'rgb(var(--color-total-balance) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
        card: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        float: '0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)',
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.25s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        pulse: {
          '0%, 100%': {
            transform: 'scale(0.8)',
            opacity: '0.5',
          },
          '50%': {
            transform: 'scale(1.2)',
            opacity: '1',
          },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};