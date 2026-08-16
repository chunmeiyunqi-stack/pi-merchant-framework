import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pi: {
          bg: '#07030E',
          surface: '#12081C',
          surface2: '#1A0F2A',
          elevated: '#22143A',
          gold: '#F3C136',
          'gold-strong': '#EEA834',
          'gold-soft': '#F6D878',
          violet: '#8B5CF6',
          'violet-deep': '#7C3AED',
          indigo: '#6366F1',
          line: 'rgba(255,255,255,0.08)',
          muted: '#9AA0B4',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'PingFang SC',
          'Microsoft YaHei',
          'sans-serif',
        ],
      },
      boxShadow: {
        'pi-glow': '0 0 40px -8px rgba(243,193,54,0.35)',
        'pi-card': '0 8px 40px -12px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'pi-brand': 'linear-gradient(135deg, #F3C136 0%, #EEA834 50%, #D18E15 100%)',
        'pi-violet': 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6366F1 100%)',
        'pi-surface':
          'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 100%)',
      },
      animation: {
        'pi-pulse': 'piPulse 2.2s ease-in-out infinite',
        'fade-up': 'fadeUp 0.5s ease-out both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
      keyframes: {
        piPulse: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(243,193,54,0.45)' },
          '50%': { opacity: '0.6', boxShadow: '0 0 0 6px rgba(243,193,54,0)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
