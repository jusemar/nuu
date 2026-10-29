"use server";

import { eq } from "drizzle-orm";

import {
  fornecedorProdutoVinculosTable,
  productPricingTable,
  productTable,
  productVariantTable,
} from "@/db/schema";

import { editarCampoRepresentanteSchema } from "../../schemas/representantes/produto-representante.schema";
import { executarEscritaRepresentante } from "./executar-escrita-representante";
import {
  auditarEscritaProduto,
  exigirVinculoComercialProduto,
} from "./persistir-produto-representante";
import { responderOperacaoProduto } from "./responder-operacao-produto";

/** Inline possui contrato próprio: não encaminha payload parcial à edição global. */
export async function editarCampoProdutoRepresentante(entrada: unknown) {
  return responderOperacaoProduto(async () => {
    const { fornecedorId, produtoId, versao, alteracao } =
      editarCampoRepresentanteSchema.parse(entrada);
    return executarEscritaRepresentante(
      { fornecedorId, produtoId, versao },
      async ({ tx, ator, varianteId }) => {
        const vinculo = await exigirVinculoComercialProduto(
          tx,
          fornecedorId,
          produtoId,
        );
        const [produto] = await tx
          .update(productTable)
          .set({
            updatedAt: new Date(),
            ...(alteracao.campo === "nome"
              ? { name: alteracao.valor }
              : alteracao.campo === "precoCentavos"
                ? { salePrice: alteracao.valor }
                : {}),
          })
          .where(eq(productTable.id, produtoId))
          .returning();
        if (alteracao.campo === "nome")
          await tx
            .update(productVariantTable)
            .set({ name: alteracao.valor, updatedAt: new Date() })
            .where(eq(productVariantTable.id, varianteId!));
        if (alteracao.campo === "precoCentavos") {
          await tx
            .update(productPricingTable)
            .set({ price: alteracao.valor, updatedAt: new Date() })
            .where(eq(productPricingTable.productId, produtoId));
          await tx
            .update(productVariantTable)
            .set({ priceInCents: alteracao.valor, updatedAt: new Date() })
            .where(eq(productVariantTable.id, varianteId!));
        }
        if (alteracao.campo === "estoque")
          await tx
            .update(fornecedorProdutoVinculosTable)
            .set({
              estoqueInformadoFornecedor: alteracao.valor,
              atualizadoEm: new Date(),
            })
            .where(eq(fornecedorProdutoVinculosTable.id, vinculo.id));
        await auditarEscritaProduto(
          tx,
          ator,
          produtoId,
          fornecedorId,
          `produto_${alteracao.campo}_alterado`,
        );
        return { produtoId, versao: produto.updatedAt.toISOString() };
      },
    );
  });
}
