export const VERSAO_FERRAMENTAS_PUBLICAS = "1.0.0";

export const NOMES_FERRAMENTAS_PUBLICAS = [
  "buscar_produtos_publicos",
  "consultar_produto_publico",
  "consultar_precos_publicos",
  "consultar_estoque_publico",
  "consultar_promocoes_publicas",
  "consultar_logistica_publica",
] as const;

export const MAXIMO_CHAMADAS_FERRAMENTAS_POR_EXECUCAO = 6;
export const TIMEOUT_FERRAMENTA_PUBLICA_EM_MS = 15_000;
