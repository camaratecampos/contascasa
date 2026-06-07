import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4ff',
          100: '#e0e8ff',
          600: '#1e3a5f',
          700: '#162d4a',
          800: '#0f2035',
          900: '#0a1628',
        },
      },
    },
  },
  plugins: [],
};

export default config;
