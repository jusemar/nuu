import { GARANTIAS_RESTAURACAO } from "./politica-restauracao";

export function criarCandidatoRestauracao<TConteudo>(entrada: {
  conteudo: TConteudo;
  hash: string;
  justificativa: string;
  proximoNumero: number;
  versaoAnteriorId: string | null;
  versaoOrigemId: string;
}) {
  return {
    conteudo: entrada.conteudo,
    estado: GARANTIAS_RESTAURACAO.estadoInicial,
    hash: entrada.hash,
    motivoAlteracao: entrada.justificativa,
    proximoNumero: entrada.proximoNumero,
    restauradaDeVersaoId: entrada.versaoOrigemId,
    resumoAlteracao: `Restauração da versão histórica ${entrada.versaoOrigemId}.`,
    versaoAnteriorId: entrada.versaoAnteriorId,
  } as const;
}
