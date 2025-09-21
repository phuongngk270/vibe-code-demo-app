import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./pages/**/*.{ts,tsx}','./components/**/*.{ts,tsx}','./lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F5F7FB',
        surface: '#FFFFFF',
        text: '#101828',
        muted: '#667085',
        border: '#E5E7EB',
        primary: '#2A7DE1',
        primaryDark: '#1F5FB3',
        primarySoft: '#EAF2FF',
      },
      borderRadius: { lgx: '14px', pill: '9999px' },
      boxShadow: {
        soft: '0 8px 24px rgba(16,24,40,.08)',
        nav: '0 4px 12px rgba(16,24,40,.06)',
      },
      fontFamily: { sans: ['var(--font-inter)','Inter','ui-sans-serif','system-ui'] },
      maxWidth: { '6xl': '72rem' }
    }
  },
  plugins: [
};
export default config;

