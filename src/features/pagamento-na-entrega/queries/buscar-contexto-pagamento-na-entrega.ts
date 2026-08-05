import "server-only";

import { eq, inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  productPricingTable,
  productTable,
  productVariantTable,
} from "@/db/schema";

import type {
  ConfiguracaoPagamentoNaEntregaServico,
  FreteEscolhidoItemPagamentoNaEntrega,
  ItemAvaliacaoPagamentoNaEntrega,
} from "../types/pagamento-na-entrega.types";
import {
  carregarKillSwitchPagamentoNaEntrega,
  carregarServicosComConfiguracaoPagamentoNaEntrega,
  type ExecutorConsultaPagamentoNaEntrega,
} from "./carregar-configuracoes-pagamento-na-entrega";

/**
 * O que o chamador sabe sobre cada item antes de consultar o banco.
 *
 * `modalidadeInformada` e `frete` vêm de fora, e por isso são tratados como suspeitos:
 * a modalidade é conferida contra o banco (ver abaixo) e o frete, no checkout, tem de vir
 * do snapshot produzido pelo servidor — nunca do carrinho em localStorage, que o usuário
 * consegue editar.
 */
export type ItemParaContextoPagamentoNaEntrega = {
  itemCarrinhoId: string;
  produtoId: string;
  varianteId: string | null;
  modalidadeInformada: string | null;
  frete: FreteEscolhidoItemPagamentoNaEntrega | null;
};

export type ContextoPagamentoNaEntrega = {
  configuracaoGlobalAtiva: boolean;
  configuracoesPorServico: ConfiguracaoPagamentoNaEntregaServico[];
  itens: ItemAvaliacaoPagamentoNaEntrega[];
};

/**
 * Carrega do banco tudo que o motor de elegibilidade precisa e devolve no formato exato
 * que ele consome.
 *
 * Divisão de responsabilidade: aqui só há I/O e normalização — **nenhuma regra de
 * elegibilidade**. Quem decide se o pedido pode ser pago na entrega é sempre
 * `avaliarElegibilidadePagamentoNaEntrega`. É isso que permite PDP, carrinho e checkout
 * compartilharem a mesma decisão trocando apenas o carregamento.
 *
 * Aceita `executor` para rodar dentro da transação de criação do pedido, enxergando o
 * mesmo estado que está sendo gravado.
 */
export async function buscarContextoPagamentoNaEntrega(
  entrada: {
    itens: ItemParaContextoPagamentoNaEntrega[];
  },
  executor: ExecutorConsultaPagamentoNaEntrega = db,
): Promise<ContextoPagamentoNaEntrega> {
  const [configuracaoGlobalAtiva, servicos] = await Promise.all([
    carregarKillSwitchPagamentoNaEntrega(executor),
    carregarServicosComConfiguracaoPagamentoNaEntrega(executor),
  ]);

  const configuracoesPorServico = servicos
    .map((servico) => servico.configuracao)
    .filter(
      (configuracao): configuracao is ConfiguracaoPagamentoNaEntregaServico =>
        configuracao !== null,
    );

  // Carrinho vazio não precisa de consulta nenhuma de produto. O motor tem motivo próprio
  // para esse caso; aqui apenas evitamos um `inArray` com lista vazia.
  if (entrada.itens.length === 0) {
    return { configuracaoGlobalAtiva, configuracoesPorServico, itens: [] };
  }

  const produtoIds = [...new Set(entrada.itens.map((item) => item.produtoId))];
  const varianteIds = [
    ...new Set(
      entrada.itens
        .map((item) => item.varianteId)
        .filter((id): id is string => id !== null),
    ),
  ];

  const [produtos, variantes, modalidades] = await Promise.all([
    executor
      .select({
        id: productTable.id,
        aceitaPagamentoNaEntrega: productTable.aceitaPagamentoNaEntrega,
      })
      .from(productTable)
      .where(inArray(productTable.id, produtoIds)),

    varianteIds.length === 0
      ? Promise.resolve(
          [] as Array<{
            id: string;
            produtoId: string;
            aceitaPagamentoNaEntrega: boolean | null;
          }>,
        )
      : executor
          .select({
            id: productVariantTable.id,
            produtoId: productVariantTable.productId,
            aceitaPagamentoNaEntrega:
              productVariantTable.aceitaPagamentoNaEntrega,
          })
          .from(productVariantTable)
          .where(inArray(productVariantTable.id, varianteIds)),

    // Modalidades ativas de cada produto, usadas só para conferir a informada.
    executor
      .select({
        produtoId: productPricingTable.productId,
        tipo: productPricingTable.type,
      })
      .from(productPricingTable)
      .where(eq(productPricingTable.isActive, true)),
  ]);

  const produtoPorId = new Map(produtos.map((item) => [item.id, item]));
  const variantePorId = new Map(variantes.map((item) => [item.id, item]));

  const modalidadesPorProduto = new Map<string, Set<string>>();
  for (const linha of modalidades) {
    if (!produtoIds.includes(linha.produtoId)) continue;

    const conjunto = modalidadesPorProduto.get(linha.produtoId) ?? new Set();
    conjunto.add(linha.tipo);
    modalidadesPorProduto.set(linha.produtoId, conjunto);
  }

  const itens: ItemAvaliacaoPagamentoNaEntrega[] = entrada.itens.map((item) => {
    const produto = produtoPorId.get(item.produtoId) ?? null;
    const variante =
      item.varianteId === null
        ? null
        : (variantePorId.get(item.varianteId) ?? null);

    // A modalidade informada só é aceita se o produto realmente a oferece e está ativa.
    // Sem essa conferência, uma string qualquer vinda de fora poderia se passar por
    // `stock` e destravar pagamento na entrega para um produto sob encomenda.
    // Não conferir é diferente de bloquear: devolvemos `null` e deixamos o motor decidir,
    // porque a regra de quais modalidades valem é dele, não daqui.
    const modalidadesDoProduto = modalidadesPorProduto.get(item.produtoId);
    const modalidadeComercial =
      item.modalidadeInformada !== null &&
      modalidadesDoProduto?.has(item.modalidadeInformada)
        ? item.modalidadeInformada
        : null;

    // A variante precisa pertencer ao produto do item. Um par produto/variante forjado
    // poderia herdar a permissão de outro produto.
    const varianteDoProduto =
      variante !== null && variante.produtoId === item.produtoId
        ? variante
        : null;

    return {
      itemCarrinhoId: item.itemCarrinhoId,
      produtoId: item.produtoId,
      varianteId: item.varianteId,
      // Produto inexistente vira `false`: nunca liberar por ausência de dado.
      produtoAceitaPagamentoNaEntrega:
        produto?.aceitaPagamentoNaEntrega ?? false,
      // `null` preserva a herança; qualquer outra coisa seria decisão inventada aqui.
      varianteAceitaPagamentoNaEntrega:
        varianteDoProduto?.aceitaPagamentoNaEntrega ?? null,
      modalidadeComercial,
      frete: item.frete,
    };
  });

  return { configuracaoGlobalAtiva, configuracoesPorServico, itens };
}
