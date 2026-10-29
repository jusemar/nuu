import "server-only";

import { z } from "zod";

import { obterContextoAdministrativo } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import { podeAcessarProdutoRepresentante } from "../../lib/representantes/autorizar-produto-representante";
import type {
  ContextoRepresentante,
  OperacaoProdutoRepresentante,
} from "../../types/representantes/autorizacao-representante.types";
import {
  buscarAutorizacoesProdutoRepresentante,
  buscarVinculosRepresentante,
} from "./buscar-escopo-representante";

const recursoSchema = z
  .object({
    fornecedorId: z.uuid(),
    produtoId: z.uuid(),
  })
  .strict();

/** Não recebe usuário/contexto do cliente e não mantém cache entre acessos. */
export async function obterContextoRepresentante(): Promise<ContextoRepresentante> {
  const administrativo = await obterContextoAdministrativo();
  const vinculos =
    administrativo.situacao === "ativo" &&
    !administrativo.administradorPrincipal
      ? await buscarVinculosRepresentante(administrativo.userId)
      : [];
  return { administrativo, vinculos };
}

/** Fundação para a Etapa 3: nenhuma action legada passa a chamar este guard. */
export async function exigirAcessoProdutoRepresentante(
  operacao: OperacaoProdutoRepresentante,
  entrada: unknown,
) {
  // A action futura fixa a operação no servidor; o formulário só fornece IDs.
  const recurso = {
    ...recursoSchema.parse(entrada),
    operacao: z.enum(["visualizar", "administrar"]).parse(operacao),
  };
  const contexto = await obterContextoRepresentante();
  const administrativo = contexto.administrativo;
  const autorizacoes =
    administrativo.situacao === "ativo" &&
    !administrativo.administradorPrincipal
      ? await buscarAutorizacoesProdutoRepresentante(
          administrativo.userId,
          recurso.fornecedorId,
          recurso.produtoId,
        )
      : [];
  if (!podeAcessarProdutoRepresentante(contexto, recurso, autorizacoes)) {
    // Mesmo erro para ID inexistente, alheio ou revogado: não revela o catálogo.
    throw new Error("ACESSO_PRODUTO_REPRESENTANTE_NEGADO");
  }
  return { contexto, recurso };
}
