import type { IdentificadoresGeograficosEntregaPropria } from "./resolver-hierarquia-entrega-propria";

/** Dados mínimos de uma região para decidir se ela vale para o endereço. */
type RegiaoCandidataEntregaPropria = {
  id: number;
  cityId: number;
  isActive: boolean;
};

/** Uma região só participa quando está ativa e pertence à cidade resolvida. */
function regiaoValidaNaCidade<R extends RegiaoCandidataEntregaPropria>(
  regiao: R | null | undefined,
  cidadeId: number,
): R | null {
  return regiao?.isActive && regiao.cityId === cidadeId ? regiao : null;
}

/**
 * Monta os identificadores geográficos (Cidade → Região → Bairro → CEP) de um
 * endereço. É a MESMA regra usada pela cotação pública e pelo Admin, para que
 * as duas telas nunca resolvam agendas diferentes para o mesmo destino.
 *
 * Região: a faixa de CEP tem prioridade; sem faixa válida, vale a região do
 * bairro canônico. Regiões inativas ou de outra cidade são ignoradas, e o
 * destino passa a herdar a cidade.
 */
export function identificarGeografiaEntregaPropria<
  R extends RegiaoCandidataEntregaPropria,
>({
  cidadeId,
  regiaoFaixaCep,
  regiaoBairro,
  bairroId,
  cepEspecificoId,
}: {
  cidadeId: number;
  regiaoFaixaCep?: R | null;
  regiaoBairro?: R | null;
  bairroId?: number | null;
  cepEspecificoId?: number | null;
}): { ids: IdentificadoresGeograficosEntregaPropria; regiao: R | null } {
  const regiao =
    regiaoValidaNaCidade(regiaoFaixaCep, cidadeId) ??
    regiaoValidaNaCidade(regiaoBairro, cidadeId);

  return {
    ids: {
      cidadeId,
      regiaoId: regiao?.id ?? null,
      bairroId: bairroId ?? null,
      cepId: cepEspecificoId ?? null,
    },
    regiao,
  };
}
