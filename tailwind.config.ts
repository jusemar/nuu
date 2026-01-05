import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        green: {
          500: '#10b981',
          600: '#059669',
        },
        red: {
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      // 🔥 ADICIONE ESTA SEÇÃO:
      screens: {
        'sm': '640px',   // Mobile landscape
        'md': '768px',   // Tablet portrait  
        'lg': '1024px',  // Laptop pequeno / Tablet landscape
        'xl': '1280px',  // Desktop médio
        '2xl': '1536px', // Desktop grande (opcional)
      },
    }
  },
  plugins: [],
} satisfies Config