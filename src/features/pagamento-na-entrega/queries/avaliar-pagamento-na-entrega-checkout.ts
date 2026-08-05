import "server-only";

import { db } from "@/db/connection";

import { avaliarElegibilidadePagamentoNaEntrega } from "../lib/avaliar-elegibilidade-pagamento-na-entrega";
import type {
  ContextoAvaliacaoPagamentoNaEntrega,
  ModalidadeComercialCanonica,
  ResultadoAvaliacaoPagamentoNaEntrega,
} from "../types/pagamento-na-entrega.types";
import {
  buscarContextoPagamentoNaEntrega,
  type ItemParaContextoPagamentoNaEntrega,
} from "./buscar-contexto-pagamento-na-entrega";
import type { ExecutorConsultaPagamentoNaEntrega } from "./carregar-configuracoes-pagamento-na-entrega";

export type EntradaAvaliacaoPagamentoNaEntregaComBanco = {
  contexto: ContextoAvaliacaoPagamentoNaEntrega;
  itens: ItemParaContextoPagamentoNaEntrega[];
  /** Total oficial. `null` em PDP e carrinho, onde ainda não existe. */
  totalPedidoEmCentavos: number | null;
  cepEntrega: string | null;
  modalidadesComerciaisSuportadas?: readonly ModalidadeComercialCanonica[];
};

/**
 * Orquestrador: carrega o contexto do banco e roda o motor puro.
 *
 * É o ponto de entrada que PDP, carrinho e checkout vão usar. As três telas passam a
 * mesma coisa e diferem apenas no quanto conseguem informar — a PDP sem total nem CEP
 * recebe uma prévia, o checkout recebe a decisão real.
 *
 * A separação em duas etapas é o que impede a regra de se espalhar: o carregamento não
 * decide nada e o motor não sabe o que é banco. Qualquer mudança de regra acontece em um
 * lugar só.
 *
 * `avaliadoEm` é gerado aqui, e não dentro do motor. O motor precisa continuar puro para
 * ser testável e reproduzível; carimbar o horário é responsabilidade de quem tem acesso ao
 * mundo externo.
 */
export async function avaliarPagamentoNaEntregaComBanco(
  entrada: EntradaAvaliacaoPagamentoNaEntregaComBanco,
  executor: ExecutorConsultaPagamentoNaEntrega = db,
): Promise<ResultadoAvaliacaoPagamentoNaEntrega> {
  const contexto = await buscarContextoPagamentoNaEntrega(
    { itens: entrada.itens },
    executor,
  );

  return avaliarElegibilidadePagamentoNaEntrega({
    contexto: entrada.contexto,
    itens: contexto.itens,
    totalPedidoEmCentavos: entrada.totalPedidoEmCentavos,
    cepEntrega: entrada.cepEntrega,
    configuracaoGlobalAtiva: contexto.configuracaoGlobalAtiva,
    configuracoesPorServico: contexto.configuracoesPorServico,
    modalidadesComerciaisSuportadas: entrada.modalidadesComerciaisSuportadas,
    avaliadoEm: new Date().toISOString(),
  });
}
