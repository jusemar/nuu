import { validarLogisticaProduto } from "@/features/logistica/lib/validar-logistica-produto";

export type ProblemaLogisticaLaquila = {
  codigo:
    | "PESO_AUSENTE"
    | "PESO_INVALIDO"
    | "ALTURA_AUSENTE"
    | "ALTURA_INVALIDA"
    | "LARGURA_AUSENTE"
    | "LARGURA_INVALIDA"
    | "COMPRIMENTO_AUSENTE"
    | "COMPRIMENTO_INVALIDO"
    | "VINCULO_FORNECEDOR_AUSENTE"
    | "CODIGO_FORNECEDOR_AUSENTE"
    | "CONFIGURACAO_LOGISTICA_INVALIDA";
  campo: string;
  mensagemAdmin: string;
};

export function validarLogisticaProdutoLaquila({
  pesoEmGramas,
  alturaEmCm,
  larguraEmCm,
  comprimentoEmCm,
  possuiVinculoFornecedor,
  codigoFornecedor,
  tiposEntregaPermitidos,
}: {
  pesoEmGramas: number | null | undefined;
  alturaEmCm: number | null | undefined;
  larguraEmCm: number | null | undefined;
  comprimentoEmCm: number | null | undefined;
  possuiVinculoFornecedor: boolean;
  codigoFornecedor: string | null | undefined;
  tiposEntregaPermitidos: string[] | null | undefined;
}) {
  const geral = validarLogisticaProduto({
    pesoEmGramas,
    alturaEmCm,
    larguraEmCm,
    comprimentoEmCm,
    tiposEntregaPermitidos,
  });
  const problemas: ProblemaLogisticaLaquila[] = geral.problemas
    .filter(
      (problema) =>
        problema.codigo !== "ORIGEM_ENVIO_AUSENTE" &&
        problema.codigo !== "CONFIGURACAO_TRANSPORTE_INVALIDA",
    )
    .map((problema) => ({
      codigo: problema.codigo as ProblemaLogisticaLaquila["codigo"],
      campo: problema.campo,
      mensagemAdmin: problema.mensagemAdmin,
    }));

  if (!possuiVinculoFornecedor) {
    problemas.push({
      codigo: "VINCULO_FORNECEDOR_AUSENTE",
      campo: "fornecedor",
      mensagemAdmin: "Vínculo ativo com a Laquila não encontrado",
    });
  }
  if (!codigoFornecedor?.trim()) {
    problemas.push({
      codigo: "CODIGO_FORNECEDOR_AUSENTE",
      campo: "codigoFornecedor",
      mensagemAdmin: "Código do fornecedor não informado",
    });
  }
  const tipos = tiposEntregaPermitidos ?? [];
  if (!tipos.includes("supplier") || tipos.includes("own")) {
    problemas.push({
      codigo: "CONFIGURACAO_LOGISTICA_INVALIDA",
      campo: "allowedDeliveryTypes",
      mensagemAdmin:
        "A expedição Laquila deve usar entrega do fornecedor, sem entrega própria",
    });
  }

  return { valido: problemas.length === 0, problemas };
}
