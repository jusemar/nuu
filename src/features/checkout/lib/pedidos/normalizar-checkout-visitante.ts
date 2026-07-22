import type { ItemCarrinho } from "@/features/carrinho";
import { identificarVarianteTecnicaProdutoSimples } from "@/features/products/domain";
import {
  calcularPrecoProduto,
  modalidadePrecoExigeEstoqueLocal,
  modalidadesPrecoSaoEquivalentes,
  normalizarModalidadePrecoCanonica,
  type ConfiguracaoPagamentoCalculavel,
} from "@/features/precificacao/server";

type PrecoProdutoCheckout = {
  type: string;
  pricingModalDescription: string | null;
  price: number;
  mainCardPrice: boolean | null;
  deliveryDays: string | null;
  hasPromo: boolean | null;
  promoType: string | null;
  promoPrice: number | null;
  promoEndDate: Date | null;
  promoDuration: number | null;
  promoDurationUnit: string | null;
  isActive: boolean | null;
};

type ProdutoCheckout = {
  id: string;
  name: string;
  sku: string;
  productKind?: string | null;
  isActive?: boolean | null;
  status?: string | null;
  pricing: PrecoProdutoCheckout[];
  galleryImages?: Array<{
    imageUrl: string;
    isPrimary: boolean | null;
    sortOrder: number | null;
  }>;
  variants?: VarianteProdutoCheckout[];
};

type VarianteProdutoCheckout = {
  id: string;
  sku: string;
  name: string | null;
  attributes: Record<string, string>;
  priceInCents: number;
  stockQuantity: number;
  imageUrl: string | null;
  weightInGrams: number | null;
  heightInCm: number | null;
  widthInCm: number | null;
  lengthInCm: number | null;
  isActive: boolean;
  isDefault: boolean;
};

export function normalizarEmailCheckout(email: string) {
  return email.trim().toLowerCase();
}

export function normalizarDocumentoCheckout(documento: string) {
  return documento.replace(/\D/g, "");
}

export function normalizarTelefoneCheckout(telefone: string) {
  return telefone.replace(/\D/g, "");
}

export function normalizarTextoOpcionalCheckout(valor?: string | null) {
  const texto = valor?.trim();
  return texto ? texto : null;
}

export function selecionarPrecoProdutoCheckout(
  produto: ProdutoCheckout,
  variante?: string,
  modalidadeTipo?: string,
) {
  const modalidadeSolicitada = modalidadeTipo?.trim();
  const precosAtivos = produto.pricing.filter((preco) => preco.isActive);
  const precoPorModalidade = modalidadeSolicitada
    ? produto.pricing.find((preco) =>
        modalidadesPrecoSaoEquivalentes(preco.type, modalidadeSolicitada),
      )
    : null;

  if (
    modalidadeSolicitada &&
    !normalizarModalidadePrecoCanonica(modalidadeSolicitada)
  ) {
    throw new Error(
      `Modalidade inválida para ${produto.name}: ${modalidadeSolicitada}`,
    );
  }

  if (modalidadeSolicitada && !precoPorModalidade) {
    throw new Error(`Modalidade não encontrada para ${produto.name}`);
  }

  if (precoPorModalidade && !precoPorModalidade.isActive) {
    throw new Error(`Modalidade inativa para ${produto.name}`);
  }

  const precoSelecionado =
    precoPorModalidade ||
    precosAtivos.find(
      (preco) =>
        preco.pricingModalDescription === variante || preco.type === variante,
    ) ||
    precosAtivos.find((preco) => preco.mainCardPrice) ||
    precosAtivos[0];

  if (!precoSelecionado) {
    throw new Error(`Produto sem preço ativo: ${produto.name}`);
  }

  const precoEfetivo =
    precoSelecionado.hasPromo && precoSelecionado.promoPrice
      ? precoSelecionado.promoPrice
      : precoSelecionado.price;

  if (!Number.isSafeInteger(precoEfetivo) || precoEfetivo <= 0) {
    throw new Error(`Produto sem preço válido: ${produto.name}`);
  }

  return precoSelecionado;
}

function validarProdutoCheckout(produto: ProdutoCheckout, quantidade: number) {
  if (produto.isActive === false || produto.status === "archived") {
    throw new Error(`Produto indisponível: ${produto.name}`);
  }

  if (produto.status && produto.status !== "published") {
    throw new Error(`Produto não publicado: ${produto.name}`);
  }

  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    throw new Error(`Quantidade inválida para ${produto.name}`);
  }
}

function obterImagemGaleriaProduto(produto: ProdutoCheckout) {
  return (produto.galleryImages || [])
    .filter((imagem) => imagem.imageUrl.trim())
    .sort((imagemA, imagemB) => {
      if (imagemA.isPrimary) return -1;
      if (imagemB.isPrimary) return 1;
      return (imagemA.sortOrder ?? 0) - (imagemB.sortOrder ?? 0);
    })[0]?.imageUrl;
}

