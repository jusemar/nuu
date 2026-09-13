import type { NivelGeograficoEntregaPropria } from "./resolver-hierarquia-entrega-propria";

type PrecoEntregaPropriaPersistido = {
  destinationType: string;
  cityId?: number | null;
  regionId?: number | null;
  bairroId?: number | null;
  cepEspecificoId?: number | null;
};

function traduzirTipoDestino(tipo: string): NivelGeograficoEntregaPropria {
  if (tipo === "cep-especifico") return "cep";
  if (tipo === "bairro" || tipo === "bairro-avulso") return "bairro";
  if (tipo === "region") return "regiao";
  if (tipo === "cidade") return "cidade";

  throw new Error(`Tipo de destino de Entrega Própria inválido: ${tipo}.`);
}

/**
 * Traduz os nomes físicos históricos da tabela de preços para o contrato
 * canônico usado pelo único motor de hierarquia geográfica.
 */
export function adaptarPrecoEntregaPropriaParaHierarquia<
  T extends PrecoEntregaPropriaPersistido,
>(preco: T) {
  return {
    ...preco,
    tipoDestino: traduzirTipoDestino(preco.destinationType),
    cidadeId: preco.cityId,
    regiaoId: preco.regionId,
    bairroId: preco.bairroId,
    cepEspecificoId: preco.cepEspecificoId,
  };
}
