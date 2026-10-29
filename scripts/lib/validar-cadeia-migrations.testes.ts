import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  ANCORA_MIGRATIONS,
  type EntradaJournalValidacao,
  type MigrationLocalValidacao,
  type SnapshotDrizzle,
  validarDeltaSnapshotAlocacoesEstoque,
  validarDeltaSnapshotAmbientesLaquila,
  validarDeltaSnapshotColunasLegadasEntregaPropria,
  validarDeltaSnapshotConsolidacaoEntregaPropria,
  validarDeltaSnapshotConviteAdministrativo,
  validarDeltaSnapshotDisponibilidadeFreteExterno,
  validarDeltaSnapshotEntregaPropriaCategoria,
  validarDeltaSnapshotIntegridadeEntregaPropria,
  validarDeltaSnapshotOperacaoRepresentantes,
  validarDeltaSnapshotPagamentoSemRecursos,
  validarDeltaSnapshotRbacGlobal,
  validarDeltaSnapshotRepresentantes,
  validarDeltaSnapshots,
  validarDeltaSnapshotSequenceNumeroPedido,
  validarDeltaSnapshotTabelasLegadasEntregaPropria,
  validarDeltaSnapshotVinculoBairroAvulsoEntregaPropria,
  validarHistoricoAplicado,
  validarIdentidadeBanco,
  validarSequenciaLocal,
  validarSnapshotMigracaoDadosEntregaPropria,
  validarSnapshotPreparacaoColunasLegadasEntregaPropria,
  validarSnapshotVerificacaoLimpezaEntregaPropria,
} from "./validar-cadeia-migrations";

function cadeiaValida() {
  const entradas: EntradaJournalValidacao[] = Array.from(
    { length: ANCORA_MIGRATIONS.total },
    (_, idx) => ({
      idx,
      tag: `${idx.toString().padStart(4, "0")}_migration_${idx}`,
      when: 1_000 + idx,
    }),
  );
  entradas[ANCORA_MIGRATIONS.ultimoIndice]!.tag = ANCORA_MIGRATIONS.ultimaTag;
  const migrations: MigrationLocalValidacao[] = entradas.map((entrada) => ({
    hash: `hash-${entrada.idx}`,
    folderMillis: entrada.when,
  }));
  return { entradas, migrations };
}

test("aceita somente a cadeia legítima ancorada na migration atual", () => {
  const { entradas, migrations } = cadeiaValida();
  assert.doesNotThrow(() => validarSequenciaLocal(migrations, entradas));
});

function lerSnapshot(numero: string): SnapshotDrizzle {
  return JSON.parse(
    readFileSync(`drizzle/meta/${numero}_snapshot.json`, "utf8"),
  ) as SnapshotDrizzle;
}

test("0055 só adiciona alocação de estoque por pedido e variante", () => {
  const anterior = lerSnapshot("0054");
  const atual = lerSnapshot("0055");
  assert.doesNotThrow(() =>
    validarDeltaSnapshotAlocacoesEstoque(anterior, atual),
  );
  const adulterado = structuredClone(atual);
  adulterado.tables["public.product_variant"] = { alteracaoIndevida: true };
  assert.throws(() =>
    validarDeltaSnapshotAlocacoesEstoque(anterior, adulterado),
  );
});

test("0056 só acrescenta o bloqueio operacional para dinheiro recebido sem recursos", () => {
  const anterior = lerSnapshot("0055");
  const atual = lerSnapshot("0056");
  assert.doesNotThrow(() =>
    validarDeltaSnapshotPagamentoSemRecursos(anterior, atual),
  );
  const adulterado = structuredClone(atual);
  adulterado.enums["public.checkout_pedido_status"] = {
    ...(adulterado.enums["public.checkout_pedido_status"] as Record<
      string,
      unknown
    >),
    values: ["pending", "invalido"],
  };
  assert.throws(() =>
    validarDeltaSnapshotPagamentoSemRecursos(anterior, adulterado),
  );
});

