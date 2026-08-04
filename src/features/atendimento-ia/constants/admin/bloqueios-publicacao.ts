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

export const BLOQUEIOS_ELEGIBILIDADE_PUBLICACAO = [
  "risco_seguranca",
  "exposicao_dados_pessoais",
  "violacao_privacidade",
  "informacao_institucional_incorreta",
  "preco_inventado",
  "estoque_inventado",
  "promocao_inventada",
  "politica_inventada",
  "conflito_fontes",
  "fonte_obrigatoria_ausente",
  "consulta_real_obrigatoria_omitida",
  "uso_indevido_ferramenta_protegida",
  "efeito_real_tentado_laboratorio",
  "regressao_caso_critico",
  "transferencia_obrigatoria_ausente",
  "transferencia_indevida_cenario_critico",
  "fora_escopo_critico_incorreto",
  "revisao_obrigatoria_ausente",
  "revisao_reprovada",
  "hash_aprovado_divergente",
  "resultado_laboratorio_obsoleto",
  "caso_critico_obrigatorio_ausente",
  "conjunto_obrigatorio_incompleto",
  "versao_modificada_apos_aprovacao",
  "aprovador_sem_capacidade",
  "autoaprovacao_proibida",
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
