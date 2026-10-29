import "server-only";

import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import {
  auditoriasAdministrativasTable,
  categoryTable,
  fornecedorProdutoVinculosTable,
  marcaTable,
  productPricingTable,
  productTable,
  productVariantTable,
} from "@/db/schema";

import { gerarSkuDisponivel } from "../../lib/gerar-sku-disponivel";
import type { DadosProdutoRepresentante } from "../../schemas/representantes/produto-representante.schema";
import {
  removerIdentificadorManualNaoVerificado,
  salvarIdentificadorCatalogo,
} from "../salvar-identificador-catalogo";
import type { TransacaoProdutosRepresentante } from "./executar-escrita-representante";

export async function validarReferenciasProduto(
  tx: TransacaoProdutosRepresentante,
  dados: DadosProdutoRepresentante,
) {
  const [categoria] = await tx
    .select()
    .from(categoryTable)
    .where(eq(categoryTable.id, dados.categoriaId))
    .for("share");
  const [marca] = await tx
    .select()
    .from(marcaTable)
    .where(eq(marcaTable.id, dados.marcaId))
    .for("share");
  if (!categoria?.isActive || !marca?.ativo)
    throw new Error("Selecione categoria e marca existentes e ativas.");
  return { categoria, marca };
}
export function camposProdutoRepresentante(dados: DadosProdutoRepresentante) {
  return {
    name: dados.nome,
    categoryId: dados.categoriaId,
    marcaId: dados.marcaId,
    description: dados.descricao,
    ncmCode: dados.ncm || null,
    weight: dados.pesoGramas,
    height: dados.alturaCm,
    width: dados.larguraCm,
    length: dados.comprimentoCm,
    warrantyPeriod: dados.garantiaDias,
    warrantyProvider: dados.garantiaResponsavel || null,
    metaTitle: dados.metaTitulo || null,
    metaDescription: dados.metaDescricao || null,
  };
}
export async function gerarIdentificacaoProduto(
  tx: TransacaoProdutosRepresentante,
  dados: DadosProdutoRepresentante,
  categoria: string,
  marca: string,
) {
  const sku = await gerarSkuDisponivel({
    nomeCategoria: categoria,
    nomeMarca: marca,
    skuExiste: async (codigo) =>
      (
        await tx
          .select({ id: productVariantTable.id })
          .from(productVariantTable)
          .where(eq(productVariantTable.sku, codigo))
          .limit(1)
      ).length > 0 ||
      (
        await tx
          .select({ id: productTable.id })
          .from(productTable)
          .where(eq(productTable.sku, codigo))
          .limit(1)
      ).length > 0,
  });
  const trecho =
    dados.nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 160) || "produto";
  return { sku, slug: dados.slug || `${trecho}-${randomUUID().slice(0, 8)}` };
}
export async function exigirVinculoComercialProduto(
  tx: TransacaoProdutosRepresentante,
  fornecedorId: string,
  produtoId: string,
) {
  const vinculos = await tx
    .select()
    .from(fornecedorProdutoVinculosTable)
    .where(
      and(
        eq(fornecedorProdutoVinculosTable.fornecedorId, fornecedorId),
        eq(fornecedorProdutoVinculosTable.produtoId, produtoId),
      ),
    )
    .for("update");
  if (vinculos.length !== 1 || vinculos[0].status !== "ativo")
    throw new Error(
      "Vínculo comercial ausente ou ambíguo. Solicite revisão ao gestor.",
    );
  return vinculos[0];
}
export async function salvarPrecosEIdentificadores(
  tx: TransacaoProdutosRepresentante,
  produtoId: string,
  varianteId: string,
  fornecedorId: string,
  dados: DadosProdutoRepresentante,
) {
  await tx
    .update(productPricingTable)
    .set({
      price: dados.precoCentavos,
      deliveryDays: dados.prazo,
      pricingModalDescription: dados.prazo,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(productPricingTable.productId, produtoId),
        eq(productPricingTable.type, "dropshipping"),
      ),
    );
  await tx
    .update(productVariantTable)
    .set({
      name: dados.nome,
      priceInCents: dados.precoCentavos,
      weightInGrams: dados.pesoGramas,
      heightInCm: dados.alturaCm,
      widthInCm: dados.larguraCm,
      lengthInCm: dados.comprimentoCm,
      updatedAt: new Date(),
    })
    .where(eq(productVariantTable.id, varianteId));
  for (const tipo of ["gtin", "mpn"] as const) {
    const valor = tipo === "gtin" ? dados.gtin : dados.mpn;
    const escopo = tipo === "gtin" ? { varianteId } : { produtoId };
    if (valor) {
      const resultado = await salvarIdentificadorCatalogo({
        ...escopo,
        tipo,
        valor,
        marcaId: dados.marcaId,
        origem: "manual_admin",
        fornecedorId,
        executor: tx,
      });
      if (resultado.situacao === "conflito")
        throw new Error(
          "Identificador em conflito. Solicite revisão ao gestor.",
        );
    } else
      await removerIdentificadorManualNaoVerificado({
        ...escopo,
        tipo,
        executor: tx,
      });
  }
}
export async function auditarEscritaProduto(
  tx: TransacaoProdutosRepresentante,
  ator: { administradorId: string },
  produtoId: string,
  fornecedorId: string,
  acao: string,
) {
  await tx.insert(auditoriasAdministrativasTable).values({
    atorAdministradorId: ator.administradorId,
    acao: `representantes.${acao}`,
    recursoTipo: "produto",
    recursoId: produtoId,
    resultado: "sucesso",
    metadados: { fornecedorId },
  });
}
