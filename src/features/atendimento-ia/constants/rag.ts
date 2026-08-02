export const MODELO_EMBEDDING_RAG_PADRAO = "text-embedding-3-small";
export const DIMENSAO_EMBEDDING_RAG_PADRAO = 1_536;
export const LIMITE_FRAGMENTO_RAG_PADRAO = 600;
export const SOBREPOSICAO_FRAGMENTO_RAG_PADRAO = 100;
export const PESO_SEMANTICO_RAG_PADRAO = 0.7;
export const PESO_TEXTUAL_RAG_PADRAO = 0.3;
export const CANDIDATOS_RAG_PADRAO = 5;
export const RESULTADOS_RAG_PADRAO = 3;
export const RELEVANCIA_MINIMA_RAG_PADRAO = 0.7;

export const CATEGORIAS_INSTITUCIONAIS_AUTORIZADAS = [
  "informacoes_institucionais_atendimento",
  "trocas_devolucoes",
  "garantias",
  "formas_pagamento",
  "entrega",
  "retirada",
  "privacidade_seguranca",
  "perguntas_frequentes",
] as const;

export const PADROES_CONTEUDO_PROIBIDO_RAG = [
  /\b(?:senha|password|token|api[_ -]?key|chave secreta)\b/iu,
  /\b(?:custo|margem|fornecedor)\b/iu,
  /\b(?:cart[aã]o|conta banc[aá]ria|cpf|cnpj)\b/iu,
] as const;

export const PADROES_INSTRUCAO_NAO_EXECUTAVEL_RAG = [
  /ignore (?:todas |as )?(?:instru[cç][oõ]es|regras)/iu,
  /(?:revele|mostre|retorne).*(?:prompt|instru[cç][oõ]es internas|segredo)/iu,
  /(?:execute|chame|acione).*(?:ferramenta|fun[cç][aã]o|comando)/iu,
] as const;
