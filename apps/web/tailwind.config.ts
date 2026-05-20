import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'fajr-dark': {
          'bg-primary': '#0D1421',
          'bg-secondary': '#1A2238',
          'bg-tertiary': '#2D3654',
          'accent-primary': '#D4A574',
          'accent-secondary': '#B8854A',
          'text-primary': '#F4EDE4',
          'text-secondary': 'rgba(244, 237, 228, 0.7)',
          'text-tertiary': 'rgba(244, 237, 228, 0.5)',
        },
        'fajr-light': {
          'bg-primary': '#FDF6EC',
          'bg-secondary': '#F5E7D0',
          'bg-tertiary': '#E8D4B8',
          'accent-primary': '#B8854A',
          'accent-secondary': '#8B4513',
          'text-primary': '#1A2238',
          'text-secondary': 'rgba(26, 34, 56, 0.7)',
          'text-tertiary': 'rgba(26, 34, 56, 0.5)',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        arabic: ['Amiri', 'Traditional Arabic', 'serif'],
        urdu: ['Noto Nastaliq Urdu', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-gentle': 'pulseGentle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        pulseGentle: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
      },
    },
  },
  plugins: [],
};

export default config;
