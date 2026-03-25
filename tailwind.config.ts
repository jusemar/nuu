import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      // Cores globais do projeto (mantidas)
      colors: {
        green: {
          500: '#10b981',
          600: '#059669',
        },
        red: {
          500: '#ef4444',
          600: '#dc2626',
        },
        // 🆕 Cores específicas da loja (produtos)
        primary: {
          DEFAULT: '#0C447C',
          mid: '#1E3A8A',
          light: '#EFF6FF',
          dark: '#0A365C',
        },
        accent: {
          DEFAULT: '#EF9F27',
          dark: '#B45309',
          light: '#FFFBEB',
        },
        success: {
          DEFAULT: '#14B8A6',
          light: '#F0FDFA',
          dark: '#0F766E',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
        },
        // Textos
        text: {
          primary: '#1F2937',
          muted: '#6B7280',
          hint: '#9CA3AF',
        },
        // Superfícies
        surface: {
          bg: '#F8F8F6',
          card: '#FFFFFF',
          border: '#E5E7EB',
          'border-mid': '#D1D5DB',
        },
        // PIX
        pix: {
          bg: '#F0FDFA',
          border: '#99F6E4',
          text: '#0F766E',
        },
      },
      // 🆕 Fonte personalizada
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      // Breakpoints (mantidos)
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
} satisfies Config