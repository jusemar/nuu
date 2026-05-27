import type { ResultadoCotacaoFrete } from "../../types/contratos-frete";
import type { DisponibilidadeFreteProduto } from "../../types/disponibilidade-frete";
import { filtrarOpcoesFreteDisponiveis } from "./resolver-disponibilidade-frete";

export function filtrarResultadoCotacaoFreteDisponivel(
  resultado: ResultadoCotacaoFrete,
  disponibilidade: DisponibilidadeFreteProduto,
): ResultadoCotacaoFrete {
  return {
    ...resultado,
    opcoes: filtrarOpcoesFreteDisponiveis({
      opcoes: resultado.opcoes,
      contextoProduto: disponibilidade.contextoProduto,
      volumes: {
        itens: resultado.solicitacao.itens,
        pacotes: resultado.solicitacao.pacotes,
      },
      configuracao: disponibilidade.configuracao,
    }),
  };
}
