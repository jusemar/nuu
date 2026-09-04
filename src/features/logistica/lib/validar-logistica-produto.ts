export type ProblemaLogisticaProduto = {
  codigo:
    | "PESO_AUSENTE"
    | "PESO_INVALIDO"
    | "ALTURA_AUSENTE"
    | "ALTURA_INVALIDA"
    | "LARGURA_AUSENTE"
    | "LARGURA_INVALIDA"
    | "COMPRIMENTO_AUSENTE"
    | "COMPRIMENTO_INVALIDO"
    | "ORIGEM_ENVIO_AUSENTE"
    | "CONFIGURACAO_TRANSPORTE_INVALIDA";
  campo: string;
  mensagemAdmin: string;
};

/** Fonte única dos requisitos físicos para qualquer envio calculável. */
export function validarLogisticaProduto({
  pesoEmGramas,
  alturaEmCm,
  larguraEmCm,
  comprimentoEmCm,
  tiposEntregaPermitidos,
  permiteSomenteRetirada = false,
}: {
  pesoEmGramas: number | null | undefined;
  alturaEmCm: number | null | undefined;
  larguraEmCm: number | null | undefined;
  comprimentoEmCm: number | null | undefined;
  tiposEntregaPermitidos: string[] | null | undefined;
  /**
   * Retirada local sem expedição não depende de pacote nem transportadora.
   * O valor só é verdadeiro quando a retirada é uma modalidade real do
   * produto e não existe nenhuma origem de envio configurada.
   */
  permiteSomenteRetirada?: boolean;
}) {
  const problemas: ProblemaLogisticaProduto[] = [];
  const tipos = tiposEntregaPermitidos ?? [];
  const produtoSomenteRetirada = permiteSomenteRetirada && tipos.length === 0;
  const validar = (
    valor: number | null | undefined,
    campo: "peso" | "altura" | "largura" | "comprimento",
    ausente: ProblemaLogisticaProduto["codigo"],
    invalido: ProblemaLogisticaProduto["codigo"],
    rotulo: string,
  ) => {
    if (valor === null || valor === undefined)
      problemas.push({
        codigo: ausente,
        campo,
        mensagemAdmin: `${rotulo} não informado`,
      });
    else if (!Number.isFinite(valor) || valor <= 0)
      problemas.push({
        codigo: invalido,
        campo,
        mensagemAdmin: `${rotulo} inválido`,
      });
  };
  if (!produtoSomenteRetirada) {
    validar(pesoEmGramas, "peso", "PESO_AUSENTE", "PESO_INVALIDO", "Peso");
    validar(
      alturaEmCm,
      "altura",
      "ALTURA_AUSENTE",
      "ALTURA_INVALIDA",
      "Altura",
    );
    validar(
      larguraEmCm,
      "largura",
      "LARGURA_AUSENTE",
      "LARGURA_INVALIDA",
      "Largura",
    );
    validar(
      comprimentoEmCm,
      "comprimento",
      "COMPRIMENTO_AUSENTE",
      "COMPRIMENTO_INVALIDO",
      "Comprimento",
    );
  }
  if (!tipos.length && !produtoSomenteRetirada)
    problemas.push({
      codigo: "ORIGEM_ENVIO_AUSENTE",
      campo: "allowedDeliveryTypes",
      mensagemAdmin: "Origem de envio não configurada",
    });
  else if (tipos.some((tipo) => !["own", "supplier", "carrier"].includes(tipo)))
    problemas.push({
      codigo: "CONFIGURACAO_TRANSPORTE_INVALIDA",
      campo: "allowedDeliveryTypes",
      mensagemAdmin: "Configuração de transporte inválida",
    });
  return { valido: problemas.length === 0, problemas };
}
