import type { SessaoClienteAutenticado } from "../types/sessao-cliente.types";
import { emailEhTecnicoTelefone } from "./email-tecnico-telefone-compartilhado";

type SessaoBetterAuth = {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    createdAt: Date | string;
  };
  session: {
    createdAt: Date | string;
    expiresAt: Date;
  };
};

export function mapearSessaoCliente(
  sessao: SessaoBetterAuth | null | undefined,
): SessaoClienteAutenticado | null {
  if (!sessao?.user) {
    return null;
  }

  return {
    usuario: {
      id: sessao.user.id,
      nome: sessao.user.name,
      email: emailEhTecnicoTelefone(sessao.user.email) ? "" : sessao.user.email,
      imagem: sessao.user.image ?? null,
      criadoEm: new Date(sessao.user.createdAt),
    },
    criadoEm: new Date(sessao.session.createdAt),
    expiraEm: sessao.session.expiresAt,
  };
}
