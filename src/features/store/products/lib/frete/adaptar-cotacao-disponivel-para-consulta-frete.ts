import {
  filtrarResultadoCotacaoFreteDisponivel,
  type DisponibilidadeFreteProduto,
  type ResultadoCotacaoFrete,
} from "@/features/logistica";

import { adaptarCotacaoLogisticaParaConsultaFrete } from "./adaptar-cotacao-logistica-para-consulta-frete";

export function adaptarCotacaoDisponivelParaConsultaFrete(
  resultado: ResultadoCotacaoFrete,
  disponibilidade: DisponibilidadeFreteProduto,
) {
  return adaptarCotacaoLogisticaParaConsultaFrete(
    filtrarResultadoCotacaoFreteDisponivel(resultado, disponibilidade),
  );
}
