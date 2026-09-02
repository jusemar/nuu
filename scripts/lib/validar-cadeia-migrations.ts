export const ANCORA_MIGRATIONS = {
  total: 40,
  ultimoIndice: 39,
  ultimaTag: "0039_admin_recuperacao_otp",
  ultimoArquivo: "drizzle/0039_admin_recuperacao_otp.sql",
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

/** Garante que 0034 acrescenta somente a fundação independente do RBAC global. */
export function validarDeltaSnapshotRbacGlobal(
  snapshotAnterior: SnapshotDrizzle,
  snapshotAtual: SnapshotDrizzle,
) {
  if (snapshotAtual.prevId !== snapshotAnterior.id) {
    falhar("Snapshots 0033 e 0034 não estão encadeados.");
  }

  const adicoesEsperadas = {
    tables: [
      "public.administradores",
      "public.administradores_funcoes",
      "public.administradores_permissoes",
      "public.auditorias_administrativas",
      "public.convites_administrativos",
      "public.convites_funcoes",
      "public.convites_permissoes",
      "public.funcoes_administrativas",
      "public.funcoes_permissoes",
      "public.permissoes_administrativas",
    ],
    enums: [
      "public.administrador_status",
      "public.auditoria_administrativa_resultado",
      "public.convite_administrativo_status",
      "public.efeito_permissao_administrador",
      "public.funcao_administrativa_status",
      "public.permissao_administrativa_status",
    ],
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
      falhar(`Delta inesperado do RBAC global para ${grupo}.`);
    }
  }
}

/** Garante que 0035 acrescenta somente o nome necessário ao convite global. */
export function validarDeltaSnapshotConviteAdministrativo(
  snapshotAnterior: SnapshotDrizzle,
  snapshotAtual: SnapshotDrizzle,
) {
  if (snapshotAtual.prevId !== snapshotAnterior.id) {
    falhar("Snapshots 0034 e 0035 não estão encadeados.");
  }

  for (const grupo of [
    "enums",
    "schemas",
    "sequences",
    "roles",
    "policies",
    "views",
  ] as const) {
    if (
      JSON.stringify(snapshotAnterior[grupo] ?? {}) !==
      JSON.stringify(snapshotAtual[grupo] ?? {})
    ) {
      falhar(`Delta inesperado do convite administrativo para ${grupo}.`);
    }
  }

  const tabela = "public.convites_administrativos";
  for (const [nome, definicao] of Object.entries(snapshotAnterior.tables)) {
    if (nome === tabela) continue;
    if (
      JSON.stringify(definicao) !== JSON.stringify(snapshotAtual.tables[nome])
    )
      falhar("0035 alterou tabela fora do convite administrativo.");
  }
  if (
    Object.keys(snapshotAnterior.tables).length !==
    Object.keys(snapshotAtual.tables).length
  )
    falhar("0035 adicionou ou removeu tabela.");

  const anterior = snapshotAnterior.tables[tabela] as {
    columns?: Record<string, unknown>;
  };
  const atual = snapshotAtual.tables[tabela] as {
    columns?: Record<string, unknown>;
  };
  const colunasAnteriores = anterior?.columns ?? {};
  const colunasAtuais = atual?.columns ?? {};
  const adicionadas = Object.keys(colunasAtuais).filter(
    (nome) => !(nome in colunasAnteriores),
  );
  if (
    JSON.stringify(adicionadas) !== JSON.stringify(["nome_destinatario"]) ||
    Object.keys(colunasAtuais).length !==
      Object.keys(colunasAnteriores).length + 1
  ) {
    falhar("0035 não contém somente nome_destinatario.");
  }
  for (const [nome, definicao] of Object.entries(colunasAnteriores)) {
    if (JSON.stringify(definicao) !== JSON.stringify(colunasAtuais[nome]))
      falhar("0035 alterou coluna preexistente do convite.");
  }
}

/** Restringe 0036 às duas tabelas que recebem o isolamento Laquila. */
export function validarDeltaSnapshotAmbientesLaquila(
  snapshotAnterior: SnapshotDrizzle,
  snapshotAtual: SnapshotDrizzle,
) {
  if (snapshotAtual.prevId !== snapshotAnterior.id) {
    falhar("Snapshots 0035 e 0036 não estão encadeados.");
  }

  for (const grupo of [
    "enums",
    "schemas",
    "sequences",
    "roles",
    "policies",
    "views",
  ] as const) {
    if (
      JSON.stringify(snapshotAnterior[grupo] ?? {}) !==
      JSON.stringify(snapshotAtual[grupo] ?? {})
    ) {
      falhar(`Delta inesperado dos ambientes Laquila para ${grupo}.`);
    }
  }

  const tabelasPermitidas = new Set([
    "public.fornecedor_integracoes_api",
    "public.fornecedor_pedido_integracoes",
  ]);
  for (const [nome, definicao] of Object.entries(snapshotAnterior.tables)) {
    if (tabelasPermitidas.has(nome)) continue;
    if (
      JSON.stringify(definicao) !== JSON.stringify(snapshotAtual.tables[nome])
    ) {
      falhar("0036 alterou tabela fora do isolamento Laquila.");
    }
  }
  if (
    Object.keys(snapshotAnterior.tables).length !==
    Object.keys(snapshotAtual.tables).length
  ) {
    falhar("0036 adicionou ou removeu tabela.");
  }

  const pedidoAnterior = snapshotAnterior.tables[
    "public.fornecedor_pedido_integracoes"
  ] as { columns?: Record<string, unknown> };
  const pedidoAtual = snapshotAtual.tables[
    "public.fornecedor_pedido_integracoes"
  ] as { columns?: Record<string, unknown> };
  const colunasAnteriores = pedidoAnterior.columns ?? {};
  const colunasAtuais = pedidoAtual.columns ?? {};
  const adicionadas = Object.keys(colunasAtuais).filter(
    (nome) => !(nome in colunasAnteriores),
  );
  if (JSON.stringify(adicionadas) !== JSON.stringify(["ambiente"])) {
    falhar("0036 não adicionou somente ambiente ao pedido fornecedor.");
  }
  for (const [nome, definicao] of Object.entries(colunasAnteriores)) {
    if (JSON.stringify(definicao) !== JSON.stringify(colunasAtuais[nome])) {
      falhar("0036 alterou coluna preexistente do pedido fornecedor.");
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
