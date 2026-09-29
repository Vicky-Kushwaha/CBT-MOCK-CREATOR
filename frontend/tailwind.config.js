/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'] },
      colors: {
        ink: { DEFAULT: '#12263f', soft: '#3b4d66' },
        paper: '#f5f7fa',
        rail: { DEFAULT: '#1d4f91', dark: '#143a6b' },
      },
    },
  },
  plugins: [],
}
