import "server-only";

import { montarItensMerchant } from "../../lib/montar-itens-merchant";
import type { ProdutoPadraoMatrizFreteMerchant } from "../../types/matriz-frete-merchant";
import { listarProdutosFonteMerchant } from "../listar-produtos-fonte-merchant";

/** Usa o próprio modelo do feed para que elegibilidade e shipping_label não divirjam. */
export async function listarProdutosPadraoMatrizFreteMerchant() {
  const fontes = await listarProdutosFonteMerchant();
  const itens = (await montarItensMerchant(fontes)).filter(
    (item) => !item.shippingLabel,
  );

  return itens.flatMap((item): ProdutoPadraoMatrizFreteMerchant[] => {
    const produto = fontes.find((fonte) =>
      fonte.variants.some((variante) => variante.sku.trim() === item.id),
    );
    if (!produto) return [];

    const variante = produto.variants.find(
      (candidata) => candidata.sku.trim() === item.id,
    );
    const modalidade =
      produto.pricing.find((preco) => preco.isActive && preco.mainCardPrice) ??
      produto.pricing.find((preco) => preco.isActive);

    return [
      {
        merchantId: item.id,
        titulo: item.title,
        produtoId: produto.id,
        varianteId:
          produto.productKind === "variable" ? (variante?.id ?? null) : null,
        modalidadeComercial:
          produto.productKind === "variable"
            ? null
            : (modalidade?.type ?? null),
      },
    ];
  });
}
