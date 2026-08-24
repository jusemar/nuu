export const ANCORA_MIGRATIONS = {
  total: 34,
  ultimoIndice: 33,
  ultimaTag: "0033_confirmacao_email_cliente",
  ultimoArquivo: "drizzle/0033_confirmacao_email_cliente.sql",
} as const;

export type MigrationLocalValidacao = {
  hash: string;
  folderMillis: number;
};

export type EntradaJournalValidacao = {
  idx: number;
  tag: string;
  when: number;
};

export type MigrationAplicadaValidacao = {
  hash: string;
  createdAt: number;
};

export type IdentidadeBancoValidacao = {
  banco: string;
  usuario: string;
  projetoId: string;
  branchId: string;
  endpointId: string;
};

export function validarIdentidadeBanco(
  identidade: IdentidadeBancoValidacao,
  esperado: IdentidadeBancoValidacao,
  producao: Pick<IdentidadeBancoValidacao, "branchId" | "endpointId">,
) {
  for (const campo of [
    "banco",
    "usuario",
    "projetoId",
    "branchId",
    "endpointId",
  ] as const) {
    if (identidade[campo] !== esperado[campo]) {
      falhar("A identidade do banco não corresponde ao alvo autorizado.");
    }
  }
  if (
    identidade.branchId === producao.branchId ||
    identidade.endpointId === producao.endpointId
  ) {
    falhar("Produção foi recusada pela guarda de identidade.");
  }
}

export type SnapshotDrizzle = {
  id: string;
  prevId: string;
  tables: Record<string, unknown>;
  enums: Record<string, unknown>;
  schemas: Record<string, unknown>;
  sequences: Record<string, unknown>;
  roles: Record<string, unknown>;
  policies: Record<string, unknown>;
  views: Record<string, unknown>;
};

function falhar(mensagem: string): never {
  throw new Error(mensagem);
}

/**
 * Valida toda a sequência contra uma âncora revisada explicitamente.
 * O journal sozinho nunca autoriza uma migration nova: quantidade e ponta da
 * cadeia continuam fixas neste código e precisam de revisão a cada avanço.
 */
export function validarSequenciaLocal(
  migrations: MigrationLocalValidacao[],
  entradas: EntradaJournalValidacao[],
) {
  if (
    migrations.length !== ANCORA_MIGRATIONS.total ||
    entradas.length !== ANCORA_MIGRATIONS.total
  ) {
    falhar("Quantidade de migrations diferente da âncora autorizada.");
  }

  const tags = new Set<string>();
  for (let indice = 0; indice < ANCORA_MIGRATIONS.total; indice += 1) {
    const entrada = entradas[indice];
    const migration = migrations[indice];
    const prefixoEsperado = indice.toString().padStart(4, "0");

    if (!entrada || !migration) falhar("Migration ausente na sequência local.");
    if (
      entrada.idx !== indice ||
      !entrada.tag.startsWith(`${prefixoEsperado}_`)
    ) {
      falhar("Índice ou prefixo de migration fora de sequência.");
    }
    if (tags.has(entrada.tag)) falhar("Tag de migration duplicada.");
    if (entrada.when !== migration.folderMillis) {
      falhar("Journal e arquivo SQL divergem na sequência.");
    }
    tags.add(entrada.tag);
  }

  const ultima = entradas.at(-1);
  if (
    ultima?.idx !== ANCORA_MIGRATIONS.ultimoIndice ||
    ultima.tag !== ANCORA_MIGRATIONS.ultimaTag
  ) {
    falhar("Última migration diferente da âncora autorizada.");
  }
}

/** Confirma que 0029 só acrescenta as estruturas autorizadas do novo domínio. */
export function validarDeltaSnapshots(
  snapshotAnterior: SnapshotDrizzle,
  snapshotAtual: SnapshotDrizzle,
) {
  if (snapshotAtual.prevId !== snapshotAnterior.id) {
    falhar("Snapshots 0028 e 0029 não estão encadeados.");
  }

  const adicoesEsperadas = {
    tables: [
      "public.grupo_paginas",
      "public.grupos_navegacao",
      "public.paginas_dinamicas",
    ],
    enums: ["public.grupo_navegacao_local", "public.pagina_dinamica_status"],
  } as const;

  for (const grupo of [
    "tables",
    "enums",
    "schemas",
    "sequences",
    "roles",
    "policies",
    "views",
  ] as const) {
    const anterior = snapshotAnterior[grupo] ?? {};
    const atual = snapshotAtual[grupo] ?? {};
    const adicionadas = Object.keys(atual).filter(
      (chave) => !(chave in anterior),
    );
    const removidas = Object.keys(anterior).filter(
      (chave) => !(chave in atual),
    );
    const alteradas = Object.keys(anterior).filter(
      (chave) =>
        chave in atual &&
        JSON.stringify(anterior[chave]) !== JSON.stringify(atual[chave]),
    );
    const esperadas =
      grupo === "tables" || grupo === "enums"
        ? [...adicoesEsperadas[grupo]]
        : [];

    if (
      JSON.stringify(adicionadas.sort()) !== JSON.stringify(esperadas.sort()) ||
      removidas.length > 0 ||
      alteradas.length > 0
    ) {
      falhar(`Delta inesperado nos snapshots para ${grupo}.`);
    }
  }
}

/** O banco precisa conter exatamente um prefixo íntegro da cadeia local. */
export function validarHistoricoAplicado(
  aplicadas: MigrationAplicadaValidacao[],
  migrations: MigrationLocalValidacao[],
) {
  if (aplicadas.length > migrations.length) {
    falhar("O banco possui mais migrations que a cadeia local autorizada.");
  }
  for (let indice = 0; indice < aplicadas.length; indice += 1) {
    const aplicada = aplicadas[indice];
    const local = migrations[indice];
    if (
      !aplicada ||
      !local ||
      aplicada.hash !== local.hash ||
      aplicada.createdAt !== local.folderMillis
    ) {
      falhar("Hash ou posição do histórico aplicado diverge da cadeia local.");
    }
  }
}
