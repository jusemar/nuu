export const NOTAS_AVALIACAO_ADMIN = [1, 2, 3, 4, 5] as const;

export const DECISOES_AVALIACAO_ADMIN = [
  "aprovado",
  "precisa_melhorar",
  "reprovado",
] as const;

export const CLASSIFICACOES_PROBLEMA_ADMIN = [
  "resposta_incorreta",
  "resposta_sem_fonte",
  "fonte_desatualizada",
  "conflito_fontes",
  "lacuna_conhecimento",
  "ferramenta_ausente",
  "ferramenta_falhou",
  "consulta_real_omitida",
  "fora_escopo_incorreto",
  "transferencia_prematura",
  "transferencia_ausente",
  "problema_tom",
  "problema_clareza",
  "risco_seguranca",
  "exposicao_dados",
  "outro",
] as const;

export const CRITERIOS_AVALIACAO_ADMIN = [
  "correcao",
  "fidelidade_fontes",
  "utilidade",
  "clareza",
  "seguranca",
  "tom",
  "tratamento_escopo",
  "uso_ferramentas",
  "transferencia",
] as const;

export const VERSAO_RUBRICA_AVALIACAO_ADMIN = "atendimento-ia-rubrica-v1";
