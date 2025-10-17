/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // This section maps our CSS variables to Tailwind utility classes
      // so we can use classes like "bg-window-bg" in our components.
      colors: {
        'bg-dark': 'var(--color-bg-dark)',
        'bg-light': 'var(--color-bg-light)',
        'window-bg': 'var(--color-window-bg)',
        'header-bg': 'var(--color-header-bg)',
        'header-bg-active': 'var(--color-header-bg-active)',
        'text-color': 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        'border-color': 'var(--color-border)',
        'border-color-light': 'var(--color-border-light)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
