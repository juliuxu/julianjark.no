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

        // Dranks site
        "leaf-green": "#4F6C45",
        orange: "#F9A613",
        "light-orange": "#FFF7EA",
        "white-pink": "#FCF6F5",
      },
      fontFamily: {
        avenuex: ["Avenue X", "sans-serif"],
        chillax: ["Chillax-Bold", "sans-serif"],

        // Dranks
        comico: ["Comico-Regular", "fantasy"],
        satoshi: ["Satoshi-Variable", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
