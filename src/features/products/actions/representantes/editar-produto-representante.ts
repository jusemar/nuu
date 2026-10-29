"use server";

import { eq } from "drizzle-orm";

import { fornecedorProdutoVinculosTable, productTable } from "@/db/schema";

import { editarProdutoRepresentanteSchema } from "../../schemas/representantes/produto-representante.schema";
import { executarEscritaRepresentante } from "./executar-escrita-representante";
import {
  auditarEscritaProduto,
  camposProdutoRepresentante,
  exigirVinculoComercialProduto,
  salvarPrecosEIdentificadores,
  validarReferenciasProduto,
} from "./persistir-produto-representante";
import { responderOperacaoProduto } from "./responder-operacao-produto";

export async function editarProdutoRepresentante(entrada: unknown) {
  return responderOperacaoProduto(async () => {
    const { fornecedorId, produtoId, versao, dados } =
      editarProdutoRepresentanteSchema.parse(entrada);
    return executarEscritaRepresentante(
      { fornecedorId, produtoId, versao },
      async ({ tx, ator, varianteId }) => {
        const { marca } = await validarReferenciasProduto(tx, dados);
        const vinculo = await exigirVinculoComercialProduto(
          tx,
          fornecedorId,
          produtoId,
        );
        const [produto] = await tx
          .update(productTable)
          .set({
            ...camposProdutoRepresentante(dados),
            brand: marca.nome,
            salePrice: dados.precoCentavos,
            ...(dados.slug ? { slug: dados.slug } : {}),
            updatedAt: new Date(),
          })
          .where(eq(productTable.id, produtoId))
          .returning();
        await tx
          .update(fornecedorProdutoVinculosTable)
          .set({
            codigoFornecedor: dados.codigoFornecedor || null,
            estoqueInformadoFornecedor: dados.estoque,
            atualizadoEm: new Date(),
          })
          .where(eq(fornecedorProdutoVinculosTable.id, vinculo.id));
        await salvarPrecosEIdentificadores(
          tx,
          produtoId,
          varianteId!,
          fornecedorId,
          dados,
        );
        await auditarEscritaProduto(
          tx,
          ator,
          produtoId,
          fornecedorId,
          "produto_editado",
        );
        return { produtoId, versao: produto.updatedAt.toISOString() };
      },
    );
  });
}
