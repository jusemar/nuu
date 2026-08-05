// src/features/products/lib/situacao-publicacao-produto.ts
//
// Regra de negócio pura (sem React) que traduz os campos de controle do produto
// para a mesma leitura que as consultas públicas da loja fazem.
//
// As consultas públicas (home, categoria, busca, PDP, ofertas) exigem:
//   - status = 'published'
//   - is_active = true
//   - flag 'general' em store_product_flags (para categoria, busca e vitrine)
//
// Este arquivo existe para que o admin mostre exatamente essas regras,
// evitando a situação em que a tela aparenta "publicado" e o banco mantém
// rascunho, produto inativo ou produto fora do Catálogo.

/** Flag que coloca o produto no Catálogo (vitrine, categoria e busca). */
export const FLAG_CATALOGO = "general";

/** Situações possíveis de um produto do ponto de vista da loja. */
export type SituacaoPublicacaoProduto =
  | "publicado"
  | "rascunho"
  | "inativo"
  | "fora-do-catalogo";

interface DadosSituacaoProduto {
  /** Valor da coluna `status` do produto ('draft' | 'published'). */
  status?: string | null;
  /** Valor da coluna `is_active` do produto. */
  isActive?: boolean | null;
  /** Valor da coluna `store_product_flags` do produto. */
  storeProductFlags?: string[] | null;
}

/**
 * Descobre a situação do produto na loja.
 *
 * A ordem das verificações é proposital: mostramos primeiro o motivo mais
 * grave, porque é ele que precisa ser resolvido antes dos demais.
 *
 * 1. rascunho          → nem começa a aparecer em lugar nenhum
 * 2. inativo           → publicado, mas desligado
 * 3. fora-do-catalogo  → publicado e ativo, mas sem a flag 'general',
 *                        então não entra em categoria, busca nem vitrine
 * 4. publicado         → aparece normalmente
 */
export function obterSituacaoPublicacaoProduto(
  produto: DadosSituacaoProduto,
): SituacaoPublicacaoProduto {
  if (produto.status !== "published") return "rascunho";
  if (produto.isActive !== true) return "inativo";

  const flags = produto.storeProductFlags ?? [];
  if (!flags.includes(FLAG_CATALOGO)) return "fora-do-catalogo";

  return "publicado";
}

/** Texto curto exibido no selo do admin. */
export const ROTULOS_SITUACAO_PUBLICACAO: Record<
  SituacaoPublicacaoProduto,
  string
> = {
  publicado: "Publicado",
  rascunho: "Rascunho",
  inativo: "Inativo",
  "fora-do-catalogo": "Fora do Catálogo",
};

/** Explicação usada em tooltip/descrição, para o admin saber o que fazer. */
export const DESCRICOES_SITUACAO_PUBLICACAO: Record<
  SituacaoPublicacaoProduto,
  string
> = {
  publicado: "Aparece na loja normalmente.",
  rascunho: "Não aparece na loja. Use o botão Publicar produto.",
  inativo: "Não aparece na loja porque o produto está desativado.",
  "fora-do-catalogo":
    "Não aparece em categorias, busca nem vitrine. Marque a opção Catálogo na aba Básico.",
};

/** Indica se a situação impede o produto de aparecer na loja. */
export function situacaoImpedeExibicao(
  situacao: SituacaoPublicacaoProduto,
): boolean {
  return situacao !== "publicado";
}
