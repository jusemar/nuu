import type { ItemCarrinho } from "@/features/carrinho";
import {
  calcularPrecoProduto,
  type ConfiguracaoPagamentoCalculavel,
} from "@/features/precificacao";

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
  pricing: PrecoProdutoCheckout[];
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
  const precoSelecionado =
    produto.pricing.find((preco) => preco.type === modalidadeTipo) ||
    produto.pricing.find(
      (preco) =>
        preco.pricingModalDescription === variante || preco.type === variante,
    ) ||
    produto.pricing.find((preco) => preco.mainCardPrice) ||
    produto.pricing.find((preco) => preco.isActive) ||
    produto.pricing[0];

  if (!precoSelecionado) {
    throw new Error(`Produto sem preço ativo: ${produto.name}`);
  }

  return precoSelecionado;
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
  const precoSelecionado = selecionarPrecoProdutoCheckout(
    produto,
    item.variante,
    item.modalidadeTipo,
  );
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
    nomeProduto: produto.name,
    skuProduto: produto.sku,
    modalidade:
      precoSelecionado.pricingModalDescription || precoSelecionado.type,
    prazoModalidade: precoSelecionado.deliveryDays || "Consulte prazo",
    imagemUrl: item.imagemUrl || null,
    quantidade: item.quantidade,
    precoUnitarioEmCentavos: precoEmCentavos,
    totalEmCentavos: precoEmCentavos * item.quantidade,
  };
}
