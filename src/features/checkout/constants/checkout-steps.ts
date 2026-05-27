export const CUPONS_CHECKOUT = {
  PRIMEIRA10: {
    codigo: "PRIMEIRA10",
    percentual: 10,
    freteGratis: false,
  },
  BEMVINDO5: {
    codigo: "BEMVINDO5",
    percentual: 5,
    freteGratis: false,
  },
  FRETEGRATIS: {
    codigo: "FRETEGRATIS",
    percentual: 0,
    freteGratis: true,
  },
} as const;