test("restringe a consolidação da Entrega Própria aos deltas revisados", () => {
  const snapshot43 = lerSnapshot("0043");
  const snapshot44 = lerSnapshot("0044");
  const snapshot45 = lerSnapshot("0045");
  const snapshot46 = lerSnapshot("0046");

  assert.doesNotThrow(() =>
    validarDeltaSnapshotConsolidacaoEntregaPropria(snapshot43, snapshot44),
  );
  assert.doesNotThrow(() =>
    validarSnapshotMigracaoDadosEntregaPropria(snapshot44, snapshot45),
  );
  assert.doesNotThrow(() =>
    validarDeltaSnapshotIntegridadeEntregaPropria(snapshot45, snapshot46),
  );

  const adulterado = structuredClone(snapshot46);
  adulterado.tables["public.product"] = { alteracaoIndevida: true };
  assert.throws(() =>
    validarDeltaSnapshotIntegridadeEntregaPropria(snapshot45, adulterado),
  );
});

test("limpeza da Entrega Própria remove somente o legado revisado", () => {
  const snapshot46 = lerSnapshot("0046");
  const snapshot47 = lerSnapshot("0047");
  const snapshot48 = lerSnapshot("0048");
  const snapshot49 = lerSnapshot("0049");
  const snapshot50 = lerSnapshot("0050");
  const snapshot51 = lerSnapshot("0051");

  assert.doesNotThrow(() =>
    validarSnapshotVerificacaoLimpezaEntregaPropria(snapshot46, snapshot47),
  );
  assert.doesNotThrow(() =>
    validarSnapshotPreparacaoColunasLegadasEntregaPropria(
      snapshot49,
      snapshot50,
    ),
  );
  // 0050 é custom: qualquer alteração de schema no snapshot é recusada.
  const preparacaoAdulterada = structuredClone(snapshot50);
  delete preparacaoAdulterada.tables["public.shipping_regions"];
  assert.throws(() =>
    validarSnapshotPreparacaoColunasLegadasEntregaPropria(
      snapshot49,
      preparacaoAdulterada,
    ),
  );
  assert.doesNotThrow(() =>
    validarDeltaSnapshotVinculoBairroAvulsoEntregaPropria(
      snapshot47,
      snapshot48,
    ),
  );
  assert.doesNotThrow(() =>
    validarDeltaSnapshotTabelasLegadasEntregaPropria(snapshot48, snapshot49),
  );
  assert.doesNotThrow(() =>
    validarDeltaSnapshotColunasLegadasEntregaPropria(snapshot50, snapshot51),
  );

  // As sete colunas legadas não existem mais no snapshot final.
  const colunas = (tabela: string) =>
    Object.keys(
      (snapshot51.tables[tabela] as { columns: Record<string, unknown> })
        .columns,
    );
  for (const coluna of [
    "base_shipping_price",
    "agenda_ativa",
    "horario_corte",
    "periodo_entrega_inicio",
    "periodo_entrega_fim",
  ]) {
    assert.equal(colunas("public.shipping_regions").includes(coluna), false);
  }
  assert.equal(
    colunas("public.ceps_especificos").includes("shipping_price"),
    false,
  );
  assert.equal(
    colunas("public.product_own_delivery_prices").includes("bairro_avulso_id"),
    false,
  );
  // O preço ativo do Produto permanece.
  assert.equal(
    colunas("public.product_own_delivery_prices").includes("shipping_price"),
    true,
  );

  // A remoção de colunas não pode tocar outras tabelas.
  const colunasAdulteradas = structuredClone(snapshot51);
  colunasAdulteradas.tables["public.product"] = { alteracaoIndevida: true };
  assert.throws(() =>
    validarDeltaSnapshotColunasLegadasEntregaPropria(
      snapshot50,
      colunasAdulteradas,
    ),
  );

  // As estruturas do motor único continuam no snapshot final.
  for (const tabela of [
    "public.agendas_geograficas_entrega_propria",
    "public.bairros_entrega_propria",
    "public.product_own_delivery_prices",
    "public.shipping_regions",
    "public.ceps_especificos",
    "public.shipping_pending_neighborhoods",
  ]) {
    assert.ok(tabela in snapshot51.tables, tabela);
  }

  // Remover uma tabela ativa junto com o legado precisa ser recusado.
  const semAgenda = structuredClone(snapshot49);
  delete semAgenda.tables["public.agendas_geograficas_entrega_propria"];
  assert.throws(() =>
    validarDeltaSnapshotTabelasLegadasEntregaPropria(snapshot48, semAgenda),
  );

  // 0048 só pode alterar a tabela de preços; qualquer outra tabela é recusada.
  const adulterado = structuredClone(snapshot48);
  adulterado.tables["public.product"] = { alteracaoIndevida: true };
  assert.throws(() =>
    validarDeltaSnapshotVinculoBairroAvulsoEntregaPropria(
      snapshot47,
      adulterado,
    ),
  );

  // 0048 não pode antecipar a remoção das tabelas legadas.
  assert.throws(() =>
    validarDeltaSnapshotVinculoBairroAvulsoEntregaPropria(
      snapshot47,
      snapshot49,
    ),
  );
});

