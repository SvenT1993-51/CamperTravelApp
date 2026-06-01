/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#f97316',
          yellow: '#fbbf24',
          green:  '#22c55e',
          blue:   '#3b82f6',
          cream:  '#fef3c7',
        }
      },
      minHeight: { tap: '64px' },
      minWidth:  { tap: '64px' },
    }
  },
  plugins: []
}
