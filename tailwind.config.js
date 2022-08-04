const designTokens = require("./app/styles/design-tokens.json");

/**
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ["./app/**/*.{ts,tsx,jsx,js}"],
  theme: {
    extend: {
      colors: {
        dark: designTokens.colors.dark,
      },
      fontFamily: {
        avenuex: ["Avenue X", "sans-serif"],
        chillax: ["Chillax-Bold", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
