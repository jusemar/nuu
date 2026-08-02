import "server-only";

import { createHash } from "node:crypto";

import { buscarSessaoCliente } from "@/features/autenticacao/queries/sessao/buscar-sessao-cliente";

import type {
  ContextoSeguroFerramenta,
  ResolvedorSessaoFerramenta,
} from "../../types/ferramentas-protegidas";

export class ResolvedorSessaoExistente implements ResolvedorSessaoFerramenta {
  async resolver(contexto: ContextoSeguroFerramenta) {
    const sessao = await buscarSessaoCliente();
    if (
      !sessao ||
      !contexto.usuarioIdEsperado ||
      sessao.usuario.id !== contexto.usuarioIdEsperado ||
      sessao.expiraEm <= new Date()
    ) {
      return null;
    }
    return {
      expiraEm: sessao.expiraEm,
      referenciaHash: createHash("sha256")
        .update(`${sessao.usuario.id}:${sessao.expiraEm.toISOString()}`)
        .digest("hex"),
      usuarioId: sessao.usuario.id,
    };
  }
}
