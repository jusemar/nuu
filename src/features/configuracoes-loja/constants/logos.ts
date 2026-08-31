export const REGRAS_LOGOS_LOJA = {
  formatos: ["image/jpeg", "image/png", "image/webp"],
  tamanhoMaximoBytes: 2 * 1024 * 1024,
  cabecalho: {
    larguraMaximaProcessamento: 1_200,
    alturaMaximaProcessamento: 400,
    recomendacao: "Recomendado: imagem horizontal, até 600 × 160 px.",
  },
  rodape: {
    larguraMaximaProcessamento: 800,
    alturaMaximaProcessamento: 800,
    recomendacao: "Recomendado: até 400 × 200 px, com fundo transparente.",
  },
} as const;

export type LocalLogoLoja = "cabecalho" | "rodape";
