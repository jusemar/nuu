import { filtrarResultadoCotacaoFreteDisponivel } from "@/features/logistica/lib/disponibilidade/filtrar-resultado-cotacao-disponivel";
import type { ResultadoCotacaoFrete } from "@/features/logistica/types/contratos-frete";
import type { DisponibilidadeFreteProduto } from "@/features/logistica/types/disponibilidade-frete";

import { adaptarCotacaoLogisticaParaConsultaFrete } from "./adaptar-cotacao-logistica-para-consulta-frete";

export function adaptarCotacaoDisponivelParaConsultaFrete(
  resultado: ResultadoCotacaoFrete,
  disponibilidade: DisponibilidadeFreteProduto,
) {
  return adaptarCotacaoLogisticaParaConsultaFrete(
    filtrarResultadoCotacaoFreteDisponivel(resultado, disponibilidade),
  );
}
