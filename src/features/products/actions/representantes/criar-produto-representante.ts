"use server";

import {
  autorizacoesProdutosRepresentantesTable,
  fornecedorProdutoVinculosTable,
  productPricingTable,
  productTable,
  productVariantTable,
} from "@/db/schema";

import { criarProdutoRepresentanteSchema } from "../../schemas/representantes/produto-representante.schema";
import { executarEscritaRepresentante } from "./executar-escrita-representante";
import {
  auditarEscritaProduto,
  camposProdutoRepresentante,
  gerarIdentificacaoProduto,
  salvarPrecosEIdentificadores,
  validarReferenciasProduto,
} from "./persistir-produto-representante";
import { responderOperacaoProduto } from "./responder-operacao-produto";

/** Cadastro completo e concessão individual são confirmados juntos, ou nada é criado. */
export async function criarProdutoRepresentante(entrada: unknown) {
  return responderOperacaoProduto(async () => {
    const { fornecedorId, dados } =
      criarProdutoRepresentanteSchema.parse(entrada);
    return executarEscritaRepresentante(
      { fornecedorId },
      async ({ tx, ator, vinculoId }) => {
        const { categoria, marca } = await validarReferenciasProduto(tx, dados);
        const identificacao = await gerarIdentificacaoProduto(
          tx,
          dados,
          categoria.name,
          marca.nome,
        );
        const [produto] = await tx
          .insert(productTable)
          .values({
            ...camposProdutoRepresentante(dados),
            ...identificacao,
            brand: marca.nome,
            productKind: "simple",
            salePrice: dados.precoCentavos,
            status: "draft",
            isActive: true,
            storeProductFlags: ["general"],
            allowedDeliveryTypes: [],
            allowsOwnDelivery: false,
            disponibilidadeEntregaPropria: "desativado",
            allowsPickup: false,
            allowsSupplierDelivery: false,
          })
          .returning();
        const [variante] = await tx
          .insert(productVariantTable)
          .values({
            productId: produto.id,
            sku: produto.sku,
            name: dados.nome,
            attributes: {},
            priceInCents: dados.precoCentavos,
            stockQuantity: 0,
            isActive: true,
            isDefault: true,
          })
          .returning();
        await tx.insert(productPricingTable).values({
          productId: produto.id,
          type: "dropshipping",
          price: dados.precoCentavos,
          mainCardPrice: true,
          isActive: true,
        });
        await tx.insert(fornecedorProdutoVinculosTable).values({
          fornecedorId,
          produtoId: produto.id,
          codigoFornecedor: dados.codigoFornecedor || null,
          estoqueInformadoFornecedor: dados.estoque,
          tipoVinculo: "manual",
          status: "ativo",
        });
        await tx.insert(autorizacoesProdutosRepresentantesTable).values({
          representanteFornecedorId: vinculoId,
          produtoId: produto.id,
          ativa: true,
          criadoPorUsuarioId: ator.userId,
          atualizadoPorUsuarioId: ator.userId,
        });
        await salvarPrecosEIdentificadores(
          tx,
          produto.id,
          variante.id,
          fornecedorId,
          dados,
        );
        await auditarEscritaProduto(
          tx,
          ator,
          produto.id,
          fornecedorId,
          "produto_criado",
        );
        return {
          produtoId: produto.id,
          versao: produto.updatedAt.toISOString(),
        };
      },
    );
  });
}
