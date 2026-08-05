import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  configuracoesPagamentoNaEntregaServicoTable,
  configuracoesPagamentoTable,
  provedoresFreteTable,
  servicosFreteTable,
} from "@/db/schema";

import { PROVEDOR_ENTREGA_PROPRIA } from "../constants/pagamento-na-entrega.constants";
import type { ConfiguracaoPagamentoNaEntregaServico } from "../types/pagamento-na-entrega.types";

/**
 * Executor de banco. `db` por padrão, mas aceita a transação em curso.
 *
 * Isso importa na criação do pedido: a reavaliação precisa enxergar exatamente o mesmo
 * estado que a transação está gravando. Ler por fora abriria uma janela em que a
 * configuração muda entre a checagem e a escrita.
 *
 * Só o `select` entra no tipo — leitura é tudo o que estas consultas fazem, e restringir
 * assim impede que alguém escreva daqui por engano. A transação de `dbTransacional`
 * (driver `pg`) satisfaz este formato sem precisar de cast, mesmo o padrão sendo o driver
 * HTTP: já verificado no Bloco 5, e é o que o Bloco 7 vai usar.
 */
export type ExecutorConsultaPagamentoNaEntrega = Pick<typeof db, "select">;

/** Serviço de entrega própria com a configuração dele, quando existe. */
export type ServicoComConfiguracaoPagamentoNaEntrega = {
  servicoFreteId: string;
  servicoIdentificador: string;
  servicoNome: string;
  servicoAtivo: boolean;
  /** `null` = serviço nunca configurado. O motor trata como bloqueio, nunca permissão. */
  configuracao: ConfiguracaoPagamentoNaEntregaServico | null;
};

/**
 * Carrega os serviços de entrega própria e suas configurações de pagamento na entrega.
 *
 * Fonte única desses dados: o painel administrativo e o motor de elegibilidade leem daqui.
 * Se cada um montasse a própria consulta, uma mudança de regra precisaria ser lembrada em
 * dois lugares — e a tela passaria a mostrar algo diferente do que a loja aplica.
 *
 * Só traz o provedor de entrega própria: transportadora e retirada não podem aceitar
 * pagamento no recebimento, então configurá-las seria configuração morta.
 */
export async function carregarServicosComConfiguracaoPagamentoNaEntrega(
  executor: ExecutorConsultaPagamentoNaEntrega = db,
): Promise<ServicoComConfiguracaoPagamentoNaEntrega[]> {
  const linhas = await executor
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
    // `leftJoin` de propósito: um serviço sem configuração precisa aparecer, senão o
    // gestor não teria como configurá-lo pela primeira vez.
    .leftJoin(
      configuracoesPagamentoNaEntregaServicoTable,
      eq(
        configuracoesPagamentoNaEntregaServicoTable.servicoFreteId,
        servicosFreteTable.id,
      ),
    )
    .where(eq(provedoresFreteTable.identificador, PROVEDOR_ENTREGA_PROPRIA))
    .orderBy(asc(servicosFreteTable.nome));

  return linhas.map((linha) => ({
    servicoFreteId: linha.servicoFreteId,
    servicoIdentificador: linha.servicoIdentificador,
    servicoNome: linha.servicoNome,
    servicoAtivo: linha.servicoAtivo,
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
  }));
}

/**
 * Lê o kill-switch global.
 *
 * Ausência de linha de configuração devolve `false` — mesmo opt-in do resto da
 * funcionalidade: nada fica ligado por omissão.
 */
export async function carregarKillSwitchPagamentoNaEntrega(
  executor: ExecutorConsultaPagamentoNaEntrega = db,
): Promise<boolean> {
  const linhas = await executor
    .select({ ativo: configuracoesPagamentoTable.pagamentoNaEntregaAtivo })
    .from(configuracoesPagamentoTable)
    .where(eq(configuracoesPagamentoTable.ativo, true))
    .limit(1);

  return linhas[0]?.ativo ?? false;
}
