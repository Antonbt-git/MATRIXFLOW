/** @type {import('tailwindcss').Config} */
// Identidad visual §8.4: Fondo #F8FAFC, Sidebar #0F172A, Primario #2563EB,
// Acento #06B6D4, Texto #0F172A, Secundario #64748B.
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        app: '#F8FAFC',
        sidebar: '#0F172A',
        primary: '#2563EB',
        accent: '#06B6D4',
        text: '#0F172A',
        muted: '#64748B',
      },
    },
  },
  plugins: [],
};
