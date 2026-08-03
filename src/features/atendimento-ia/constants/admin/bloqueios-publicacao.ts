export const BLOQUEIOS_CRITICOS_PUBLICACAO_ADMIN = [
  "seguranca",
  "privacidade",
  "dados_pessoais_expostos",
  "informacao_institucional_incorreta",
  "dado_dinamico_inventado",
  "conflito_fontes",
  "consulta_real_obrigatoria_ausente",
  "uso_indevido_ferramenta_protegida",
  "regressao_critica",
  "transferencia_obrigatoria_ausente",
] as const;

export const DADOS_DINAMICOS_NUNCA_INSTITUCIONAIS_ADMIN = [
  "preco",
  "estoque",
  "promocao",
  "entrega",
  "pedido",
  "politica_nao_publicada",
] as const;

export const BLOQUEIOS_QUE_SEMPRE_IMPEDEM_PUBLICACAO_ADMIN = new Set<string>(
  BLOQUEIOS_CRITICOS_PUBLICACAO_ADMIN,
);
