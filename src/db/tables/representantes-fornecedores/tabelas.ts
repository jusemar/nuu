import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { productTable } from "../../table/products/products";
import { userTable } from "../autenticacao/tabelas/usuarios";
import { fornecedoresTable } from "../fornecedores/tabelas/fornecedores";

/** Identidade e fornecedor continuam existentes; este vínculo não concede RBAC. */
export const representantesFornecedoresTable = pgTable(
  "representantes_fornecedores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: text("usuario_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    fornecedorId: uuid("fornecedor_id")
      .notNull()
      .references(() => fornecedoresTable.id, { onDelete: "restrict" }),
    // A criação exige ativação explícita pelo gestor. Revogar preserva o usuário.
    ativo: boolean("ativo").notNull().default(false),
    criadoPorUsuarioId: text("criado_por_usuario_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    atualizadoPorUsuarioId: text("atualizado_por_usuario_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (tabela) => [
    uniqueIndex("representantes_fornecedores_usuario_fornecedor_unico").on(
      tabela.usuarioId,
      tabela.fornecedorId,
    ),
    index("representantes_fornecedores_fornecedor_ativo_idx").on(
      tabela.fornecedorId,
      tabela.ativo,
    ),
  ],
);

/** Liberação individual: outro representante do MESMO fornecedor não a herda. */
export const autorizacoesProdutosRepresentantesTable = pgTable(
  "autorizacoes_produtos_representantes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    representanteFornecedorId: uuid("representante_fornecedor_id")
      .notNull()
      .references(() => representantesFornecedoresTable.id, {
        onDelete: "restrict",
      }),
    produtoId: uuid("produto_id")
      .notNull()
      .references(() => productTable.id, { onDelete: "restrict" }),
    ativa: boolean("ativa").notNull().default(false),
    // Configuração comercial, exclusivamente do gestor. Não registra vendas/ganhos.
    comissaoTipo: text("comissao_tipo").$type<"percentual" | "fixa">(),
    comissaoValor: integer("comissao_valor"), // pontos-base ou centavos
    comissaoVisivel: boolean("comissao_visivel").notNull().default(false),
    criadoPorUsuarioId: text("criado_por_usuario_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    atualizadoPorUsuarioId: text("atualizado_por_usuario_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (tabela) => [
    uniqueIndex("autorizacoes_representantes_vinculo_produto_unico").on(
      tabela.representanteFornecedorId,
      tabela.produtoId,
    ),
    index("autorizacoes_representantes_produto_idx").on(tabela.produtoId),
    check(
      "autorizacoes_comissao_valida",
      sql`(
      (${tabela.comissaoTipo} IS NULL AND ${tabela.comissaoValor} IS NULL AND NOT ${tabela.comissaoVisivel}) OR
      (${tabela.comissaoTipo} = 'percentual' AND ${tabela.comissaoValor} IS NOT NULL AND ${tabela.comissaoValor} BETWEEN 0 AND 10000) OR
      (${tabela.comissaoTipo} = 'fixa' AND ${tabela.comissaoValor} IS NOT NULL AND ${tabela.comissaoValor} >= 0)
    ) IS TRUE`,
    ),
  ],
);
