/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        studio: '#05060a',
        surface: '#0c0e15',
        accent: '#94a4ff',
        ink: '#f2f3f7',
        muted: '#969cac',
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
