import type { ResultadoConsultaEntregaPropriaLoja } from "../../actions/consultar-entrega-propria-loja";

export function obterPrevisaoEntregaProdutoCard(
  resultado: ResultadoConsultaEntregaPropriaLoja,
) {
  return resultado.disponivel && resultado.promessaEntrega
    ? resultado.promessaEntrega.texto
    : null;
}
