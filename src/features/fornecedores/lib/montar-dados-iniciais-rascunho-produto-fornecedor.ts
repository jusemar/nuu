import {
  type ProductFormData,
  initialProductData,
} from "@/app/admin/products/new/data/product-form-data";
import type {
  DadosFornecedorParaRascunhoProduto,
  ModalidadeComercialFornecedor,
  ValoresPadraoRascunhoProdutoFornecedor,
} from "@/features/fornecedores/types/mapeamento-fornecedor.types";
import type { ProductKind } from "@/features/products";

function gerarSlug(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizarPreco(valor?: string | null) {
  if (!valor) return "";

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero.toFixed(2) : "";
}

function converterPrecoParaCentavos(valor?: string | null) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.round(numero * 100) : 0;
}

function converterKgParaGramas(valor?: string | null) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.round(numero * 1000) : null;
}

function converterMedida(valor?: string | null) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.round(numero) : null;
}

function obterChaveModalidadeFormulario(
  modalidade: ModalidadeComercialFornecedor,
) {
  if (modalidade === "pre_sale") return "preSale";
  if (modalidade === "order_basis") return "orderBasis";
  return modalidade;
}

export function montarDadosIniciaisRascunhoProdutoFornecedor(
  item: DadosFornecedorParaRascunhoProduto | null,
  dadosSalvos?: ProductFormData | null,
  valoresPadrao?: ValoresPadraoRascunhoProdutoFornecedor,
): ProductFormData {
  if (dadosSalvos) return dadosSalvos;

  const nome = item?.nome ?? "";
  const preco = normalizarPreco(item?.preco);
  const configuracaoComercial = valoresPadrao?.configuracaoComercial ?? {
    modalidade: "dropshipping" as const,
    prazoEntrega: { estrategia: "conciliacao" as const },
  };
  const chaveModalidade = obterChaveModalidadeFormulario(
    configuracaoComercial.modalidade,
  );
  const prazoPadrao =
    configuracaoComercial.prazoEntrega.estrategia === "valor_padrao_todos"
      ? (configuracaoComercial.prazoEntrega.valorPadraoTexto ?? "")
      : "";
  const imagens = (item?.imagens ?? []).filter(Boolean).map((url, indice) => ({
    id: `${item?.id ?? "fornecedor"}-imagem-${indice}`,
    url,
    preview: url,
    isPrimary: indice === 0,
    altText: nome,
  }));
  const modalidades = {
    stock: {
      price: chaveModalidade === "stock" ? preco : "",
      deliveryText: chaveModalidade === "stock" ? prazoPadrao : "",
      promo: { active: false, type: "normal", price: "" },
    },
    preSale: {
      price: chaveModalidade === "preSale" ? preco : "",
      deliveryText: chaveModalidade === "preSale" ? prazoPadrao : "",
      promo: { active: false, type: "normal", price: "" },
    },
    dropshipping: {
      price: chaveModalidade === "dropshipping" ? preco : "",
      deliveryText: chaveModalidade === "dropshipping" ? prazoPadrao : "",
      promo: { active: false, type: "normal", price: "" },
    },
    orderBasis: {
      price: chaveModalidade === "orderBasis" ? preco : "",
      deliveryText: chaveModalidade === "orderBasis" ? prazoPadrao : "",
      promo: { active: false, type: "normal", price: "" },
    },
  };

  return {
    ...initialProductData,
    name: nome,
    slug: gerarSlug(nome),
    categoryId: valoresPadrao?.categoriaId ?? initialProductData.categoryId,
    brandId: valoresPadrao?.marcaId ?? initialProductData.brandId,
    brand: valoresPadrao?.marcaNome ?? initialProductData.brand,
    sku: initialProductData.sku,
    productCode: item?.ean ?? initialProductData.productCode,
    ncmCode: item?.ncm ?? "",
    cardShortText: item?.complemento?.slice(0, 80) ?? "",
    description: item?.complemento
      ? `<p>${item.complemento}</p>`
      : initialProductData.description,
    isActive: false,
    storeProductFlags: ["general"],
    productKind: "simple" as ProductKind,
    images: imagens,
    variants: item
      ? [
          {
            sku: initialProductData.sku,
            name: nome,
            attributes: {},
            priceInCents: converterPrecoParaCentavos(item.preco),
            comparePriceInCents: null,
            stockQuantity: item.estoque ?? 0,
            weightInGrams: converterKgParaGramas(item.pesoBruto),
            heightInCm: converterMedida(item.alturaCaixa),
            widthInCm: converterMedida(item.larguraCaixa),
            lengthInCm: converterMedida(item.comprimentoCaixa),
            imageUrl: imagens[0]?.url ?? null,
            classificacoesLogisticasIds: [],
            isActive: false,
            isDefault: true,
          },
        ]
      : [],
    pricing: {
      costPrice: preco,
      mainCardPriceType: chaveModalidade,
      modalities: modalidades,
      configuracaoMapeamentoComercial: configuracaoComercial,
    },
    dimensoesFreteExterno: {
      pesoEmKg: item?.pesoBruto ?? "",
      alturaEmCm: item?.alturaCaixa ?? "",
      larguraEmCm: item?.larguraCaixa ?? "",
      comprimentoEmCm: item?.comprimentoCaixa ?? "",
    },
  };
}
