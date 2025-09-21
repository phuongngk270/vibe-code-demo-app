const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        frame: '#F7F9FC',
        primary: '#2C3E94',
        text: '#1A1A1A',
        subtle: '#F5F5F5',
      },
      boxShadow: {
        'elev-2': '0 6px 18px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        acl: '12px',
      },
      fontFamily: {
        sans: ['var(--font-inter)', ...fontFamily.sans],
      },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')],
};


