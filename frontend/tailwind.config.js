/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef0ff",
          100: "#e0e3ff",
          300: "#b3b8fb",
          400: "#8d8ff5",
          500: "#6c63f0",
          600: "#5b4fe8",
          700: "#4a3fd1",
          800: "#3b32a8",
          900: "#292266",
        },
        surface: {
          950: "#0a0c14", // app background
          900: "#12141f", // card background
          800: "#1a1d2b", // raised / hover surface
          700: "#262a3c", // borders
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};
