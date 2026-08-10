export type SituacaoConciliacaoFornecedor = "pronto" | "pendencia" | "alerta";

/**
 * Fonte testável da semântica reproduzida pela agregação SQL da Conciliação.
 * Os parâmetros já são fatos normalizados; extração de JSON continua na query
 * e nos adaptadores existentes.
 */
export function classificarSituacaoConciliacaoFornecedor({
  atualizacao,
  possuiPendencia,
  possuiAlertaNovo,
  status,
}: {
  atualizacao: boolean;
  possuiPendencia: boolean;
  possuiAlertaNovo: boolean;
  status: string;
}): SituacaoConciliacaoFornecedor {
  if (possuiPendencia) return "pendencia";
  if (status === "pronto_para_publicar") return "pronto";
  if (!atualizacao && !possuiAlertaNovo) return "pronto";
  return "alerta";
}
