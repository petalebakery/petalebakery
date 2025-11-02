/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        softpink: "#FDECEC",
        rose: "#EFB7B7",
        cream: "#faf5ef",   // main background color
        taupe: "#c8b6a6",   // navbar color
        blush: "#F8D7DA",
        brown: "#a4907c",   // accent or text color
        darkbrown: "#4B3929",  // fixed! rich chocolate tone
        mediumbrown: "#806f60ff",
        cozycabin: "#6f5e53",
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
    },
  },
  plugins: [],
};
