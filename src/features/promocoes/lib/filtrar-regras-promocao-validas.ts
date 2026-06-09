import type {
  ContextoCalculoPromocao,
  RegraPromocaoCalculavel,
} from "../types/promocoes.types";

function regraDentroDoPeriodo(
  regra: RegraPromocaoCalculavel,
  dataReferencia: Date,
): boolean {
  if (regra.dataInicio > dataReferencia) {
    return false;
  }

  if (regra.dataFim && regra.dataFim < dataReferencia) {
    return false;
  }

  return true;
}

export function filtrarRegrasPromocaoValidas(
  regras: RegraPromocaoCalculavel[],
  contexto: ContextoCalculoPromocao,
): RegraPromocaoCalculavel[] {
  return regras
    .filter(
      (regra) =>
        regra.status === "ativa" &&
        regraDentroDoPeriodo(regra, contexto.dataReferencia),
    )
    .sort((regraAtual, proximaRegra) => {
      if (proximaRegra.prioridade !== regraAtual.prioridade) {
        return proximaRegra.prioridade - regraAtual.prioridade;
      }

      return (
        regraAtual.dataInicio.getTime() - proximaRegra.dataInicio.getTime()
      );
    });
}
