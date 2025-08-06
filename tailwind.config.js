/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ag-lime': '#92c516',
        'ag-grey': '#5d666b',
        'ag-lime-80': '#a9d44a',
        'ag-lime-60': '#bfe178',
        'ag-lime-40': '#d5eea5',
        'ag-lime-20': '#eafad2',
        'ag-grey-80': '#7a8287',
        'ag-grey-60': '#a0a5a8',
        'ag-grey-40': '#c5c8ca',
        'ag-grey-20': '#e2e3e4',
      },
      fontFamily: {
        'akzidenz': ["'Akzidenz-Grotesk BQ'", 'Arial', 'Calibri', 'sans-serif'],
        'bebas': ["'Bebas Neue'", 'Arial Black', 'Impact', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 