import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  configuracoesPagamentoNaEntregaServicoTable,
  configuracoesPagamentoTable,
  provedoresFreteTable,
  servicosFreteTable,
} from "@/db/schema";

import { PROVEDOR_ENTREGA_PROPRIA } from "../../constants/pagamento-na-entrega.constants";
import type { ConfiguracaoPagamentoNaEntregaServico } from "../../types/pagamento-na-entrega.types";

/**
 * Uma linha da tela: o serviço de entrega própria e a configuração dele, quando existe.
 *
 * `configuracao: null` significa "serviço ainda não configurado" — e o motor trata isso
 * como bloqueio, nunca como permissão. A tela precisa conseguir mostrar essa diferença.
 */
export type LinhaConfiguracaoPagamentoNaEntregaAdmin = {
  servicoFreteId: string;
  servicoIdentificador: string;
  servicoNome: string;
  servicoAtivo: boolean;
  configuracao: ConfiguracaoPagamentoNaEntregaServico | null;
};

export type PainelPagamentoNaEntregaAdmin = {
  /** Kill-switch global. Enquanto `false`, nada disso aparece para o cliente. */
  pagamentoNaEntregaAtivoGlobalmente: boolean;
  linhas: LinhaConfiguracaoPagamentoNaEntregaAdmin[];
};

/**
 * Carrega o painel administrativo de pagamento na entrega.
 *
 * Traz apenas serviços do provedor de entrega própria: são os únicos que podem aceitar
 * pagamento no recebimento, então listar Correios ou retirada aqui só geraria configuração
 * que o motor ignoraria.
 *
 * O `leftJoin` é proposital — um serviço sem linha de configuração precisa aparecer na
 * tela, senão o gestor não teria como configurá-lo pela primeira vez.
 *
 * Não há `try/catch` engolindo erro de tabela ausente: se
 * `configuracoes_pagamento_na_entrega_servico` não existir, a migration 0015 não foi
 * aplicada naquele ambiente, e é exatamente isso que precisa aparecer — silenciar
 * esconderia a condição que o bloqueio de deploy existe para detectar.
 */
export async function listarConfiguracoesPagamentoNaEntregaServico(): Promise<PainelPagamentoNaEntregaAdmin> {
  const [linhasServicos, configuracaoGlobal] = await Promise.all([
    db
      .select({
        servicoFreteId: servicosFreteTable.id,
        servicoIdentificador: servicosFreteTable.identificador,
        servicoNome: servicosFreteTable.nome,
        servicoAtivo: servicosFreteTable.ativo,
        configuracao: configuracoesPagamentoNaEntregaServicoTable,
      })
      .from(servicosFreteTable)
      .innerJoin(
        provedoresFreteTable,
        eq(servicosFreteTable.provedorFreteId, provedoresFreteTable.id),
      )
      .leftJoin(
        configuracoesPagamentoNaEntregaServicoTable,
        eq(
          configuracoesPagamentoNaEntregaServicoTable.servicoFreteId,
          servicosFreteTable.id,
        ),
      )
      .where(eq(provedoresFreteTable.identificador, PROVEDOR_ENTREGA_PROPRIA))
      .orderBy(asc(servicosFreteTable.nome)),

    db
      .select({ ativo: configuracoesPagamentoTable.pagamentoNaEntregaAtivo })
      .from(configuracoesPagamentoTable)
      .where(eq(configuracoesPagamentoTable.ativo, true))
      .limit(1),
  ]);

  return {
    // Sem linha de configuração de pagamento, o padrão é desligado — mesma lógica de
    // opt-in aplicada em todo o resto da funcionalidade.
    pagamentoNaEntregaAtivoGlobalmente: configuracaoGlobal[0]?.ativo ?? false,
    linhas: linhasServicos.map((linha) => ({
      servicoFreteId: linha.servicoFreteId,
      servicoIdentificador: linha.servicoIdentificador,
      servicoNome: linha.servicoNome,
      servicoAtivo: linha.servicoAtivo,
      // Monta exatamente o formato que o motor puro do Bloco 2 consome. É o que permite
      // o Bloco 5 reaproveitar esta query sem reescrever mapeamento nenhum.
      configuracao:
        linha.configuracao === null
          ? null
          : {
              id: linha.configuracao.id,
              servicoFreteId: linha.servicoFreteId,
              servicoIdentificador: linha.servicoIdentificador,
              servicoNome: linha.servicoNome,
              servicoAtivo: linha.servicoAtivo,
              aceitaPagamentoNaEntrega:
                linha.configuracao.aceitaPagamentoNaEntrega,
              aceitaDinheiro: linha.configuracao.aceitaDinheiro,
              aceitaPixNaEntrega: linha.configuracao.aceitaPixNaEntrega,
              aceitaDebito: linha.configuracao.aceitaDebito,
              aceitaCredito: linha.configuracao.aceitaCredito,
              valorMinimoPedidoEmCentavos:
                linha.configuracao.valorMinimoPedidoEmCentavos,
              valorMaximoPedidoEmCentavos:
                linha.configuracao.valorMaximoPedidoEmCentavos,
              valorMaximoDinheiroEmCentavos:
                linha.configuracao.valorMaximoDinheiroEmCentavos,
              exigeTroco: linha.configuracao.exigeTroco,
              observacoesCliente: linha.configuracao.observacoesCliente,
              ativo: linha.configuracao.ativo,
              atualizadoEm: linha.configuracao.updatedAt.toISOString(),
            },
    })),
  };
}
