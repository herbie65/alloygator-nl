/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        bebas: ['"Bebas Neue"', 'sans-serif'],
      },
      // Site-brede groentint aanpassen
      colors: {
        green: {
          400: '#b7e047', // iets lichter
          500: '#a6d62a', // basis lichter
          600: '#92c516', // HOOFDKLEUR
          700: '#7cab13', // iets donkerder voor hover
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#111827',
            a: {
              color: '#16a34a',
              textDecoration: 'none',
              fontWeight: '600',
              '&:hover': { color: '#22c55e', textDecoration: 'underline' }
            },
            h1: {
              fontWeight: '800',
              color: '#111827',
              fontSize: '2.25rem',
              lineHeight: '2.5rem',
              marginTop: '0',
              marginBottom: '1rem'
            },
            h2: { fontWeight: '700', color: '#111827' },
            h3: { fontWeight: '700', color: '#111827' },
            p: { color: '#1f2937' },
            strong: { color: '#111827' },
            ul: { listStyleType: 'disc' },
            ol: { listStyleType: 'decimal' }
          }
        },
        lg: {
          css: {
            h1: { fontSize: '2.5rem', lineHeight: '2.75rem' }
          }
        }
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
} 