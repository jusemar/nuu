import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("migration de permissões permanece alinhada às garantias do schema", () => {
  const migration = readFileSync("drizzle/0007_right_lucky_pierre.sql", "utf8");
  const schema = readFileSync(
    "src/db/tables/atendimento-ia/tabelas/permissoes-admin.ts",
    "utf8",
  );
  for (const trecho of [
    "atendimento_ia_papel_admin",
    "atendimento_ia_papeis_admin",
    "usuario_id",
    "capacidades_adicionais",
    "atribuido_por_id",
    "revogado_por_id",
    "atendimento_ia_papeis_admin_usuario_ativo_unique",
  ])
    assert.match(migration, new RegExp(trecho));
  assert.match(schema, /atendimentoIaPapelAdminEnum/);
  assert.match(schema, /onDelete: "restrict"/);
});
