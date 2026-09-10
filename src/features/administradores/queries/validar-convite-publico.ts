import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { convitesAdministrativosTable } from "@/db/tables/autorizacao-admin";
import { mascararTelefoneWhatsapp } from "@/features/comunicacao/whatsapp/lib/mascarar-telefone-whatsapp";

import {
  calcularHashTokenConvite,
  compararHashTokenConvite,
} from "../lib/token-convite-administrativo";
import { tokenConviteSchema } from "../schemas/convites-administrativos.schema";

export type EstadoConvitePublico = "valido" | "invalido";

export async function validarConvitePublico(tokenEntrada: string): Promise<{
  estado: EstadoConvitePublico;
  emailMascarado?: string;
  nome?: string;
  telefoneMascarado?: string;
  tipoIdentificador?: "email" | "whatsapp";
}> {
  const validacao = tokenConviteSchema.safeParse(tokenEntrada);
  if (!validacao.success) return { estado: "invalido" };
  const token = validacao.data;
  const convite = await db.query.convitesAdministrativosTable.findFirst({
    columns: {
      emailDestinatario: true,
      expiraEm: true,
      nomeDestinatario: true,
      identificadorNormalizado: true,
      status: true,
      tokenHash: true,
      tipoIdentificador: true,
    },
    where: eq(
      convitesAdministrativosTable.tokenHash,
      calcularHashTokenConvite(token),
    ),
  });
  if (
    !convite ||
    !compararHashTokenConvite(token, convite.tokenHash) ||
    convite.status !== "pendente" ||
    convite.expiraEm <= new Date()
  )
    return { estado: "invalido" };
  if (convite.tipoIdentificador === "whatsapp") {
    if (!convite.identificadorNormalizado) return { estado: "invalido" };
    return {
      estado: "valido",
      nome: convite.nomeDestinatario,
      telefoneMascarado: mascararTelefoneWhatsapp(
        convite.identificadorNormalizado,
      ),
      tipoIdentificador: "whatsapp",
    };
  }
  const [inicio, dominio = ""] = (convite.emailDestinatario ?? "").split("@");
  return {
    estado: "valido",
    emailMascarado: `${inicio?.slice(0, 2) ?? "**"}***@${dominio}`,
    nome: convite.nomeDestinatario,
    tipoIdentificador: "email",
  };
}
