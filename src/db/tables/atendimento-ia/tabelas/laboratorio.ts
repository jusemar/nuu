import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { userTable } from "../../autenticacao";
import {
  atendimentoIaLaboratorioModoExecucaoEnum,
  atendimentoIaLaboratorioResultadoEnum,
  atendimentoIaLaboratorioStatusEnum,
  atendimentoIaLaboratorioTipoComparacaoEnum,
} from "../enums";
import { atendimentoIaComportamentoVersoesTable } from "./comportamento";
import { atendimentoIaDocumentoVersoesTable } from "./conhecimento";
import {
  atendimentoIaCasoTesteVersoesTable,
  atendimentoIaConjuntosTesteTable,
} from "./testes";

export const atendimentoIaExecucoesLaboratorioTable = pgTable(
  "atendimento_ia_execucoes_laboratorio",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tipoComparacao:
      atendimentoIaLaboratorioTipoComparacaoEnum("tipo_comparacao").notNull(),
    modoExecucao:
      atendimentoIaLaboratorioModoExecucaoEnum("modo_execucao").notNull(),
    versaoPublicadaConhecimentoId: uuid(
      "versao_publicada_conhecimento_id",
    ).references(() => atendimentoIaDocumentoVersoesTable.id, {
      onDelete: "restrict",
    }),
    versaoCandidataConhecimentoId: uuid(
      "versao_candidata_conhecimento_id",
    ).references(() => atendimentoIaDocumentoVersoesTable.id, {
      onDelete: "restrict",
    }),
    versaoPublicadaComportamentoId: uuid(
      "versao_publicada_comportamento_id",
    ).references(() => atendimentoIaComportamentoVersoesTable.id, {
      onDelete: "restrict",
    }),
    versaoCandidataComportamentoId: uuid(
      "versao_candidata_comportamento_id",
    ).references(() => atendimentoIaComportamentoVersoesTable.id, {
      onDelete: "restrict",
    }),
    conjuntoTesteId: uuid("conjunto_teste_id").references(
      () => atendimentoIaConjuntosTesteTable.id,
      { onDelete: "restrict" },
    ),
    casoTesteVersaoId: uuid("caso_teste_versao_id").references(
      () => atendimentoIaCasoTesteVersoesTable.id,
      { onDelete: "restrict" },
    ),
    status: atendimentoIaLaboratorioStatusEnum("status")
      .notNull()
      .default("pendente"),
    configuracaoCongelada: jsonb("configuracao_congelada")
      .$type<Record<string, unknown>>()
      .notNull(),
    hashesCongelados: jsonb("hashes_congelados")
      .$type<Record<string, string>>()
      .notNull(),
    chaveIdempotencia: text("chave_idempotencia").notNull(),
    solicitadoPorId: text("solicitado_por_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    iniciadoEm: timestamp("iniciado_em"),
    concluidoEm: timestamp("concluido_em"),
    canceladoEm: timestamp("cancelado_em"),
    custoEstimado: numeric("custo_estimado", { precision: 12, scale: 6 })
      .notNull()
      .default("0"),
    tokensEntrada: integer("tokens_entrada").notNull().default(0),
    tokensSaida: integer("tokens_saida").notNull().default(0),
    erroSanitizado: text("erro_sanitizado"),
    expiraEm: timestamp("expira_em").notNull(),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("atendimento_ia_execucoes_lab_idempotencia_unique").on(
      t.chaveIdempotencia,
    ),
    index("atendimento_ia_execucoes_lab_status_criado_idx").on(
      t.status,
      t.criadoEm,
    ),
    index("atendimento_ia_execucoes_lab_expira_idx").on(t.expiraEm),
  ],
);

export const atendimentoIaResultadosLaboratorioTable = pgTable(
  "atendimento_ia_resultados_laboratorio",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    execucaoLaboratorioId: uuid("execucao_laboratorio_id")
      .notNull()
      .references(() => atendimentoIaExecucoesLaboratorioTable.id, {
        onDelete: "cascade",
      }),
    casoTesteVersaoId: uuid("caso_teste_versao_id")
      .notNull()
      .references(() => atendimentoIaCasoTesteVersoesTable.id, {
        onDelete: "restrict",
      }),
    respostaPublicada: text("resposta_publicada").notNull(),
    respostaCandidata: text("resposta_candidata").notNull(),
    conhecimentosUsadosPublicada: jsonb("conhecimentos_usados_publicada")
      .$type<string[]>()
      .notNull(),
    conhecimentosUsadosCandidata: jsonb("conhecimentos_usados_candidata")
      .$type<string[]>()
      .notNull(),
    conflitos: jsonb("conflitos").$type<string[]>().notNull(),
    fontesAusentes: jsonb("fontes_ausentes").$type<string[]>().notNull(),
    ferramentasSolicitadas: jsonb("ferramentas_solicitadas")
      .$type<string[]>()
      .notNull(),
    ferramentasSimuladas: jsonb("ferramentas_simuladas")
      .$type<string[]>()
      .notNull(),
    necessidadeConsultaReal: boolean("necessidade_consulta_real")
      .notNull()
      .default(false),
    violacoes: jsonb("violacoes").$type<string[]>().notNull(),
    resultadoAutomatico: atendimentoIaLaboratorioResultadoEnum(
      "resultado_automatico",
    ).notNull(),
    decisaoHumana: atendimentoIaLaboratorioResultadoEnum("decisao_humana"),
    comentarioAvaliador: text("comentario_avaliador"),
    avaliadorId: text("avaliador_id").references(() => userTable.id, {
      onDelete: "set null",
    }),
    tokens: integer("tokens").notNull().default(0),
    duracao: integer("duracao").notNull().default(0),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (t) => [
    index("atendimento_ia_resultados_lab_execucao_idx").on(
      t.execucaoLaboratorioId,
    ),
    uniqueIndex("atendimento_ia_resultados_lab_execucao_caso_unique").on(
      t.execucaoLaboratorioId,
      t.casoTesteVersaoId,
    ),
  ],
);
