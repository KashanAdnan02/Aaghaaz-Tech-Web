/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyan-custom': '#00CCCC',
        'yellow-custom': '#FCD700',
      },
    },
  },
  plugins: [],
}