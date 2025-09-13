﻿export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { 
          50: '#eef2ff', 
          100: '#e0e7ff',
          400: '#818cf8', 
          500: '#6366f1', 
          600: '#4f46e5', 
          700: '#4338ca',
          900: '#312e81'
        },
        success: { 400: '#34d399', 600: '#059669' },
        danger: { 400: '#f87171', 600: '#dc2626' },
        surface: { 
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
          // AMOLED Dark Mode Colors
          950: '#000000', // Pure black
          975: '#0f0f0f', // Almost black
        }
      }
    }
  },
  plugins: []
}
