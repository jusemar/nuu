// ==========================================
// DESIGN TOKENS - Para Tailwind CSS
// ==========================================
// Estes tokens serão injetados no tailwind.config.ts
// Uso no JSX: className="text-primary bg-surface"

export const tokens = {
  colors: {
    // Primárias
    primary: {
      DEFAULT: "#0C447C",
      mid: "#1E3A8A",
      light: "#EFF6FF",
      dark: "#0A365C",
    },
    // Destaque
    accent: {
      DEFAULT: "#EF9F27",
      dark: "#B45309",
      light: "#FFFBEB",
    },
    // Sucesso
    success: {
      DEFAULT: "#14B8A6",
      light: "#F0FDFA",
      dark: "#0F766E",
    },
    // Perigo
    danger: {
      DEFAULT: "#DC2626",
      light: "#FEE2E2",
    },
    // Textos
    text: {
      primary: "#1F2937",
      muted: "#6B7280",
      hint: "#9CA3AF",
    },
    // Superfícies
    surface: {
      bg: "#F8F8F6",
      card: "#FFFFFF",
      border: "#E5E7EB",
      "border-mid": "#D1D5DB",
    },
    // PIX específico
    pix: {
      bg: "#F0FDFA",
      border: "#99F6E4",
      text: "#0F766E",
    },
  },
  
  // Fonte
  fontFamily: {
    sans: ["Plus Jakarta Sans", "sans-serif"],
  },
  
  // Espaçamentos customizados (se precisar)
  spacing: {
    "18": "4.5rem",
    "22": "5.5rem",
  },
  
  // Bordas arredondadas
  borderRadius: {
    "2xl": "14px",
    "3xl": "18px",
  },
} as const;

// Alias curto para uso em lógica JavaScript (não classes)
// Ex: if (valor > 100) return T.colors.primary.DEFAULT
export const T = tokens.colors;