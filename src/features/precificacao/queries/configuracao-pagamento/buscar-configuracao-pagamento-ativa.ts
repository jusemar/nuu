import { desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { configuracoesPagamentoTable } from "@/db/schema";

import { CONFIGURACAO_PAGAMENTO_PADRAO } from "../../constants/precificacao-padroes";
import type { ConfiguracaoPagamentoCalculavel } from "../../types/precificacao.types";

export async function buscarConfiguracaoPagamentoAtiva(): Promise<ConfiguracaoPagamentoCalculavel> {
  let configuracao: typeof configuracoesPagamentoTable.$inferSelect | undefined;

  try {
    configuracao = await db.query.configuracoesPagamentoTable.findFirst({
      where: eq(configuracoesPagamentoTable.ativo, true),
      orderBy: desc(configuracoesPagamentoTable.updatedAt),
    });
  } catch (error) {
    console.error("Erro ao buscar configuração de pagamento ativa", error);
    return CONFIGURACAO_PAGAMENTO_PADRAO;
  }

  if (!configuracao) {
    return CONFIGURACAO_PAGAMENTO_PADRAO;
  }

  return {
    pixAtivo: configuracao.pixAtivo,
    cartaoAtivo: configuracao.cartaoAtivo,
    boletoAtivo: configuracao.boletoAtivo,
    percentualAcrescimoCartaoBps: configuracao.percentualAcrescimoCartaoBps,
    parcelasSemJuros: configuracao.parcelasSemJuros,
    taxaJurosMensalBps: configuracao.taxaJurosMensalBps,
    maximoParcelas: configuracao.maximoParcelas,
    valorMinimoParcelaEmCentavos: configuracao.valorMinimoParcelaEmCentavos,
  };
}
