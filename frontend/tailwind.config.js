/** @type {import('tailwindcss').Config} */
// Identidad visual §8.4: Fondo #F8FAFC, Sidebar #0F172A, Primario #2563EB,
// Acento #06B6D4, Texto #0F172A, Secundario #64748B.
// Ampliado con semánticos (success/warning/danger), sombras de tarjeta y
// animaciones para una interfaz más profesional y consistente.
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
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        'card-hover': '0 8px 24px -8px rgb(15 23 42 / 0.16), 0 4px 8px -6px rgb(15 23 42 / 0.08)',
        panel: '0 24px 60px -24px rgb(15 23 42 / 0.35)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'none' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(.97)' }, '100%': { opacity: '1', transform: 'none' } },
      },
      animation: {
        'fade-up': 'fade-up .38s cubic-bezier(.16,1,.3,1) both',
        'fade-in': 'fade-in .3s ease-out both',
        'scale-in': 'scale-in .25s cubic-bezier(.16,1,.3,1) both',
      },
    },
  },
  // Las variantes dinámicas (btn-${variant}, badge-${tone}, msg-${type}) solo se
  // generan en tiempo de ejecución: se protegen para que Tailwind no las elimine.
  safelist: [
    'btn', 'btn-primary', 'btn-secondary', 'btn-ghost', 'btn-success', 'btn-danger', 'btn-dark',
    'msg', 'msg-ok', 'msg-err', 'msg-info',
    'badge', 'badge-ok', 'badge-info', 'badge-warn', 'badge-danger', 'badge-neutral', 'badge-accent',
    'tab', 'tab-active',
    'card', 'card-pad', 'card-interactive', 'card-title', 'card-sub',
    'input', 'field', 'field-label', 'table', 'empty', 'console',
    'page-title', 'page-desc', 'eyebrow',
  ],
  plugins: [],
};
