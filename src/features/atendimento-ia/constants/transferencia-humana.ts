export const MOTIVOS_TRANSFERENCIA_HUMANA = [
  "solicitacao_cliente",
  "informacao_nao_confirmavel",
  "ferramenta_autorizada_ausente",
  "decisao_ou_acao_humana",
  "falha_conflito_ou_resultado_incerto",
  "insatisfacao_persistente",
  "situacao_sensivel",
] as const;

export const ESTADOS_TRANSFERENCIA_WHATSAPP = [
  "oferecido",
  "recusado",
  "resumo_preparado",
  "aguardando_confirmacao",
  "confirmado",
  "cancelado",
  "link_gerado",
  "whatsapp_aberto",
  "falha_ao_gerar_link",
  "expirado",
] as const;

export const VALIDADE_TRANSFERENCIA_PADRAO_MS = 5 * 60 * 1000;
export const LIMITE_RESUMO_WHATSAPP_CARACTERES = 1800;
export const CANAL_TRANSFERENCIA_INICIAL = "whatsapp" as const;
