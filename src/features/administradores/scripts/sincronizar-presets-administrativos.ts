import { count, eq, inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  administradoresTable,
  funcoesAdministrativasTable,
  funcoesPermissoesTable,
  permissoesAdministrativasTable,
} from "@/db/tables/autorizacao-admin";

import { PRESETS_ADMINISTRATIVOS_INICIAIS } from "../constants/presets-administrativos";

/** Comando explícito: cria somente presets e vínculos ausentes, sem apagar personalizações. */
async function sincronizarPresetsAdministrativos() {
  for (const preset of PRESETS_ADMINISTRATIVOS_INICIAIS) {
    await db
      .insert(funcoesAdministrativasTable)
      .values({
        chave: preset.chave,
        descricao: preset.descricao,
        funcaoSistema: true,
        nome: preset.nome,
        status: "ativa",
      })
      .onConflictDoNothing({ target: funcoesAdministrativasTable.chave });

    const funcao = await db.query.funcoesAdministrativasTable.findFirst({
      columns: { id: true },
      where: eq(funcoesAdministrativasTable.chave, preset.chave),
    });
    const permissoes = await db
      .select({ id: permissoesAdministrativasTable.id })
      .from(permissoesAdministrativasTable)
      .where(
        inArray(permissoesAdministrativasTable.chave, [...preset.permissoes]),
      );
    if (!funcao || permissoes.length !== preset.permissoes.length) {
      throw new Error(`PRESET_INCOMPLETO:${preset.chave}`);
    }

    await db
      .insert(funcoesPermissoesTable)
      .values(
        permissoes.map(({ id }) => ({
          funcaoId: funcao.id,
          permissaoId: id,
        })),
      )
      .onConflictDoNothing();
  }

  console.log(
    `[rbac] ${PRESETS_ADMINISTRATIVOS_INICIAIS.length} presets administrativos sincronizados.`,
  );
  const [{ totalAdministradores }] = await db
    .select({ totalAdministradores: count() })
    .from(administradoresTable);
  console.log(
    `[rbac] administradores existentes preservados: ${totalAdministradores}.`,
  );
}

sincronizarPresetsAdministrativos().catch((erro) => {
  console.error("[rbac] Falha ao sincronizar presets administrativos.", erro);
  process.exitCode = 1;
});
