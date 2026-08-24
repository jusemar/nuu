import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { userTable } from "@/db/tables/autenticacao";
import { executarBootstrapPrincipalPorUsuarioId } from "@/features/autenticacao/lib/autorizacao-admin/bootstrap-principal-admin";
import { emailPossuiPermissaoAdmin } from "@/features/autenticacao/lib/permissoes-admin";

const usuarioProprietarioId = process.env.PROPRIETARIO_ADMIN_USER_ID?.trim();
if (!usuarioProprietarioId) {
  throw new Error("PROPRIETARIO_ADMIN_USER_ID_NAO_INFORMADO");
}

/** O script apenas reutiliza identidade existente; nunca cria `user`. */
export const execucao = db.query.userTable
  .findFirst({
    columns: { email: true, id: true },
    where: eq(userTable.id, usuarioProprietarioId),
  })
  .then(async (usuario) => {
    if (!usuario) throw new Error("USUARIO_BETTER_AUTH_NAO_ENCONTRADO");
    if (!emailPossuiPermissaoAdmin(usuario.email)) {
      throw new Error("PROPRIETARIO_FORA_DE_ADMIN_EMAILS");
    }
    const resultado = await executarBootstrapPrincipalPorUsuarioId(usuario.id);
    console.log("[rbac-global] Bootstrap do principal concluído.", {
      administradorId: resultado.administradorId,
      alterado: resultado.alterado,
      criado: resultado.criado,
      userId: usuario.id,
      versaoAutorizacao: resultado.versaoAutorizacao,
    });
  });
