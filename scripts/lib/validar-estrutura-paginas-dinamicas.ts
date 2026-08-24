const TABELAS_ESPERADAS = [
  "grupo_paginas",
  "grupos_navegacao",
  "paginas_dinamicas",
] as const;

const INDICES_ESPERADOS = [
  "grupo_paginas_grupo_ordem_idx",
  "grupo_paginas_grupo_pagina_unique",
  "grupo_paginas_pagina_idx",
  "grupos_navegacao_ativo_idx",
  "grupos_navegacao_identificador_unique",
  "grupos_navegacao_local_ordem_idx",
  "paginas_dinamicas_slug_unique",
  "paginas_dinamicas_status_idx",
  "paginas_dinamicas_updated_at_idx",
] as const;

const RESTRICOES_ESPERADAS = [
  "grupo_paginas_grupo_id_grupos_navegacao_id_fk",
  "grupo_paginas_pagina_id_paginas_dinamicas_id_fk",
  "grupo_paginas_pkey",
  "grupos_navegacao_pkey",
  "paginas_dinamicas_pkey",
] as const;

/**
 * O driver `pg` pode devolver arrays de tipos internos do catálogo como literal
 * PostgreSQL. Aceitamos ambos os formatos sem alterar os valores esperados.
 */
export function normalizarValoresEnumPostgres(valor: unknown): string[] {
  if (Array.isArray(valor) && valor.every((item) => typeof item === "string")) {
    return valor;
  }
  if (
    typeof valor !== "string" ||
    !valor.startsWith("{") ||
    !valor.endsWith("}")
  ) {
    throw new Error("Formato de valores do enum PostgreSQL inesperado.");
  }
  const conteudo = valor.slice(1, -1);
  return conteudo ? conteudo.split(",") : [];
}

export function validarEstruturaPaginasDinamicas(dados: {
  tabelas: string[];
  enums: Array<{ nome: string; valores: unknown }>;
  indices: string[];
  restricoes: string[];
}) {
  const iguais = (recebidos: string[], esperados: readonly string[]) =>
    JSON.stringify([...recebidos].sort()) ===
    JSON.stringify([...esperados].sort());

  if (!iguais(dados.tabelas, TABELAS_ESPERADAS)) {
    throw new Error("Tabelas de Páginas Dinâmicas divergentes.");
  }
  const enums = new Map(
    dados.enums.map((item) => [
      item.nome,
      normalizarValoresEnumPostgres(item.valores),
    ]),
  );
  if (
    !iguais(enums.get("grupo_navegacao_local") ?? [], ["rodape"]) ||
    !iguais(enums.get("pagina_dinamica_status") ?? [], [
      "rascunho",
      "publicada",
      "arquivada",
    ])
  ) {
    throw new Error("Enums de Páginas Dinâmicas divergentes.");
  }
  if (!INDICES_ESPERADOS.every((nome) => dados.indices.includes(nome))) {
    throw new Error("Índices de Páginas Dinâmicas incompletos.");
  }
  if (!RESTRICOES_ESPERADAS.every((nome) => dados.restricoes.includes(nome))) {
    throw new Error("Restrições de Páginas Dinâmicas incompletas.");
  }
}
