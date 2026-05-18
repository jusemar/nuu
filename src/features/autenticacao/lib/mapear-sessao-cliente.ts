import type { SessaoClienteAutenticado } from "../types/sessao-cliente.types";

type SessaoBetterAuth = {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    createdAt: Date | string;
  };
  session: {
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
      email: sessao.user.email,
      imagem: sessao.user.image ?? null,
      criadoEm: new Date(sessao.user.createdAt),
    },
    expiraEm: sessao.session.expiresAt,
  };
}
