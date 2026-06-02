/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-container': 'var(--color-primary-container)',
        surface: 'var(--color-surface)',
        'surface-container': 'var(--surface-container)',
        'surface-container-lowest': 'var(--surface-container-lowest)',
        'inverse-surface': 'var(--inverse-surface)',
        'on-surface': 'var(--color-on-surface)',
        outline: 'var(--color-outline)',
        error: 'var(--color-error)',
        'emerald-500': 'var(--color-emerald-500)'
      },
      borderRadius: {
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)'
      }
    }
  },
  plugins: []
};
