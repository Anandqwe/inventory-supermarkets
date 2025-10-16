export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { 
          50: '#f3f4ff', 
          100: '#ede9fe',
          400: '#a78bfa', 
          500: '#8b5cf6', 
          600: '#7c3aed', 
          700: '#6d28d9',
          900: '#4c1d95'
        },
        success: { 400: '#34d399', 600: '#059669' },
        danger: { 400: '#f87171', 600: '#dc2626' },
        surface: { 
          // Light mode colors
          50: '#f8fafc', 
          100: '#f1f5f9', 
          200: '#e2e8f0', 
          300: '#cbd5e1', 
          400: '#94a3b8', 
          500: '#64748b', 
          600: '#475569', 
          700: '#334155', 
          800: '#1e293b', 
          900: '#0f172a',
          // Shadcn-inspired Dark Mode Colors (Slate + Indigo blend)
          950: '#030712',    // Pure dark (almost black)
          960: '#0f172a',    // Very dark slate
          970: '#1e293b',    // Dark slate for cards
          980: '#334155',    // Medium dark slate for elevated
          985: '#475569',    // Darker slate for borders
          990: '#64748b',    // Medium slate for stronger borders
        }
      },
      backgroundColor: {
        'amoled-black': '#000000',
        'amoled-dark': '#0a0a0a',
        'amoled-card': '#121212',
        'amoled-elevated': '#1a1a1a',
        'amoled-hover': '#262626',
      },
      borderColor: {
        'amoled-border': '#262626',
        'amoled-border-light': '#404040',
        'amoled-border-strong': '#737373',
      },
      textColor: {
        'amoled-primary': '#ffffff',    // Pure white
        'amoled-secondary': '#d4d4d4',  // Light gray
        'amoled-muted': '#a3a3a3',      // Medium gray
        'amoled-disabled': '#404040',   // Dark gray
      },
      boxShadow: {
        'amoled-sm': '0 1px 2px 0 rgb(0 0 0 / 1)',
        'amoled-md': '0 4px 6px -1px rgb(0 0 0 / 1), 0 2px 4px -2px rgb(0 0 0 / 1)',
        'amoled-lg': '0 10px 15px -3px rgb(0 0 0 / 1), 0 4px 6px -4px rgb(0 0 0 / 1)',
        'amoled-xl': '0 20px 25px -5px rgb(0 0 0 / 1), 0 8px 10px -6px rgb(0 0 0 / 1)',
      }
    }
  },
  plugins: []
}
