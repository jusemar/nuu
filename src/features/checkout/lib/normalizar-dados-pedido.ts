import type { ItemCarrinho } from "@/features/carrinho";

import type {
  CriarClienteCheckoutSchema,
  CriarEnderecoCheckoutSchema,
  CriarPedidoItemCheckoutSchema,
} from "../schemas/pedido-pagamento.schema";

type NormalizarClienteParams = {
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  userId?: string | null;
};

type NormalizarEnderecoParams = {
  clienteId: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  observacao?: string | null;
};

export function normalizarClienteCheckout({
  nome,
  email,
  telefone,
  documento,
  userId = null,
}: NormalizarClienteParams): CriarClienteCheckoutSchema {
  return {
    userId,
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    telefone: telefone.replace(/\D/g, ""),
    documento: documento.replace(/\D/g, ""),
  };
}

export function normalizarEnderecoCheckout({
  clienteId,
  cep,
  rua,
  numero,
  complemento,
  bairro,
  cidade,
  estado,
  observacao,
}: NormalizarEnderecoParams): CriarEnderecoCheckoutSchema {
  return {
    clienteId,
    cep: cep.replace(/\D/g, ""),
    rua: rua.trim(),
    numero: numero.trim(),
    complemento: complemento?.trim() || null,
    bairro: bairro.trim(),
    cidade: cidade.trim(),
    estado: estado.trim().toUpperCase(),
    observacao: observacao?.trim() || null,
  };
}

export function normalizarItensPedidoCheckout(
  pedidoId: string,
  itens: ItemCarrinho[],
): CriarPedidoItemCheckoutSchema[] {
  return itens.map((item) => ({
    pedidoId,
    produtoId: item.produtoId,
    varianteId: item.produtoVarianteId ?? null,
    nomeProduto: item.nome,
    nomeVariante: item.variante || null,
    atributosVariante: item.atributosVariante || {},
    skuProduto: item.sku || null,
    modalidade: item.produtoVarianteId ? null : item.variante || null,
    prazoModalidade: item.prazoModalidade || null,
    imagemUrl: item.imagemUrl || null,
    quantidade: item.quantidade,
    precoUnitarioEmCentavos: item.precoEmCentavos,
    totalEmCentavos: item.precoEmCentavos * item.quantidade,
  }));
}