test("0052 só adiciona a disponibilidade do Frete Externo", () => {
  const snapshot51 = lerSnapshot("0051");
  const snapshot52 = lerSnapshot("0052");
  assert.doesNotThrow(() =>
    validarDeltaSnapshotDisponibilidadeFreteExterno(snapshot51, snapshot52),
  );

  const colunas = (tabela: string) =>
    (
      snapshot52.tables[tabela] as {
        columns: Record<string, { default?: string; notNull?: boolean }>;
      }
    ).columns["disponibilidade_frete_externo"];
  for (const tabela of ["public.product", "public.category"]) {
    assert.equal(colunas(tabela)?.notNull, true);
    // Padrão "herdar": registros antigos continuam com Frete Externo ativado.
    assert.equal(colunas(tabela)?.default, "'herdar'");
  }

  const adulterado = structuredClone(snapshot52);
  adulterado.tables["public.order"] = { alteracaoIndevida: true };
  assert.throws(() =>
    validarDeltaSnapshotDisponibilidadeFreteExterno(snapshot51, adulterado),
  );
});

test("0053 só adiciona a Entrega Própria por Categoria (aditiva)", () => {
  const snapshot52 = lerSnapshot("0052");
  const snapshot53 = lerSnapshot("0053");
  assert.doesNotThrow(() =>
    validarDeltaSnapshotEntregaPropriaCategoria(snapshot52, snapshot53),
  );

  const coluna = (tabela: string) =>
    (
      snapshot53.tables[tabela] as {
        columns: Record<string, { default?: string; notNull?: boolean }>;
      }
    ).columns["disponibilidade_entrega_propria"];
  // Categoria nasce "herdar"; no produto a coluna é opcional: nulo mantém o
  // antigo "Permitir Entrega Própria" até o Admin salvar o novo modo.
  assert.equal(coluna("public.category")?.notNull, true);
  assert.equal(coluna("public.category")?.default, "'herdar'");
  assert.equal(coluna("public.product")?.notNull, false);
  assert.equal(coluna("public.product")?.default, undefined);

  const adulterado = structuredClone(snapshot53);
  delete adulterado.tables["public.product_own_delivery_prices"];
  assert.throws(() =>
    validarDeltaSnapshotEntregaPropriaCategoria(snapshot52, adulterado),
  );
});

test("0054 só adiciona a sequence pública de pedidos", () => {
  const snapshot53 = lerSnapshot("0053");
  const snapshot54 = lerSnapshot("0054");
  assert.doesNotThrow(() =>
    validarDeltaSnapshotSequenceNumeroPedido(snapshot53, snapshot54),
  );

  const sequence = snapshot54.sequences[
    "public.checkout_pedidos_numero_pedido_seq"
  ] as {
    increment?: string;
    startWith?: string;
    minValue?: string;
    maxValue?: string;
    cache?: string;
    cycle?: boolean;
  };
  assert.deepEqual(sequence, {
    name: "checkout_pedidos_numero_pedido_seq",
    schema: "public",
    increment: "1",
    startWith: "1001",
    minValue: "1",
    maxValue: "9223372036854775807",
    cache: "1",
    cycle: false,
  });

  const adulterado = structuredClone(snapshot54);
  adulterado.tables["public.checkout_pedidos"] = { alteracaoIndevida: true };
  assert.throws(() =>
    validarDeltaSnapshotSequenceNumeroPedido(snapshot53, adulterado),
  );
});

