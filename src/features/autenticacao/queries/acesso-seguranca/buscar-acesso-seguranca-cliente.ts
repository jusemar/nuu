import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { accountTable, userTable } from "@/db/schema";

import {
  apresentarEmailCliente,
  identificarMetodosAcesso,
} from "../../lib/apresentar-identidade-cliente";

export type AcessoSegurancaCliente = {
  email: string | null;
  emailVerificado: boolean;
  telefone: string | null;
  telefoneVerificado: boolean;
  possuiSenha: boolean;
  possuiGoogle: boolean;
};

export async function buscarAcessoSegurancaCliente(
  usuarioId: string,
): Promise<AcessoSegurancaCliente> {
  const [usuario, contas] = await Promise.all([
    db.query.userTable.findFirst({ where: eq(userTable.id, usuarioId) }),
    db
      .select({ provedor: accountTable.providerId })
      .from(accountTable)
      .where(eq(accountTable.userId, usuarioId)),
  ]);

  if (!usuario) throw new Error("Usuário autenticado não encontrado.");
  const metodos = identificarMetodosAcesso(
    contas.map((conta) => conta.provedor),
  );
  return {
    email: apresentarEmailCliente(usuario.email),
    emailVerificado: usuario.emailVerified,
    telefone: usuario.phoneNumber,
    telefoneVerificado: usuario.phoneNumberVerified,
    ...metodos,
  };
}
