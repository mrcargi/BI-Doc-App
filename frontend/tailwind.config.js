/** @type {import('tailwindcss').Config} */

function cv(name) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${name}) / ${opacityValue})`
    }
    return `rgb(var(${name}))`
  }
}

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  cv('--color-brand-50'),
          100: cv('--color-brand-100'),
          200: cv('--color-brand-200'),
          300: cv('--color-brand-300'),
          400: cv('--color-brand-400'),
          500: cv('--color-brand-500'),
          600: cv('--color-brand-600'),
          700: cv('--color-brand-700'),
          800: cv('--color-brand-800'),
          900: cv('--color-brand-900'),
          950: cv('--color-brand-950'),
        },
        surface: {
          0:   cv('--color-surface-0'),
          50:  cv('--color-surface-50'),
          100: cv('--color-surface-100'),
          200: cv('--color-surface-200'),
          300: cv('--color-surface-300'),
        },
        ink: {
          900: cv('--color-ink-900'),
          700: cv('--color-ink-700'),
          500: cv('--color-ink-500'),
          400: cv('--color-ink-400'),
          300: cv('--color-ink-300'),
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Geist Mono', 'monospace'],
      },
      boxShadow: {
        soft:   'var(--shadow-soft)',
        card:   'var(--shadow-card)',
        float:  'var(--shadow-float)',
        glow:   'var(--shadow-glow)',
      },
      borderRadius: {
        xl:  '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      fontSize: {
        '2xs': ['10px', '14px'],
      },
    },
  },
  plugins: [],
}