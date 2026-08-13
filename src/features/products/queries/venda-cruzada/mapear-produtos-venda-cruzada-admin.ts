import "server-only";

import {
  adaptarPrecosVitrine,
  modalidadePrecoExigeEstoqueLocal,
  type ProdutoVitrinePrecificavel,
} from "@/features/precificacao/server";

import { identificarVarianteTecnicaProdutoSimples } from "../../lib/variante-tecnica-produto-simples";
import type { ProdutoVendaCruzadaAdmin } from "../../types/venda-cruzada.types";

type ProdutoCatalogoVendaCruzada = Omit<
  ProdutoVitrinePrecificavel,
  "variants"
> & {
  name: string;
  sku: string;
  status: string | null;
  isActive: boolean | null;
  galleryImages: Array<{ imageUrl: string; isPrimary: boolean | null }>;
  variants: Array<{
    id: string;
    sku: string;
    attributes: Record<string, string>;
    priceInCents: number;
    stockQuantity: number;
    imageUrl: string | null;
    isActive: boolean;
    isDefault: boolean;
  }>;
};

/** Converte uma consulta de catálogo no contrato mínimo consumido pela aba. */
export async function mapearProdutosVendaCruzadaAdmin(
  produtos: ProdutoCatalogoVendaCruzada[],
): Promise<ProdutoVendaCruzadaAdmin[]> {
  if (produtos.length === 0) return [];

  const precos = await adaptarPrecosVitrine(produtos);

  return produtos.map((produto) => {
    const precoPrincipal =
      precos.produtosPorId[produto.id]?.precoPrincipal ?? null;
    const varianteDoPreco = precoPrincipal?.varianteId
      ? produto.variants.find(
          (variante) => variante.id === precoPrincipal.varianteId,
        )
      : null;
    const varianteTecnica =
      produto.productKind === "variable"
        ? null
        : identificarVarianteTecnicaProdutoSimples({
            skuProduto: produto.sku,
            variantes: produto.variants.map((variante) => ({
              id: variante.id,
              sku: variante.sku,
              atributos: variante.attributes,
              precoEmCentavos: variante.priceInCents,
              estoque: variante.stockQuantity,
              ativa: variante.isActive,
              principal: variante.isDefault,
            })),
          });
    const exigeEstoque = precoPrincipal
      ? modalidadePrecoExigeEstoqueLocal(precoPrincipal.modalidade)
      : true;
    const disponivel = Boolean(
      precoPrincipal &&
        precoPrincipal.precoFinalEmCentavos > 0 &&
        (produto.productKind === "variable"
          ? varianteDoPreco?.isActive &&
            (!exigeEstoque || varianteDoPreco.stockQuantity > 0)
          : varianteTecnica?.situacao === "confiavel" &&
            (!exigeEstoque || varianteTecnica.variante.estoque > 0)),
    );
    const precoCalculado = precoPrincipal?.precificacao ?? null;
    const parcelamentos = precoCalculado?.cartao.parcelamentos ?? [];
    const parcelamento = parcelamentos.at(-1) ?? null;
    const imagem =
      produto.galleryImages.find((item) => item.isPrimary) ??
      produto.galleryImages[0];

    return {
      id: produto.id,
      nome: produto.name,
      sku: produto.sku,
      tipo: produto.productKind === "variable" ? "variavel" : "simples",
      imagemUrl:
        imagem?.imageUrl ??
        produto.variants.find((variante) => variante.imageUrl)?.imageUrl ??
        null,
      ativo: Boolean(produto.isActive),
      publicado: produto.status === "published",
      disponivel,
      precoComercialEmCentavos: precoPrincipal?.precoFinalEmCentavos ?? null,
      precoPixEmCentavos: precoCalculado?.pix.ativo
        ? precoCalculado.pix.valorEmCentavos
        : null,
      parcelamentoCartao:
        precoCalculado?.cartao.ativo && parcelamento
          ? {
              parcelas: parcelamento.parcelas,
              valorEmCentavos: parcelamento.valorParcelaEmCentavos,
            }
          : null,
    };
  });
}
