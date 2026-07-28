import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          gold:    { DEFAULT: '#F3C136', hover: '#EEA834', muted: 'rgba(243,193,54,0.15)' },
          purple:  { DEFAULT: '#7C3AED', hover: '#6D28D9', muted: 'rgba(124,58,237,0.15)' },
          dark:    { DEFAULT: '#0A0510', surface: '#150B20', elevated: '#1A0E2A' },
          border:  'rgba(255,255,255,0.08)',
        },
      },
      borderRadius: {
        card: '1.25rem',
        btn:  '0.75rem',
      },
      boxShadow: {
        'glow-gold':   '0 0 30px rgba(243,193,54,0.15)',
        'glow-purple': '0 0 30px rgba(124,58,237,0.2)',
        'card':        '0 1px 3px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.2)',
      },
      animation: {
        'fade-in':      'fadeIn 0.5s ease-out',
        'slide-up':     'slideUp 0.5s ease-out',
        'pulse-glow':   'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(243,193,54,0.1)' },
          '50%':      { boxShadow: '0 0 40px rgba(243,193,54,0.25)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
