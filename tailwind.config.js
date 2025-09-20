const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-family-primary)', ...fontFamily.sans],
      },
      fontSize: {
        base: ['var(--font-size-base)', { lineHeight: 'var(--line-height-base)' }],
      },
      spacing: {
        1: 'var(--spacing-1)',
        2: 'var(--spacing-2)',
        3: 'var(--spacing-3)',
        4: 'var(--spacing-4)',
        5: 'var(--spacing-5)',
        6: 'var(--spacing-6)',
        'lg-3': 'var(--spacing-lg-3)',
        'lg-4': 'var(--spacing-lg-4)',
        'lg-5': 'var(--spacing-lg-5)',
        'lg-6': 'var(--spacing-lg-6)',
      },
      borderRadius: {
        acl: 'var(--radius-acl)',
        'acl-lg': 'var(--radius-acl-lg)',
      },
      boxShadow: {
        'elev-1': 'var(--shadow-elev-1)',
        'elev-2': 'var(--shadow-elev-2)',
        'elev-3': 'var(--shadow-elev-3)',
        'elev-4': 'var(--shadow-elev-4)',
      },
      colors: {
        frame: {
          bg: 'var(--color-frame-bg)',
          'bg-alt': 'var(--color-frame-bg-alt)',
          border: 'var(--color-frame-border)',
        },
        ink: {
          primary: 'var(--color-ink-primary)',
          secondary: 'var(--color-ink-secondary)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
      },
    },
  },
  plugins: [],
};

