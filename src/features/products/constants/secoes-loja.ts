export const SECOES_LOJA = [
  { id: "general", rotulo: "Catálogo", icone: "📦" },
  { id: "new", rotulo: "Novidades", icone: "🆕" },
  { id: "sale", rotulo: "Ofertas", icone: "🔥" },
  { id: "featured", rotulo: "Destaques", icone: "⭐" },
  { id: "bestseller", rotulo: "+ Vendidos", icone: "🏆" },
] as const;

export const ROTULO_SECAO_LOJA = new Map<string, string>(
  SECOES_LOJA.map((secao) => [secao.id, secao.rotulo]),
);
