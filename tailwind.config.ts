import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mustard: '#FFC233',
        terracotta: '#C65D3B',
        'warm-gray': '#D1D1C9',
        ink: '#1F1F1F',
        paper: '#F4F1EA',
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Cormorant Garamond', 'Georgia', 'serif'],
        mono: ['var(--font-courier)', 'Courier Prime', 'Courier New', 'monospace'],
        sans: ['var(--font-dm-sans)', 'DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        editorial: ['var(--font-cormorant)', 'Cormorant Garamond', 'Georgia', 'serif'],
        typewriter: ['var(--font-courier)', 'Courier Prime', 'Courier New', 'monospace'],
        modern: ['var(--font-dm-sans)', 'DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
