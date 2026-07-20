/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#ECE6D8",
        card: "#FFFDF7",
        ink: "#24312B",
        inksoft: "#5B6A61",
        line: "#C9C0A8",
        green: "#146C43",
        greensoft: "#DCEAE1",
        red: "#A63A2E",
        redsoft: "#F1DEDA",
        gold: "#B98900",
        goldsoft: "#F3E7C9",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
