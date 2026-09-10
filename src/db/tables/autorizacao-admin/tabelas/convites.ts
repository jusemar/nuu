import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { userTable } from "../../autenticacao";
import {
  conviteAdministrativoStatusEnum,
  conviteAdministrativoTipoIdentificadorEnum,
  efeitoPermissaoAdministradorEnum,
  provaPosseConviteFinalidadeEnum,
} from "../enums";
import {
  administradoresTable,
  funcoesAdministrativasTable,
  permissoesAdministrativasTable,
} from "./principais";

/** Convite de uso único: somente o hash do token é persistido. */
export const convitesAdministrativosTable = pgTable(
  "convites_administrativos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomeDestinatario: text("nome_destinatario").notNull(),
    // Convites históricos preservam o e-mail; convites WhatsApp o deixam nulo.
    emailDestinatario: text("email_destinatario"),
    tipoIdentificador: conviteAdministrativoTipoIdentificadorEnum(
      "tipo_identificador",
    )
      .notNull()
      .default("email"),
    identificadorNormalizado: text("identificador_normalizado"),
    usuarioDestinatarioId: text("usuario_destinatario_id").references(
      () => userTable.id,
      { onDelete: "set null" },
    ),
    emissorAdministradorId: uuid("emissor_administrador_id")
      .notNull()
      .references(() => administradoresTable.id, { onDelete: "restrict" }),
    tokenHash: text("token_hash").notNull(),
    status: conviteAdministrativoStatusEnum("status")
      .notNull()
      .default("pendente"),
    expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
    aceitoEm: timestamp("aceito_em", { withTimezone: true }),
    revogadoEm: timestamp("revogado_em", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("convites_administrativos_token_hash_unique").on(
      table.tokenHash,
    ),
    index("convites_administrativos_email_status_idx").on(
      table.emailDestinatario,
      table.status,
    ),
    index("convites_administrativos_identificador_status_idx").on(
      table.tipoIdentificador,
      table.identificadorNormalizado,
      table.status,
    ),
    index("convites_administrativos_usuario_destinatario_idx").on(
      table.usuarioDestinatarioId,
    ),
    index("convites_administrativos_emissor_idx").on(
      table.emissorAdministradorId,
    ),
    index("convites_administrativos_status_expiracao_idx").on(
      table.status,
      table.expiraEm,
    ),
  ],
);

/** Prova de posse limitada a convite, telefone e contexto seguro. */
export const provasPosseConvitesAdministrativosTable = pgTable(
  "provas_posse_convites_administrativos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conviteId: uuid("convite_id")
      .notNull()
      .references(() => convitesAdministrativosTable.id, { onDelete: "cascade" }),
    telefoneNormalizado: text("telefone_normalizado").notNull(),
    usuarioId: text("usuario_id").references(() => userTable.id, {
      onDelete: "set null",
    }),
    finalidade: provaPosseConviteFinalidadeEnum("finalidade")
      .notNull()
      .default("admin_convite"),
    contextoHash: text("contexto_hash").notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
    confirmadoEm: timestamp("confirmado_em", { withTimezone: true }),
    consumidoEm: timestamp("consumido_em", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("provas_posse_convites_contexto_unique").on(
      table.conviteId,
      table.contextoHash,
    ),
    index("provas_posse_convites_telefone_idx").on(table.telefoneNormalizado),
    index("provas_posse_convites_usuario_idx").on(table.usuarioId),
    index("provas_posse_convites_expiracao_idx").on(table.expiraEm),
  ],
);

/** Funções solicitadas no convite, revalidadas quando ele for consumido. */
export const convitesFuncoesTable = pgTable(
  "convites_funcoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conviteId: uuid("convite_id")
      .notNull()
      .references(() => convitesAdministrativosTable.id, {
        onDelete: "cascade",
      }),
    funcaoId: uuid("funcao_id")
      .notNull()
      .references(() => funcoesAdministrativasTable.id, {
        onDelete: "restrict",
      }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("convites_funcoes_convite_funcao_unique").on(
      table.conviteId,
      table.funcaoId,
    ),
    index("convites_funcoes_funcao_id_idx").on(table.funcaoId),
  ],
);

/** Personalizações solicitadas no convite, sem antecipar sua ativação. */
export const convitesPermissoesTable = pgTable(
  "convites_permissoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conviteId: uuid("convite_id")
      .notNull()
      .references(() => convitesAdministrativosTable.id, {
        onDelete: "cascade",
      }),
    permissaoId: uuid("permissao_id")
      .notNull()
      .references(() => permissoesAdministrativasTable.id, {
        onDelete: "restrict",
      }),
    efeito: efeitoPermissaoAdministradorEnum("efeito").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("convites_permissoes_convite_permissao_unique").on(
      table.conviteId,
      table.permissaoId,
    ),
    index("convites_permissoes_permissao_id_idx").on(table.permissaoId),
  ],
);