test("0035 acrescenta somente o nome do destinatário ao convite", () => {
  const anterior: SnapshotDrizzle = {
    id: "snapshot-34",
    prevId: "snapshot-33",
    tables: {
      "public.convites_administrativos": {
        columns: { id: { name: "id", notNull: true } },
      },
      "public.user": { columns: { id: { name: "id" } } },
    },
    enums: {},
    schemas: {},
    sequences: {},
    roles: {},
    policies: {},
    views: {},
  };
  const atual = structuredClone(anterior);
  atual.id = "snapshot-35";
  atual.prevId = anterior.id;
  const convite = atual.tables["public.convites_administrativos"] as {
    columns: Record<string, unknown>;
  };
  convite.columns.nome_destinatario = {
    name: "nome_destinatario",
    notNull: true,
  };

  assert.doesNotThrow(() =>
    validarDeltaSnapshotConviteAdministrativo(anterior, atual),
  );
  atual.tables["public.user"] = { alterada: true };
  assert.throws(() =>
    validarDeltaSnapshotConviteAdministrativo(anterior, atual),
  );
});

test("0036 altera somente as estruturas de ambiente Laquila", () => {
  const anterior: SnapshotDrizzle = {
    id: "snapshot-35",
    prevId: "snapshot-34",
    tables: {
      "public.fornecedor_integracoes_api": { columns: { id: {} } },
      "public.fornecedor_pedido_integracoes": { columns: { id: {} } },
      "public.user": { columns: { id: {} } },
    },
    enums: {},
    schemas: {},
    sequences: {},
    roles: {},
    policies: {},
    views: {},
  };
  const atual = structuredClone(anterior);
  atual.id = "snapshot-36";
  atual.prevId = anterior.id;
  const pedido = atual.tables["public.fornecedor_pedido_integracoes"] as {
    columns: Record<string, unknown>;
  };
  pedido.columns.ambiente = { name: "ambiente", notNull: true };

  assert.doesNotThrow(() =>
    validarDeltaSnapshotAmbientesLaquila(anterior, atual),
  );
  atual.tables["public.user"] = { alterada: true };
  assert.throws(() => validarDeltaSnapshotAmbientesLaquila(anterior, atual));
});

test("rejeita migration ausente, duplicada ou fora de sequência", () => {
  const ausente = cadeiaValida();
  ausente.entradas.splice(10, 1);
  ausente.migrations.splice(10, 1);
  assert.throws(() =>
    validarSequenciaLocal(ausente.migrations, ausente.entradas),
  );

  const duplicada = cadeiaValida();
  duplicada.entradas[8]!.tag = duplicada.entradas[7]!.tag;
  assert.throws(() =>
    validarSequenciaLocal(duplicada.migrations, duplicada.entradas),
  );

  const quebrada = cadeiaValida();
  quebrada.entradas[12]!.idx = 13;
  assert.throws(() =>
    validarSequenciaLocal(quebrada.migrations, quebrada.entradas),
  );
});

test("rejeita última tag, índice ou correspondência com o journal divergentes", () => {
  const tag = cadeiaValida();
  tag.entradas.at(-1)!.tag = "0036_nao_autorizada";
  assert.throws(() => validarSequenciaLocal(tag.migrations, tag.entradas));

  const indice = cadeiaValida();
  indice.entradas.at(-1)!.idx = 37;
  assert.throws(() =>
    validarSequenciaLocal(indice.migrations, indice.entradas),
  );

  const timestamp = cadeiaValida();
  timestamp.migrations[5]!.folderMillis += 1;
  assert.throws(() =>
    validarSequenciaLocal(timestamp.migrations, timestamp.entradas),
  );
});

