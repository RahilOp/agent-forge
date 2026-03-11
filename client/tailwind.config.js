/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: '#1e1e2e',
          hover: '#2a2a3c',
          active: '#353548',
          text: '#cdd6f4',
          muted: '#6c7086',
        },
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        agentforge: {
          "primary": "#7c3aed",
          "primary-content": "#ffffff",
          "secondary": "#6366f1",
          "secondary-content": "#ffffff",
          "accent": "#06b6d4",
          "accent-content": "#ffffff",
          "neutral": "#1e1e2e",
          "neutral-content": "#cdd6f4",
          "base-100": "#ffffff",
          "base-200": "#f8f9fc",
          "base-300": "#eef0f5",
          "base-content": "#1e1e2e",
          "info": "#38bdf8",
          "success": "#22c55e",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
    ],
  },
}
