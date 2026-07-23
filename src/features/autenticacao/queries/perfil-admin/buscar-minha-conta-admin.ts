import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { userTable } from "@/db/schema";

import { formatarWhatsappAdmin } from "../../lib/normalizar-whatsapp-admin";
import { buscarSessaoAdmin } from "../sessao/buscar-sessao-admin";

export async function buscarMinhaContaAdmin() {
  const acesso = await buscarSessaoAdmin();
  const usuarioId = acesso.autorizado ? acesso.sessao?.user.id : null;

  if (!usuarioId) return null;

  const usuario = await db.query.userTable.findFirst({
    columns: { name: true, email: true, whatsapp: true },
    where: eq(userTable.id, usuarioId),
  });

  if (!usuario) return null;

  return {
    nome: usuario.name,
    email: usuario.email,
    whatsapp: formatarWhatsappAdmin(usuario.whatsapp),
  };
}
