import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { podeAdmin } from "@/features/autenticacao/lib/autorizacao-admin/resolver-autorizacao-admin";

import type {
  AutorizacaoProdutoRepresentante,
  ContextoRepresentante,
  RecursoProdutoRepresentante,
} from "../../types/representantes/autorizacao-representante.types";

/** Política pura. Não usa associação comercial nem interpreta ausência como acesso global. */
export function podeAcessarProdutoRepresentante(
  contexto: ContextoRepresentante,
  recurso: RecursoProdutoRepresentante,
  autorizacoes: readonly AutorizacaoProdutoRepresentante[],
): boolean {
  const administrativo = contexto.administrativo;
  if (administrativo.situacao !== "ativo") return false;
  if (recurso.operacao !== "visualizar" && recurso.operacao !== "administrar")
    return false;
  if (!recurso.produtoId || !recurso.fornecedorId) return false;
  const permissaoGlobal =
    recurso.operacao === "visualizar"
      ? PERMISSOES_ADMIN.PRODUTOS.VISUALIZAR
      : PERMISSOES_ADMIN.PRODUTOS.ADMINISTRAR;
  // O gestor principal preserva sua política atual, inclusive catálogo desativado.
  if (administrativo.administradorPrincipal)
    return podeAdmin(administrativo, permissaoGlobal);
  // Etapa 3 aprovada somente para leitura; a capacidade de escrita fica reservada.
  if (recurso.operacao !== "visualizar") return false;
  const permissao = PERMISSOES_ADMIN.REPRESENTANTES_PRODUTOS.VISUALIZAR;
  if (!podeAdmin(administrativo, permissao)) return false;
  return contexto.vinculos.some(
    (vinculo) =>
      vinculo.usuarioId === administrativo.userId &&
      vinculo.fornecedorId === recurso.fornecedorId &&
      vinculo.ativo &&
      vinculo.fornecedorAtivo &&
      autorizacoes.some(
        (autorizacao) =>
          autorizacao.ativa &&
          autorizacao.representanteFornecedorId === vinculo.id &&
          autorizacao.produtoId === recurso.produtoId,
      ),
  );
}
