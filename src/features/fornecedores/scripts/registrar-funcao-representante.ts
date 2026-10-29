import { and, eq } from "drizzle-orm";

import {
  funcoesAdministrativasTable,
  funcoesPermissoesTable,
  permissoesAdministrativasTable,
} from "@/db/tables/autorizacao-admin";
import {
  dbTransacional,
  encerrarBancoTransacionalIntegracao,
} from "@/db/transaction";
import { PRESETS_ADMINISTRATIVOS_INICIAIS } from "@/features/administradores/constants/presets-administrativos";
import { CATALOGO_PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";

/** Registro explícito e aditivo do modelo de função; nunca associa pessoas a ele. */
async function registrar() {
  const preset = PRESETS_ADMINISTRATIVOS_INICIAIS.find(
    ({ chave }) => chave === "representante_fornecedor",
  );
  if (!preset) throw new Error("PRESET_REPRESENTANTE_AUSENTE");
  await dbTransacional.transaction(async (transacao) => {
    await transacao
      .insert(funcoesAdministrativasTable)
      .values({
        chave: preset.chave,
        nome: preset.nome,
        descricao: preset.descricao,
        funcaoSistema: true,
      })
      .onConflictDoNothing();
    const [funcao] = await transacao
      .select()
      .from(funcoesAdministrativasTable)
      .where(eq(funcoesAdministrativasTable.chave, preset.chave));
    // Recusa um preset já personalizado em vez de ampliar/remover acessos silenciosamente.
    const existentes = await transacao
      .select({ chave: permissoesAdministrativasTable.chave })
      .from(funcoesPermissoesTable)
      .innerJoin(
        permissoesAdministrativasTable,
        eq(
          permissoesAdministrativasTable.id,
          funcoesPermissoesTable.permissaoId,
        ),
      )
      .where(eq(funcoesPermissoesTable.funcaoId, funcao.id));
    if (
      existentes.some(
        ({ chave }) =>
          !preset.permissoes.some((permitida) => permitida === chave),
      )
    )
      throw new Error("PRESET_REPRESENTANTE_COM_PERMISSOES_INESPERADAS");
    for (const chave of preset.permissoes) {
      const definicao = CATALOGO_PERMISSOES_ADMIN.find(
        (item) => item.chave === chave,
      );
      if (!definicao) throw new Error("PERMISSAO_REPRESENTANTE_AUSENTE");
      await transacao
        .insert(permissoesAdministrativasTable)
        .values(definicao)
        .onConflictDoNothing();
      const [permissao] = await transacao
        .select()
        .from(permissoesAdministrativasTable)
        .where(
          and(
            eq(permissoesAdministrativasTable.chave, chave),
            eq(permissoesAdministrativasTable.status, "ativa"),
          ),
        );
      if (!permissao) throw new Error("PERMISSAO_REPRESENTANTE_DESATIVADA");
      await transacao
        .insert(funcoesPermissoesTable)
        .values({ funcaoId: funcao.id, permissaoId: permissao.id })
        .onConflictDoNothing();
    }
  });
  console.log(
    "[representantes] Modelo de função registrado; nenhum usuário recebeu acesso.",
  );
}

registrar()
  .catch((erro: unknown) => {
    console.error(
      erro instanceof Error ? erro.message : "FALHA_REGISTRO_REPRESENTANTE",
    );
    process.exitCode = 1;
  })
  .finally(encerrarBancoTransacionalIntegracao);
