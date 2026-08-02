export const LIMITE_TOKENS_CONTEXTO_PADRAO = 8_000;
export const LIMIAR_PRIMEIRO_RESUMO_TOKENS_PADRAO = 6_000;
export const LIMIAR_ATUALIZACAO_RESUMO_TOKENS_PADRAO = 4_000;
export const EXPIRACAO_CONTEXTO_VISITANTE_DIAS_PADRAO = 7;
export const EXPIRACAO_CONTEXTO_AUTENTICADO_DIAS_PADRAO = 30;
export const EXPIRACAO_MEMORIA_DIAS_PADRAO = 30;

export const CATEGORIAS_MEMORIA_AUTORIZADAS = [
  "tipo_produto_procurado",
  "caracteristicas_desejadas",
  "faixa_preco",
  "preferencias_compra",
  "restricoes_entrega",
  "produtos_considerados",
  "decisao_pendente",
  "objecoes_comerciais",
  "preferencia_atendimento",
  "etapa_intencao_compra",
] as const;

export const VERSAO_AVISO_PRIVACIDADE_CHAT = "atendente-ia-contexto-v1";
export const VERSAO_TEXTO_AUTORIZACAO_MEMORIA = "atendente-ia-memoria-30d-v1";