test("aceita somente as tabelas e enums da fundação global em 0034", () => {
  const anterior: SnapshotDrizzle = {
    id: "snapshot-33",
    prevId: "snapshot-32",
    tables: { "public.user": { nome: "user" } },
    enums: {},
    schemas: {},
    sequences: {},
    roles: {},
    policies: {},
    views: {},
  };
  const tabelas = [
    "administradores",
    "administradores_funcoes",
    "administradores_permissoes",
    "auditorias_administrativas",
    "convites_administrativos",
    "convites_funcoes",
    "convites_permissoes",
    "funcoes_administrativas",
    "funcoes_permissoes",
    "permissoes_administrativas",
  ];
  const enums = [
    "administrador_status",
    "auditoria_administrativa_resultado",
    "convite_administrativo_status",
    "efeito_permissao_administrador",
    "funcao_administrativa_status",
    "permissao_administrativa_status",
  ];
  const atual: SnapshotDrizzle = {
    ...structuredClone(anterior),
    id: "snapshot-34",
    prevId: anterior.id,
    tables: Object.fromEntries([
      ...Object.entries(anterior.tables),
      ...tabelas.map((nome) => [`public.${nome}`, {}]),
    ]),
    enums: Object.fromEntries(enums.map((nome) => [`public.${nome}`, {}])),
  };

  assert.doesNotThrow(() => validarDeltaSnapshotRbacGlobal(anterior, atual));
  atual.tables["public.user"] = { alterada: true };
  assert.throws(() => validarDeltaSnapshotRbacGlobal(anterior, atual));
});

test("rejeita hash antigo divergente e aceita somente prefixo íntegro do banco", () => {
  const { migrations } = cadeiaValida();
  const aplicadas = migrations.slice(0, 29).map((migration) => ({
    hash: migration.hash,
    createdAt: migration.folderMillis,
  }));
  assert.doesNotThrow(() => validarHistoricoAplicado(aplicadas, migrations));
  aplicadas[4]!.hash = "alterado";
  assert.throws(() => validarHistoricoAplicado(aplicadas, migrations));
});

test("aceita somente o delta autorizado entre os snapshots 0028 e 0029", () => {
  const anterior: SnapshotDrizzle = {
    id: "snapshot-28",
    prevId: "snapshot-26",
    tables: { "public.existente": { nome: "existente" } },
    enums: {},
    schemas: {},
    sequences: {},
    roles: {},
    policies: {},
    views: {},
  };
  const atual: SnapshotDrizzle = {
    ...structuredClone(anterior),
    id: "snapshot-29",
    prevId: anterior.id,
    tables: {
      ...anterior.tables,
      "public.grupo_paginas": {},
      "public.grupos_navegacao": {},
      "public.paginas_dinamicas": {},
    },
    enums: {
      "public.grupo_navegacao_local": {},
      "public.pagina_dinamica_status": {},
    },
  };
  assert.doesNotThrow(() => validarDeltaSnapshots(anterior, atual));
  atual.tables["public.existente"] = { alterada: true };
  assert.throws(() => validarDeltaSnapshots(anterior, atual));
});

test("recusa endpoint de produção e qualquer identidade divergente", () => {
  const esperado = {
    banco: "neondb",
    usuario: "neondb_owner",
    projetoId: "projeto-autorizado",
    branchId: "br-frosty-sea-acjpjuxk",
    endpointId: "ep-quiet-bar-acb7yly2",
  };
  const producao = {
    branchId: "br-lucky-smoke-acg7fz8x",
    endpointId: "ep-proud-bonus-acy2bafx",
  };
  assert.doesNotThrow(() =>
    validarIdentidadeBanco(esperado, esperado, producao),
  );
  assert.throws(() =>
    validarIdentidadeBanco(
      { ...esperado, endpointId: producao.endpointId },
      esperado,
      producao,
    ),
  );
});

test("0058 só cria tabelas de representantes e rejeita mudança de catálogo", () => {
  const anterior = lerSnapshot("0057");
  const atual = lerSnapshot("0058");
  assert.doesNotThrow(() =>
    validarDeltaSnapshotRepresentantes(anterior, atual),
  );
  const adulterado = structuredClone(atual);
  delete adulterado.tables["public.product"];
  assert.throws(
    () => validarDeltaSnapshotRepresentantes(anterior, adulterado),
    /tabelas existentes/,
  );
});

test("0059 altera somente configuração de representantes e estoque informado", () => {
  const anterior = lerSnapshot("0058"),
    atual = lerSnapshot("0059");
  assert.doesNotThrow(() =>
    validarDeltaSnapshotOperacaoRepresentantes(anterior, atual),
  );
  const adulterado = structuredClone(atual);
  adulterado.tables["public.product"] = { alteracao: true };
  assert.throws(() =>
    validarDeltaSnapshotOperacaoRepresentantes(anterior, adulterado),
  );
});