export function resolverItemVendavelCheckout({
  item,
  produto,
}: {
  item: ItemCarrinho;
  produto: ProdutoCheckout;
}) {
  validarProdutoCheckout(produto, item.quantidade);

  if (produto.productKind !== "variable") {
    const precoSelecionado = selecionarPrecoProdutoCheckout(
      produto,
      item.variante,
      item.modalidadeTipo,
    );
    const identificacao = identificarVarianteTecnicaProdutoSimples({
      skuProduto: produto.sku,
      variantes: (produto.variants || []).map((variante) => ({
        id: variante.id,
        sku: variante.sku,
        atributos: variante.attributes,
        precoEmCentavos: variante.priceInCents,
        estoque: variante.stockQuantity,
        ativa: variante.isActive,
        principal: variante.isDefault,
      })),
    });

    if (identificacao.situacao !== "confiavel") {
      throw new Error(`${produto.name}: ${identificacao.motivo}`);
    }

    if (
      item.produtoVarianteId &&
      item.produtoVarianteId !== identificacao.variante.id
    ) {
      throw new Error(`Variante técnica inválida para ${produto.name}`);
    }

    if (
      modalidadePrecoExigeEstoqueLocal(precoSelecionado.type) &&
      identificacao.variante.estoque < item.quantidade
    ) {
      throw new Error(`Estoque insuficiente para ${produto.name}`);
    }

    return {
      tipo: "simple" as const,
      precoSelecionado,
      varianteTecnica: identificacao.variante,
      imagemUrl: item.imagemUrl || obterImagemGaleriaProduto(produto) || null,
    };
  }

  if (!item.produtoVarianteId) {
    throw new Error(`Selecione uma variante válida para ${produto.name}`);
  }

  const variante = (produto.variants || []).find(
    (varianteAtual) => varianteAtual.id === item.produtoVarianteId,
  );

  if (!variante) {
    throw new Error(`Variante não encontrada para ${produto.name}`);
  }

  if (!variante.isActive) {
    throw new Error(`Variante indisponível para ${produto.name}`);
  }

  if (variante.priceInCents <= 0) {
    throw new Error(`Variante sem preço válido: ${produto.name}`);
  }

  const modalidadeLegadaDaVariante =
    item.modalidadeTipo?.startsWith("variant:");
  const precoSelecionado = modalidadeLegadaDaVariante
    ? null
    : selecionarPrecoProdutoCheckout(
        produto,
        item.variante,
        item.modalidadeTipo,
      );

  if (
    (modalidadeLegadaDaVariante ||
      modalidadePrecoExigeEstoqueLocal(precoSelecionado?.type)) &&
    variante.stockQuantity < item.quantidade
  ) {
    throw new Error(`Estoque insuficiente para ${produto.name}`);
  }

  return {
    tipo: "variant" as const,
    variante,
    precoSelecionado,
    imagemUrl:
      variante.imageUrl ||
      item.imagemUrl ||
      obterImagemGaleriaProduto(produto) ||
      null,
  };
}

export function montarSnapshotItemPedidoCheckout({
  item,
  produto,
  formaPagamento,
  configuracaoPagamento,
}: {
  item: ItemCarrinho;
  produto: ProdutoCheckout;
  formaPagamento: "pix" | "cartao";
  configuracaoPagamento: ConfiguracaoPagamentoCalculavel;
}) {
  const itemVendavel = resolverItemVendavelCheckout({ item, produto });

  if (itemVendavel.tipo === "variant") {
    const precoCalculado = calcularPrecoProduto({
      entrada: {
        produtoId: produto.id,
        modalidade: `variant:${itemVendavel.variante.id}`,
        precoBaseEmCentavos: itemVendavel.variante.priceInCents,
      },
      configuracao: configuracaoPagamento,
    });
    const precoEmCentavos =
      formaPagamento === "cartao"
        ? precoCalculado.cartao.valorEmCentavos
        : precoCalculado.pix.valorEmCentavos;

    return {
      produtoId: produto.id,
      varianteId: itemVendavel.variante.id,
      nomeProduto: produto.name,
      nomeVariante:
        itemVendavel.variante.name ||
        Object.values(itemVendavel.variante.attributes).join(" / ") ||
        null,
      atributosVariante: itemVendavel.variante.attributes,
      skuProduto: itemVendavel.variante.sku,
      modalidade:
        itemVendavel.precoSelecionado?.pricingModalDescription ||
        normalizarModalidadePrecoCanonica(itemVendavel.precoSelecionado?.type),
      prazoModalidade: item.prazoModalidade || "Consulte prazo",
      imagemUrl: itemVendavel.imagemUrl,
      quantidade: item.quantidade,
      precoUnitarioEmCentavos: precoEmCentavos,
      totalEmCentavos: precoEmCentavos * item.quantidade,
    };
  }

  const precoSelecionado = itemVendavel.precoSelecionado;
  const precoBaseEmCentavos =
    precoSelecionado.hasPromo && precoSelecionado.promoPrice
      ? precoSelecionado.promoPrice
      : precoSelecionado.price;
  const precoCalculado = calcularPrecoProduto({
    entrada: {
      produtoId: produto.id,
      modalidade: precoSelecionado.type,
      precoBaseEmCentavos,
    },
    configuracao: configuracaoPagamento,
  });
  const precoEmCentavos =
    formaPagamento === "cartao"
      ? precoCalculado.cartao.valorEmCentavos
      : precoCalculado.pix.valorEmCentavos;

  return {
    produtoId: produto.id,
    varianteId: itemVendavel.varianteTecnica.id,
    nomeProduto: produto.name,
    nomeVariante: null,
    atributosVariante: {},
    skuProduto: produto.sku,
    modalidade:
      precoSelecionado.pricingModalDescription || precoSelecionado.type,
    prazoModalidade: precoSelecionado.deliveryDays || "Consulte prazo",
    imagemUrl: itemVendavel.imagemUrl,
    quantidade: item.quantidade,
    precoUnitarioEmCentavos: precoEmCentavos,
    totalEmCentavos: precoEmCentavos * item.quantidade,
  };
}
