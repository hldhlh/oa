/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.{html,js}",
    "./components/**/*.js",
    "./pages/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        background: 'var(--color-background)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'neumorphism': '10px 10px 20px #d9d9d9, -10px -10px 20px #ffffff',
        'neumorphism-inset': 'inset 5px 5px 10px #d9d9d9, inset -5px -5px 10px #ffffff',
      }
    }
  },
  plugins: [],
} 