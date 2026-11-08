/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        canvas: 'var(--bg-canvas)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          elevated: 'var(--bg-surface-elevated)',
          hover: 'var(--bg-surface-hover)',
        },
        accent: {
          violet: 'var(--accent-violet)',
          cyan: 'var(--accent-cyan)',
        },
        priority: {
          low: 'var(--priority-low)',
          medium: 'var(--priority-medium)',
          high: 'var(--priority-high)',
        },
      },
      borderRadius: {
        card: 'var(--radius-card)',
        panel: 'var(--radius-panel)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        glass: 'var(--shadow-glass)',
        'glow-accent': 'var(--shadow-glow-accent)',
      },
      spacing: {
        sidebar: 'var(--width-sidebar)',
        'sidebar-collapsed': 'var(--width-sidebar-collapsed)',
      },
    },
  },
  plugins: [],
};
