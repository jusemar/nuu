import "server-only";

import { eq } from "drizzle-orm";

import { enderecosClientesTable, perfisClientesTable } from "@/db/schema";
import { db } from "@/db/connection";

import { verificarCadastroClienteCompleto } from "../../lib/verificar-cadastro-cliente-completo";
import type { CadastroClienteCompleto } from "../../types/cadastro-cliente.types";

export async function buscarCadastroClientePorUsuarioId(
  usuarioId: string,
): Promise<CadastroClienteCompleto> {
  const perfil = await db.query.perfisClientesTable.findFirst({
    where: eq(perfisClientesTable.userId, usuarioId),
  });

  const enderecoPrincipal = perfil
    ? await db.query.enderecosClientesTable.findFirst({
        where: eq(enderecosClientesTable.perfilClienteId, perfil.id),
      })
    : null;

  const cadastro = {
    perfil: perfil
      ? {
          id: perfil.id,
          usuarioId: perfil.userId,
          tipoPessoa: perfil.tipoPessoa,
          nomeCompleto: perfil.nomeCompleto,
          documento: perfil.documento,
          telefone: perfil.telefone,
          dataNascimento: perfil.dataNascimento,
          observacaoCliente: perfil.observacaoCliente,
          perfilCompleto: perfil.perfilCompleto,
          criadoEm: perfil.createdAt,
          atualizadoEm: perfil.updatedAt,
        }
      : null,
    enderecoPrincipal: enderecoPrincipal
      ? {
          id: enderecoPrincipal.id,
          usuarioId: enderecoPrincipal.userId,
          perfilClienteId: enderecoPrincipal.perfilClienteId,
          cep: enderecoPrincipal.cep,
          rua: enderecoPrincipal.rua,
          numero: enderecoPrincipal.numero,
          complemento: enderecoPrincipal.complemento,
          bairro: enderecoPrincipal.bairro,
          cidade: enderecoPrincipal.cidade,
          estado: enderecoPrincipal.estado,
          autorizarEntregaVizinho: enderecoPrincipal.autorizarEntregaVizinho,
          nomeVizinho: enderecoPrincipal.nomeVizinho,
          observacaoVizinho: enderecoPrincipal.observacaoVizinho,
          principal: enderecoPrincipal.principal,
          criadoEm: enderecoPrincipal.createdAt,
          atualizadoEm: enderecoPrincipal.updatedAt,
        }
      : null,
    completo: false,
  };

  return {
    ...cadastro,
    completo: verificarCadastroClienteCompleto(cadastro),
  };
}
