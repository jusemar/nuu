export const SECOES_LOJA = [
  {
    id: "general",
    rotulo: "Catálogo",
    icone: "📦",
    descricao: "Exibe nas listagens gerais da loja, categorias e busca.",
  },
  {
    id: "new",
    rotulo: "Novidades",
    icone: "🆕",
    descricao: "Exibe no carrossel Novidades da página inicial.",
  },
  {
    id: "sale",
    rotulo: "Ofertas",
    icone: "🔥",
    descricao: "Exibe em Ofertas Especiais quando houver promoção válida.",
  },
  {
    id: "featured",
    rotulo: "Destaques",
    icone: "⭐",
    descricao: "Adiciona o badge Destaque aos cards do produto.",
  },
  {
    id: "bestseller",
    rotulo: "+ Vendidos",
    icone: "🏆",
    descricao: "Exibe na seção Mais vendidos da página inicial.",
  },
] as const;

export const ROTULO_SECAO_LOJA = new Map<string, string>(
  SECOES_LOJA.map((secao) => [secao.id, secao.rotulo]),
);
