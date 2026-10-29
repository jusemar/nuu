import { identificarVarianteTecnicaProdutoSimples } from "../variante-tecnica-produto-simples";

/** Falha fechada também para estruturas legadas ambíguas, sem conversão silenciosa. */
export function validarEstruturaProdutoRepresentante(entrada: {
  produto: { sku: string; productKind: string };
  precos: {
    type: string;
    isActive: boolean | null;
    hasPromo: boolean | null;
  }[];
  variantes: {
    id: string;
    sku: string;
    attributes: Record<string, string>;
    priceInCents: number;
    stockQuantity: number;
    isActive: boolean;
    isDefault: boolean;
  }[];
  quantidadeAtributos: number;
}) {
  if (
    entrada.produto.productKind !== "simple" ||
    entrada.quantidadeAtributos !== 0 ||
    entrada.precos.length !== 1 ||
    entrada.precos[0].type !== "dropshipping" ||
    !entrada.precos[0].isActive ||
    entrada.precos[0].hasPromo
  ) {
    throw new Error(
      "Este produto precisa de revisão do gestor antes de ser editado pelo representante.",
    );
  }
  const tecnica = identificarVarianteTecnicaProdutoSimples({
    skuProduto: entrada.produto.sku,
    variantes: entrada.variantes.map((v) => ({
      id: v.id,
      sku: v.sku,
      atributos: v.attributes,
      precoEmCentavos: v.priceInCents,
      estoque: v.stockQuantity,
      ativa: v.isActive,
      principal: v.isDefault,
    })),
  });
  if (tecnica.situacao !== "confiavel")
    throw new Error(
      "Estrutura do produto simples indisponível para edição. Solicite revisão ao gestor.",
    );
  return tecnica.variante.id;
}
