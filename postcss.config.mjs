/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Use the standard Tailwind v3 PostCSS plugin so all utility classes
    // (including shadcn/ui styles) are actually generated.
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;