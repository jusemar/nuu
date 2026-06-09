import type {
  ItemEntradaPromocao,
  ItemPromocaoCalculado,
} from "../types/promocoes.types";

export function prepararItensPromocao(
  itens: ItemEntradaPromocao[],
): ItemPromocaoCalculado[] {
  return itens.map((item) => ({
    ...item,
    modalidade: item.modalidade ?? null,
    preco_original: item.precoBaseEmCentavos,
    preco_final: item.precoBaseEmCentavos,
    desconto_aplicado: 0,
    regra_aplicada: null,
    tipo_desconto: null,
    valor_desconto: 0,
    escopo_promocao: null,
    descontoEmCentavos: 0,
    precoFinalEmCentavos: item.precoBaseEmCentavos,
    tipoCampanha: null,
    badgePromocional: null,
    countdownPromocionalDataFim: null,
    promocoesAplicadas: [],
  }));
}
