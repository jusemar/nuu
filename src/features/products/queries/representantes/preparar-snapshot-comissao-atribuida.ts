import "server-only";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import {
  administradoresTable,
  autorizacoesProdutosRepresentantesTable,
  fornecedoresTable,
  productAttributeTable,
  productPricingTable,
  productTable,
  productVariantTable,
  representantesFornecedoresTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { exigirGestorRepresentantes } from "@/features/fornecedores/queries/representantes/exigir-gestor-representantes";

import { criarSnapshotComissaoRepresentante } from "../../lib/comissoes-representantes/criar-snapshot-comissao-representante";
import { validarEstruturaProdutoRepresentante } from "../../lib/representantes/validar-estrutura-produto-representante";
import {
  atribuicaoComissaoSchema,
  itemVendidoComissaoSchema,
} from "../../schemas/comissoes-representantes/comissao-representante.schema";

/** Adaptador interno do gestor; não é Server Action nem é chamado pelo checkout.
 * Recebe uma única atribuição explícita, valida a relação atual e congela sua regra.
 * Uma futura integração de pedidos precisará definir seu próprio ator confiável.
 */
export async function prepararSnapshotComissaoAtribuida(entrada: unknown) {
  const ator = await exigirGestorRepresentantes();
  const dados = z
    .object({
      atribuicao: atribuicaoComissaoSchema.nullable(),
      item: itemVendidoComissaoSchema,
      ocorridoEm: z.iso.datetime(),
    })
    .strict()
    .parse(entrada);
  const atribuicao = dados.atribuicao;
  if (!atribuicao) return null;
  return dbTransacional.transaction(async (tx) => {
    const [gestorAtual] = await tx
      .select()
      .from(administradoresTable)
      .where(eq(administradoresTable.id, ator.administradorId))
      .for("share");
    if (
      !gestorAtual ||
      gestorAtual.usuarioId !== ator.userId ||
      gestorAtual.status !== "ativo" ||
      !gestorAtual.administradorPrincipal
    )
      throw new Error("Gestão de comissão indisponível.");
    const [fornecedor] = await tx
      .select()
      .from(fornecedoresTable)
      .where(eq(fornecedoresTable.id, atribuicao.fornecedorId))
      .for("share");
    const [vinculo] = await tx
      .select()
      .from(representantesFornecedoresTable)
      .where(
        and(
          eq(
            representantesFornecedoresTable.id,
            atribuicao.representanteFornecedorId,
          ),
          eq(
            representantesFornecedoresTable.usuarioId,
            atribuicao.representanteId,
          ),
          eq(
            representantesFornecedoresTable.fornecedorId,
            atribuicao.fornecedorId,
          ),
        ),
      )
      .for("share");
    const [autorizacao] = await tx
      .select()
      .from(autorizacoesProdutosRepresentantesTable)
      .where(
        and(
          eq(
            autorizacoesProdutosRepresentantesTable.id,
            atribuicao.autorizacaoId,
          ),
          eq(
            autorizacoesProdutosRepresentantesTable.representanteFornecedorId,
            atribuicao.representanteFornecedorId,
          ),
          eq(
            autorizacoesProdutosRepresentantesTable.produtoId,
            atribuicao.produtoId,
          ),
        ),
      )
      .for("share");
    if (
      fornecedor?.status !== "ativo" ||
      !vinculo?.ativo ||
      !autorizacao?.ativa ||
      !autorizacao.comissaoAtiva ||
      !autorizacao.comissaoTipo ||
      autorizacao.comissaoValor === null
    )
      throw new Error("Atribuição ou comissão indisponível.");
    if (new Date(dados.ocorridoEm).getTime() < autorizacao.updatedAt.getTime())
      throw new Error(
        "Venda anterior à regra atual exige o snapshot original, nunca a configuração de hoje.",
      );
    const [produto] = await tx
      .select()
      .from(productTable)
      .where(eq(productTable.id, atribuicao.produtoId))
      .for("share");
    if (!produto) throw new Error("Produto indisponível.");
    const precos = await tx
      .select()
      .from(productPricingTable)
      .where(eq(productPricingTable.productId, produto.id))
      .for("share");
    const variantes = await tx
      .select()
      .from(productVariantTable)
      .where(eq(productVariantTable.productId, produto.id))
      .for("share");
    const atributos = await tx
      .select({ id: productAttributeTable.id })
      .from(productAttributeTable)
      .where(eq(productAttributeTable.productId, produto.id));
    validarEstruturaProdutoRepresentante({
      produto,
      precos,
      variantes,
      quantidadeAtributos: atributos.length,
    });
    return criarSnapshotComissaoRepresentante({
      atribuicao,
      item: dados.item,
      ocorridoEm: dados.ocorridoEm,
      regra: {
        atribuicao,
        versao: autorizacao.updatedAt.toISOString(),
        ativa: autorizacao.comissaoAtiva,
        regra: {
          tipo: autorizacao.comissaoTipo,
          valor: autorizacao.comissaoValor,
        },
      },
    });
  });
}
