/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gravity-dark': '#101820',
        'gravity-surface': '#172532',
        'gravity-blue': '#38BDF8',
        'gravity-orange': '#F59E0B',
        'gravity-red': '#EF4444',
        'gravity-silver': '#E5E7EB',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
