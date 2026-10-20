import "server-only";

import type { ItemCarrinho } from "@/features/carrinho";
import { montarSnapshotFretePorGrupos } from "@/features/checkout/lib/frete/montar-snapshot-frete-por-grupos";
import { montarSnapshotItemPedidoCheckout } from "@/features/checkout/lib/pedidos/normalizar-checkout-visitante";
import { resolverEstoqueLocalItemCheckout } from "@/features/checkout/lib/pedidos/resolver-estoque-local-item-checkout";
import { calcularPreviaTotaisPedidoInterno } from "@/features/checkout/queries/previa-totais/calcular-previa-totais-pedido-interno";
import { calcularResumoCheckout } from "@/features/checkout/queries/resumo-checkout/calcular-resumo-checkout";
import type { CheckoutVisitanteSchema } from "@/features/checkout/schemas/checkout.schema";
import { buscarConfiguracaoPagamentoAtiva } from "@/features/precificacao/server";

type ProdutoCheckout = Parameters<typeof montarSnapshotItemPedidoCheckout>[0]["produto"];
type DadosEntrega = Pick<CheckoutVisitanteSchema, "cep" | "cidade" | "estado" | "selecoesEntregaPorGrupo">;

/** A criação e a prévia usam a mesma cotação e o mesmo cálculo de frete grátis. */
export async function calcularFreteRecompensa({
  item,
  produto,
  entrega,
}: {
  item: ItemCarrinho;
  produto: ProdutoCheckout;
  entrega: DadosEntrega;
}) {
  const configuracaoPagamento = await buscarConfiguracaoPagamentoAtiva();
  const itemNormal = montarSnapshotItemPedidoCheckout({
    item,
    produto,
    formaPagamento: "pix",
    configuracaoPagamento,
  });
  // O valor declarado para a cotação vem do preço revalidado, não do navegador.
  const itemOficial = { ...item, precoEmCentavos: itemNormal.precoUnitarioEmCentavos };
  // Este resolver aplica exatamente a seleção de modalidade e a política de estoque do checkout.
  const varianteEstoqueLocalId = resolverEstoqueLocalItemCheckout({ item, produto });
  const resumoEntrega = await calcularResumoCheckout({
    itens: [itemOficial],
    cepEntrega: entrega.cep,
    selecoesEntregaPorGrupo: entrega.selecoesEntregaPorGrupo,
    incluirDadosAuditoriaFrete: true,
  });
  const freteValidado = montarSnapshotFretePorGrupos({
    resumoRevalidado: resumoEntrega,
    selecoesRecebidas: entrega.selecoesEntregaPorGrupo,
    cep: entrega.cep,
    itensPedido: [{
      itemCarrinhoId: item.id,
      produtoId: produto.id,
      varianteId: itemNormal.varianteId,
      quantidade: 1,
      valorUnitarioEmCentavos: itemNormal.precoUnitarioEmCentavos,
    }],
  });
  if (!freteValidado.sucesso) throw new Error(freteValidado.mensagem);
  const previaLogistica = await calcularPreviaTotaisPedidoInterno({
    itens: [itemOficial],
    freteEmCentavosOficial: freteValidado.snapshot.valorTotalEmCentavos,
    aplicarFreteGratisPromocional: true,
    cepEntrega: entrega.cep,
    cidadeEntrega: entrega.cidade,
    estadoEntrega: entrega.estado,
  });
  if (!previaLogistica) throw new Error("FRETE_RECOMPENSA_INDISPONIVEL");
  const freteFinal = previaLogistica.totaisPorFormaPagamento.pix.freteEmCentavos;
  if (!Number.isSafeInteger(freteFinal) || freteFinal < 0) {
    throw new Error("FRETE_RECOMPENSA_INVALIDO");
  }
  return { itemNormal, varianteEstoqueLocalId, freteValidado, freteFinal };
}
