import { desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { configuracoesPagamentoTable } from "@/db/schema";

import { CONFIGURACAO_PAGAMENTO_PADRAO } from "../../constants/precificacao-padroes";
import type { ConfiguracaoPagamentoCalculavel } from "../../types/precificacao.types";

export async function buscarConfiguracaoPagamentoAtiva(): Promise<ConfiguracaoPagamentoCalculavel> {
  const configuracao = await db.query.configuracoesPagamentoTable.findFirst({
    where: eq(configuracoesPagamentoTable.ativo, true),
    orderBy: desc(configuracoesPagamentoTable.updatedAt),
  });

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
