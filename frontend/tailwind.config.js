/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0d0620',
          secondary: '#150a30',
          card: 'rgba(255,255,255,0.05)',
        },
        primary: {
          DEFAULT: '#8E24AA',
          light: '#C84DA1',
          dark: '#4B2E83',
          glow: '#E865B7',
        },
        secondary: {
          DEFAULT: '#C84DA1',
          light: '#E865B7',
        },
        accent: {
          DEFAULT: '#06b6d4',
          light: '#22d3ee',
        },
        danger: {
          DEFAULT: '#f43f5e',
          light: '#fb7185',
        },
        warning: {
          DEFAULT: '#f97316',
          light: '#fb923c',
        },
        success: {
          DEFAULT: '#14b8a6',
          light: '#2dd4bf',
        },
        // Neon Violet dark palette
        nv: {
          900: '#4B2E83',
          700: '#8E24AA',
          500: '#C84DA1',
          300: '#E865B7',
        },
        // Soft Intelligence light palette
        si: {
          950: '#2d1f3d',
          900: '#3d2a52',
          800: '#4e3766',
          700: '#665576',
          600: '#8a7490',
          500: '#A88C8E',
          400: '#C4A9A8',
          300: '#EBCDA5',
          200: '#f5e8d0',
          100: '#faf3e8',
          50: '#fdf9f4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'theme-toggle': 'themeToggle 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: 'var(--shadow-glow-primary)' },
          '50%': { boxShadow: '0 0 40px rgba(200,77,161,0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        themeToggle: {
          '0%': { transform: 'rotate(0deg) scale(0.8)', opacity: '0' },
          '100%': { transform: 'rotate(360deg) scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

