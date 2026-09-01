import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Satoshi', 'Quicksand', 'var(--font-quicksand)', 'sans-serif'],
        quicksand: ['Quicksand', 'Satoshi', 'sans-serif'],
        display: ['Satoshi', 'Quicksand', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        scan: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(220px)' },
        },
      },
      animation: {
        blob: 'blob 10s infinite',
        scan: 'scan 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
