/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/app/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  // tailwind.config.js
  theme: {
    extend: {
      animation: {
        "blob-slow": "blob-slow 20s infinite",
        "blob-medium": "blob-medium 15s infinite",
        "blob-fast": "blob-fast 12s infinite",
      },
      keyframes: {
        "blob-slow": {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(100px, 150px) scale(1.2)" },
          "66%": { transform: "translate(-80px, 50px) scale(0.8)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        "blob-medium": {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(-150px, -100px) scale(1.3)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        "blob-fast": {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(200px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-50px, -200px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
